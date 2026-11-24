import importlib.util
import json
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


spec = importlib.util.spec_from_file_location(
    "agent_runner", Path(__file__).with_name("agent_runner.py")
)
agent_runner = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, {"anthropic": types.ModuleType("anthropic")}):
    spec.loader.exec_module(agent_runner)


def response(stop_reason, *blocks):
    return types.SimpleNamespace(
        stop_reason=stop_reason,
        content=[types.SimpleNamespace(type=kind, text=text) for kind, text in blocks],
    )


class AskModelTests(unittest.TestCase):
    def setUp(self):
        self.create = Mock()
        client = types.SimpleNamespace(messages=types.SimpleNamespace(create=self.create))
        self.anthropic = patch.object(
            agent_runner.anthropic, "Anthropic", return_value=client, create=True
        )
        self.anthropic.start()
        self.addCleanup(self.anthropic.stop)

    def test_complete_plan_is_returned_without_retry(self):
        self.create.return_value = response("end_turn", ("thinking", ""), ("text", " Plan "))
        self.assertEqual(agent_runner.ask_model("plan", {}, "Regeln"), "Plan")
        self.assertEqual(self.create.call_count, 1)
        self.assertEqual(self.create.call_args.kwargs["max_tokens"], 6000)

    def test_plan_uses_a_single_budget_without_retry_of_the_whole_context(self):
        self.create.return_value = response("max_tokens", ("text", "Unvollständig"))
        with self.assertRaisesRegex(ValueError, "stop_reason='max_tokens'"):
            agent_runner.ask_model("plan", {}, "Regeln")
        self.assertEqual([call.kwargs["max_tokens"] for call in self.create.call_args_list], [6000])

    def test_empty_plan_fails_after_the_single_attempt(self):
        self.create.return_value = response("end_turn")
        with self.assertRaises(ValueError):
            agent_runner.ask_model("plan", {}, "Regeln")
        self.assertEqual(self.create.call_count, 1)

    def test_other_stop_reason_is_not_retried(self):
        self.create.return_value = response("refusal", ("text", "Ablehnung"))
        with self.assertRaisesRegex(ValueError, "stop_reason='refusal'"):
            agent_runner.ask_model("plan", {}, "Regeln")
        self.assertEqual(self.create.call_count, 1)

    def test_truncated_implementation_is_retried_with_larger_budget(self):
        self.create.side_effect = [
            response("max_tokens", ("text", '{"web/src/main.js":')),
            response("end_turn", ("text", '{"web/src/main.js":"vollständig"}')),
        ]
        self.assertEqual(
            agent_runner.ask_model("implement", {}, "Regeln"),
            '{"web/src/main.js":"vollständig"}',
        )
        self.assertEqual(
            [call.kwargs["max_tokens"] for call in self.create.call_args_list],
            [4096, 8192],
        )

    def test_incomplete_implementation_after_retry_fails_without_partial_text(self):
        self.create.return_value = response("max_tokens", ("text", "{}"))
        with self.assertRaisesRegex(ValueError, "stop_reason='max_tokens'"):
            agent_runner.ask_model("implement", {}, "Regeln")
        self.assertEqual(
            [call.kwargs["max_tokens"] for call in self.create.call_args_list],
            [4096, 8192],
        )


STAGE = """---
tag: 6
datum: "2027-09-13"
titel: Dalmatien
start: Zadar
ziel: Split
koordinaten_start: [44.1, 15.2]
koordinaten_ziel: [43.5, 16.4]
kilometer: 190
fahrzeit: 4 h
hoehenmeter: 1200
gpx_datei: assets/gpx/tag-06.gpx
highlights: [Küstenstraße]
bilder: []
videos: []
---
Text.
"""


def plan_with(*lines):
    items = "\n".join(lines)
    return (
        f"## Umsetzungsplan\n**Betroffene Datei(en):**\n{items}\n"
        "**Geplante Änderungen:**\n- `.github/workflows/x.yml` wird hier nur erwähnt.\n"
    )


class TemporaryRoot(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name).resolve()
        patcher = patch.object(agent_runner, "ROOT", self.root)
        patcher.start()
        self.addCleanup(patcher.stop)

    def write(self, path, text="x"):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")
        return target


class PathPolicyTests(unittest.TestCase):
    def test_app_wide_text_paths_are_allowed(self):
        for path in (
            "content/tag-06.md", "content/tag-22.md", "web/index.html", "web/src/main.js",
            "web/src/style.css", "web/public/sw.js", "web/public/manifest.json",
            "web/tests/features.test.js", "config/settings.json",
        ):
            with self.subTest(path=path):
                self.assertEqual(agent_runner.validate_repo_path(path), path)

    def test_system_private_and_unlisted_paths_are_rejected(self):
        for path in (
            ".github/workflows/ai-agent-workflow.yml", ".github/scripts/agent_runner.py",
            ".github/agents/riderrix.agent.md", "config/commands/plan-item.md",
            "config/Commands/implement-item.md", "config/skills/plan-item/SKILL.md",
            "docs/V5/todo_plan_v5.md", "export/ARBEITSSTAND.md", ".env", "web/.env.js",
            "web/src/secrets/key.js", "web/node_modules/leaflet/index.js", "web/dist/index.html",
            "web/package.json", "web/package-lock.json", "web/vite.config.js", "README.md",
            "content/tag-23.md", "content/tag-00.md", "content/notizen.md", "assets/x.md",
        ):
            with self.subTest(path=path), self.assertRaises(ValueError):
                agent_runner.validate_repo_path(path)

    def test_traversal_absolute_and_non_canonical_paths_are_rejected(self):
        for path in (
            "/etc/passwd", "../web/src/main.js", "web/../.github/x.yml", "web/src//main.js",
            "web/src/./main.js", "web\\src\\main.js", "web/src/", "web/src/main.js\n",
            "web/src/\x00.js", "", None, 7,
        ):
            with self.subTest(path=path), self.assertRaises(ValueError):
                agent_runner.validate_repo_path(path)

    def test_binary_and_unknown_formats_are_rejected(self):
        for path in ("web/public/icon-192.png", "web/src/data.bin", "web/src/Makefile"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                agent_runner.validate_repo_path(path)


class PlannedPathsTests(unittest.TestCase):
    def test_multi_component_plan_lists_each_file(self):
        plan = plan_with(
            "- `web/src/main.js` – neue Anzeige",
            "- `web/tests/features.test.js` – Test",
            "- `content/tag-06.md`",
        )
        self.assertEqual(
            agent_runner.planned_paths(plan),
            {"web/src/main.js", "web/tests/features.test.js", "content/tag-06.md"},
        )

    def test_only_the_affected_files_section_counts(self):
        plan = plan_with("- `web/src/main.js`")
        self.assertEqual(agent_runner.planned_paths(plan), {"web/src/main.js"})
        self.assertEqual(agent_runner.planned_paths("## Umsetzungsplan\nKeine Liste"), set())

    def test_one_forbidden_path_rejects_the_whole_plan(self):
        for forbidden in (
            "- `.github/workflows/ai-agent-workflow.yml`", "- `docs/V5/x.md`",
            "- `export/ARBEITSSTAND.md`", "- `../outside.js`", "- `config/commands/plan-item.md`",
        ):
            with self.subTest(forbidden=forbidden), self.assertRaises(ValueError):
                agent_runner.planned_paths(plan_with("- `web/src/main.js`", forbidden))

    def test_ambiguous_lines_never_widen_the_approval(self):
        plan = plan_with("- `web/src/main.js`", "- `web/src/a.js` und `.github/x.yml`", "- web/src/b.js")
        self.assertEqual(agent_runner.planned_paths(plan), {"web/src/main.js"})

    def test_directories_and_globs_are_not_an_approval(self):
        plan = plan_with("- `web/src/`", "- `web/src/*.js`")
        with self.assertRaises(ValueError):
            agent_runner.planned_paths(plan)

    def test_file_count_is_limited(self):
        lines = [f"- `web/src/module{index}.js`" for index in range(agent_runner.MAX_PLANNED_FILES + 1)]
        with self.assertRaises(ValueError):
            agent_runner.planned_paths(plan_with(*lines))


class FileAccessTests(TemporaryRoot):
    def test_allowed_listing_skips_private_system_binary_and_symlinked_files(self):
        for path in (
            "content/tag-01.md", "content/notizen.md", "web/src/a.js", "web/public/icon.png",
            "web/node_modules/x/y.js", "web/dist/z.js", "web/package.json",
            "config/ok.json", "config/commands/plan-item.md", "docs/secret.md",
        ):
            self.write(path)
        (self.root / "web/src/link.js").symlink_to(self.root / "web/src/a.js")
        self.assertEqual(
            agent_runner.list_allowed_files(),
            ["config/ok.json", "content/tag-01.md", "web/src/a.js"],
        )

    def test_new_file_needs_an_existing_directory_and_no_symlink(self):
        self.write("web/src/a.js")
        self.assertEqual(
            agent_runner.safe_target("web/src/new.js"), self.root / "web/src/new.js"
        )
        with self.assertRaises(ValueError):
            agent_runner.safe_target("web/src/neu/new.js")
        (self.root / "web/src/link.js").symlink_to(self.root / "web/src/a.js")
        with self.assertRaises(ValueError):
            agent_runner.safe_target("web/src/link.js")
        outside = tempfile.TemporaryDirectory()
        self.addCleanup(outside.cleanup)
        (self.root / "web/public").symlink_to(outside.name, target_is_directory=True)
        with self.assertRaises(ValueError):
            agent_runner.safe_target("web/public/sw.js")

    def test_read_files_returns_only_existing_files_within_the_size_limit(self):
        self.write("web/src/a.js", "abc")
        self.assertEqual(agent_runner.read_files(["web/src/a.js", "web/src/b.js"]), {"web/src/a.js": "abc"})
        with self.assertRaises(ValueError):
            agent_runner.read_files(["web/src/a.js"], limit=2)
        with self.assertRaises(ValueError):
            agent_runner.read_files([".github/workflows/ai-agent-workflow.yml"])

    def test_reference_tests_are_listed_by_name_only(self):
        self.write("web/tests/reference.test.js", "reference")
        self.write("web/tests/approved.test.js", "approved")
        self.assertEqual(
            agent_runner.list_reference_tests({"web/tests/approved.test.js"}),
            ["web/tests/reference.test.js"],
        )


class ValidatedChangesTests(TemporaryRoot):
    def setUp(self):
        super().setUp()
        self.write("web/src/main.js", "old\n")
        self.write("web/tests/existing.test.js")
        self.write("web/public/sw.js")
        self.write("content/tag-06.md", STAGE)

    def changes(self, mapping, paths=None, files=None):
        return agent_runner.validated_changes(
            json.dumps(mapping), paths or set(mapping), files or {}
        )

    def test_multiple_edits_apply_sequentially_and_new_files_use_content(self):
        files = {"web/src/main.js": "alpha\nbeta\ngamma\n"}
        result = self.changes(
            {
                "web/src/main.js": {"edits": [
                    {"search": "alpha", "replace": "ALPHA"},
                    {"search": "ALPHA\nbeta", "replace": "ALPHA\nBETA"},
                ]},
                "web/tests/neu.test.js": {"content": "test\n"},
            },
            files=files,
        )
        self.assertEqual(result, {
            "web/src/main.js": "ALPHA\nBETA\ngamma\n", "web/tests/neu.test.js": "test\n",
        })

    def test_edit_search_must_match_exactly_once(self):
        files = {"web/src/main.js": "a\na\nb\n"}
        for search, pattern in (("fehlt", "nicht gefunden"), ("a", "2-mal")):
            with self.subTest(search=search), self.assertRaisesRegex(
                ValueError, rf"web/src/main\.js.*{pattern}"
            ):
                self.changes(
                    {"web/src/main.js": {"edits": [{"search": search, "replace": "x"}]}},
                    files=files,
                )

    def test_malformed_edits_are_rejected(self):
        files = {"web/src/main.js": "a\n"}
        for spec in (
            {"edits": []}, {"edits": [{"search": "", "replace": "x"}]},
            {"edits": [{"search": "a"}]}, {"edits": "a"}, {"foo": 1},
        ):
            with self.subTest(spec=spec), self.assertRaises(ValueError):
                self.changes({"web/src/main.js": spec}, files=files)
        with self.assertRaisesRegex(ValueError, "content"):
            self.changes({"web/src/neu.js": {"edits": [{"search": "a", "replace": "b"}]}})

    def test_approved_app_and_test_files_are_accepted_with_trailing_newline(self):
        result = self.changes(
            {"web/src/main.js": "new", "web/tests/main.test.js": "test\n\n"},
            files={"web/src/main.js": "old\n"},
        )
        self.assertEqual(result, {"web/src/main.js": "new\n", "web/tests/main.test.js": "test\n"})

    def test_unapproved_or_forbidden_paths_reject_the_entire_result(self):
        approved = {"web/src/main.js"}
        for extra in (
            "web/tests/other.test.js", ".github/workflows/ai-agent-workflow.yml",
            ".github/scripts/agent_runner.py", "config/commands/plan-item.md",
            "docs/x.md", "export/x.md", "../x.js", "/tmp/x.js",
        ):
            with self.subTest(extra=extra), self.assertRaises(ValueError):
                self.changes({"web/src/main.js": "new", extra: "x"}, approved)

    def test_empty_unchanged_or_non_text_results_are_rejected(self):
        files = {"web/src/main.js": "old\n"}
        with self.assertRaisesRegex(
            ValueError,
            r"Das Modell hat keine Änderungen zurückgegeben \(\{\}\).*allowed_paths",
        ):
            agent_runner.validated_changes("{}", {"web/src/main.js"}, files)
        for raw in ("[]", json.dumps({"web/src/main.js": "old"}),
                    json.dumps({"web/src/main.js": 5}), json.dumps({"web/src/main.js": "  "}),
                    json.dumps({"web/src/main.js": "a\x00b"}), "kein json"):
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                agent_runner.validated_changes(raw, {"web/src/main.js"}, files)

    def test_unapproved_paths_have_a_distinct_error_from_empty_changes(self):
        with self.assertRaisesRegex(ValueError, "ausschließlich freigegebenen Pfaden"):
            agent_runner.validated_changes(
                json.dumps({"web/src/other.js": "x"}),
                {"web/src/main.js"},
                {},
            )

    def test_structured_files_must_stay_valid(self):
        with self.assertRaises(ValueError):
            self.changes({"web/public/manifest.json": "{kaputt"})
        self.assertEqual(self.changes({"web/public/manifest.json": "{}"}), {"web/public/manifest.json": "{}\n"})

    def test_stage_files_keep_the_stage_schema_while_app_files_do_not(self):
        with self.assertRaisesRegex(ValueError, "V4"):
            self.changes({"content/tag-06.md": "---\ntag: 6\n---\nText\n"})
        changed = STAGE.replace("Text.", "Neuer Text.")
        self.assertEqual(
            self.changes({"content/tag-06.md": changed}, files={"content/tag-06.md": STAGE}),
            {"content/tag-06.md": changed},
        )
        without_media = STAGE.replace("bilder: []", "bilder: [{datei: a.jpg, beschreibung: Bild}]")
        with self.assertRaisesRegex(ValueError, "nicht geleert"):
            self.changes({"content/tag-06.md": STAGE}, files={"content/tag-06.md": without_media})

    def test_changeset_size_is_limited(self):
        with patch.object(agent_runner, "MAX_CHANGESET_BYTES", 5):
            with self.assertRaises(ValueError):
                self.changes({"web/src/main.js": "123456789"})


class EventGateTests(unittest.TestCase):
    def event(self, body="/implement-item", user="boss", pull_request=False):
        issue = {"number": 3, "user": {"login": "boss"}}
        if pull_request:
            issue["pull_request"] = {}
        return {
            "action": "created", "issue": issue,
            "comment": {"user": {"login": user}, "body": body},
        }

    def test_all_approved_modes_need_the_authorized_approval_comment(self):
        for mode in ("implement", "publish", "report"):
            with self.subTest(mode=mode):
                agent_runner.validate_event(mode, "issue_comment", self.event(), "boss", 3)
                for bad in (
                    self.event(user="mallory"), self.event(body="/plan-item"),
                    self.event(body="bitte /implement-item"), self.event(pull_request=True),
                ):
                    with self.assertRaises(ValueError):
                        agent_runner.validate_event(mode, "issue_comment", bad, "boss", 3)
                with self.assertRaises(ValueError):
                    agent_runner.validate_event(mode, "issues", self.event(), "boss", 3)

    def test_unknown_modes_and_mismatched_issue_numbers_are_rejected(self):
        with self.assertRaises(ValueError):
            agent_runner.validate_event("deploy", "issue_comment", self.event(), "boss", 3)
        with self.assertRaises(ValueError):
            agent_runner.validate_event("implement", "issue_comment", self.event(), "boss", 4)


class BranchTests(TemporaryRoot):
    def test_only_approved_files_are_staged_committed_and_pushed(self):
        self.write("web/src/main.js", "old\n")
        calls = []
        with patch.object(agent_runner, "git", side_effect=lambda *args: calls.append(args)), \
                patch.object(agent_runner, "git_paths", return_value={"web/src/main.js"}):
            agent_runner.commit_branch({"number": 7}, {"web/src/main.js": "new\n"})
        self.assertEqual((self.root / "web/src/main.js").read_text(encoding="utf-8"), "new\n")
        self.assertEqual(calls[0], ("switch", "-c", "feature/issue-7"))
        self.assertIn(("add", "--", "web/src/main.js"), calls)
        self.assertEqual(calls[-1][:2], ("push", "origin"))

    def test_unexpected_staged_files_stop_before_commit_and_push(self):
        self.write("web/src/main.js", "old\n")
        calls = []
        with patch.object(agent_runner, "git", side_effect=lambda *args: calls.append(args)), \
                patch.object(agent_runner, "git_paths", return_value={"web/src/main.js", "docs/x.md"}):
            with self.assertRaises(ValueError):
                agent_runner.commit_branch({"number": 7}, {"web/src/main.js": "new\n"})
        self.assertFalse(any(call[0] in {"commit", "push"} for call in calls))

    def test_branch_diff_must_stay_within_the_approved_paths(self):
        issue = {"number": 7}
        approved = {"web/src/main.js", "web/tests/main.test.js"}
        with patch.object(agent_runner, "git_paths", return_value={"web/src/main.js"}):
            self.assertEqual(agent_runner.verify_branch_diff(issue, approved), ["web/src/main.js"])
        for changed in (
            set(), {"web/src/main.js", "web/src/extra.js"}, {".github/workflows/ai-agent-workflow.yml"},
            {"web/src/main.js", ".github/scripts/agent_runner.py"},
        ):
            with self.subTest(changed=changed), \
                    patch.object(agent_runner, "git_paths", return_value=changed):
                with self.assertRaises(ValueError):
                    agent_runner.verify_branch_diff(issue, approved)


class RunnerFlowTests(TemporaryRoot):
    environment = {
        "GITHUB_SERVER_URL": "https://github.com", "REPOSITORY": "o/r", "GITHUB_RUN_ID": "9",
        "ALLOWED_GITHUB_USER": "boss", "ISSUE_NUMBER": "3", "GITHUB_TOKEN": "token",
        "GITHUB_EVENT_NAME": "issue_comment",
    }
    issue = {"number": 3, "title": "App", "body": "Text", "state": "open", "user": {"login": "boss"}}

    def run_main(self, mode, plan=None):
        self.write("web/src/main.js", "old\n")
        self.write("web/tests/existing.test.js")
        event = self.root / "event.json"
        event.write_text(json.dumps({
            "action": "created", "issue": {"number": 3, "user": {"login": "boss"}},
            "comment": {"id": 20, "user": {"login": "boss"}, "body": "/implement-item"},
        }), encoding="utf-8")
        marker = agent_runner.plan_marker(self.issue)
        comments = [
            {"id": 10, "user": {"login": agent_runner.BOT, "type": "Bot"}, "body": f"{plan}\n{marker}\n"},
            {"id": 20, "user": {"login": "boss", "type": "User"}, "body": "/implement-item"},
        ]
        posted = []

        def fake_api(session, method, url, **kwargs):
            if method == "POST":
                posted.append((url, kwargs["json"]))
                return Mock(json=Mock(return_value={"html_url": "https://github.com/o/r/pull/1"}))
            return Mock(json=Mock(return_value=self.issue))

        env = {**self.environment, "MODE": mode, "GITHUB_EVENT_PATH": str(event)}
        with patch.dict(os.environ, env), patch.object(agent_runner, "api", fake_api), \
                patch.object(agent_runner, "get_comments", return_value=comments):
            try:
                agent_runner.main()
                error = None
            except Exception as caught:
                error = caught
        return posted, error

    def test_report_mode_tells_that_no_pull_request_was_opened(self):
        posted, error = self.run_main("report")
        self.assertIsNone(error)
        self.assertIn("kein Pull Request", posted[0][1]["body"])

    def test_generation_with_a_forbidden_planned_path_fails_without_model_call(self):
        plan = plan_with("- `web/src/main.js`", "- `.github/workflows/ai-agent-workflow.yml`")
        with patch.object(agent_runner, "ask_model") as ask, \
                patch.object(agent_runner, "commit_branch") as commit:
            posted, error = self.run_main("implement", plan)
        self.assertIsInstance(error, ValueError)
        ask.assert_not_called()
        commit.assert_not_called()
        self.assertIn("fehlgeschlagen", posted[0][1]["body"])

    def test_generation_sends_only_approved_files_and_commits_validated_changes(self):
        self.write("web/src/style.css", "private-looking but unapproved")
        plan = plan_with("- `web/src/main.js` – Änderung", "- `web/tests/main.test.js` – neu")
        raw = json.dumps({"web/src/main.js": "new", "web/tests/main.test.js": "test"})
        with patch.object(agent_runner, "ask_model", return_value=raw) as ask, \
                patch.object(agent_runner, "commit_branch") as commit:
            posted, error = self.run_main("implement", plan)
        self.assertIsNone(error)
        context = ask.call_args.args[1]
        self.assertEqual(context["allowed_paths"], ["web/src/main.js", "web/tests/main.test.js"])
        self.assertEqual(context["files"], {"web/src/main.js": "old\n"})
        self.assertEqual(context["reference_test_files"], ["web/tests/existing.test.js"])
        self.assertNotIn("reference_tests", context)
        self.assertNotIn("web/tests/existing.test.js", context["allowed_paths"])
        self.assertEqual(commit.call_args.args[1], {"web/src/main.js": "new\n", "web/tests/main.test.js": "test\n"})
        self.assertEqual(posted, [])

    def test_generation_rejects_changes_outside_the_approved_plan(self):
        plan = plan_with("- `web/src/main.js`")
        raw = json.dumps({"web/src/main.js": "new", "web/src/style.css": "x"})
        with patch.object(agent_runner, "ask_model", return_value=raw), \
                patch.object(agent_runner, "commit_branch") as commit:
            posted, error = self.run_main("implement", plan)
        self.assertIsInstance(error, ValueError)
        commit.assert_not_called()

    def test_publish_opens_the_pull_request_only_after_the_diff_matches_the_plan(self):
        plan = plan_with("- `web/src/main.js`")
        with patch.object(agent_runner, "git_paths", return_value={"web/src/main.js"}):
            posted, error = self.run_main("publish", plan)
        self.assertIsNone(error)
        pr = posted[0][1]
        self.assertEqual((posted[0][0].endswith("/pulls"), pr["head"], pr["base"]),
                         (True, "feature/issue-3", "main"))
        self.assertIn("web/src/main.js", pr["body"])
        self.assertIn("Closes #3", pr["body"])
        with patch.object(agent_runner, "git_paths", return_value={"web/src/main.js", "docs/x.md"}):
            posted, error = self.run_main("publish", plan)
        self.assertIsInstance(error, ValueError)
        self.assertFalse(posted[0][0].endswith("/pulls"))

    def test_plan_with_forbidden_path_is_rejected_before_it_is_posted(self):
        self.write("content/tag-01.md", STAGE)
        bad_plan = plan_with("- `.github/scripts/agent_runner.py`") + agent_runner.PLAN_FOOTER
        with patch.object(agent_runner, "ask_model", return_value=bad_plan):
            with self.assertRaises(ValueError):
                agent_runner.plan_comment(self.issue)
        good_plan = plan_with("- `web/src/main.js`").rstrip() + "\n" + agent_runner.PLAN_FOOTER
        self.write("web/src/main.js", "old\n")
        with patch.object(agent_runner, "ask_model", return_value=good_plan) as ask:
            comment = agent_runner.plan_comment(self.issue)
        self.assertIn(agent_runner.plan_marker(self.issue), comment)
        context = ask.call_args.args[1]
        self.assertEqual(sorted(context["files"]), ["web/src/main.js"])
        self.assertEqual(context["file_list"], ["content/tag-01.md", "web/src/main.js"])
        self.assertNotIn("logistik", ask.call_args.args[1])

    def test_plan_with_intro_text_and_altered_footer_is_normalized(self):
        self.write("web/src/main.js", "old\n")
        body = plan_with("- `web/src/main.js`").rstrip()
        for answer in (
            "Gerne, hier der Plan:\n\n" + body + "\n" + agent_runner.PLAN_FOOTER,
            "Hier der Plan:\n" + body + "\n\n*Freigabe erteilen: kommentiere /implement-item.*",
            body,
        ):
            with self.subTest(answer=answer[-40:]), \
                    patch.object(agent_runner, "ask_model", return_value=answer):
                comment = agent_runner.plan_comment(self.issue)
            self.assertTrue(comment.startswith("## Umsetzungsplan\n"))
            self.assertTrue(comment.endswith(agent_runner.PLAN_FOOTER))
            self.assertEqual(comment.count("Freigabe erteilen"), 1)
            self.assertIn(agent_runner.plan_marker(self.issue), comment)
        with patch.object(agent_runner, "ask_model", return_value="Kein Plan hier"):
            with self.assertRaises(ValueError):
                agent_runner.plan_comment(self.issue)
        bad = "Intro\n" + plan_with("- `.github/scripts/agent_runner.py`")
        with patch.object(agent_runner, "ask_model", return_value=bad):
            with self.assertRaises(ValueError):
                agent_runner.plan_comment(self.issue)


class CollectContextTests(TemporaryRoot):
    def issue(self, title, body=""):
        return {"title": title, "body": body}

    def setUp(self):
        super().setUp()
        self.write("content/tag-06.md", STAGE)
        self.write("content/tag-07.md", STAGE.replace("Zadar", "Mostar").replace("Split", "Sarajevo"))
        self.write("web/src/main.js", "m" * 100)
        self.write("web/src/style.css", "s" * 100)
        self.write("web/tests/features.test.js", "t")
        self.write("config/settings.json", "{}")

    def test_stage_issue_loads_only_matching_days_but_lists_every_path(self):
        context = agent_runner.collect_context(self.issue("Tag 6 überarbeiten"))
        self.assertEqual(sorted(context["files"]), ["content/tag-06.md"])
        self.assertEqual(len(context["file_list"]), 6)
        context = agent_runner.collect_context(self.issue("Highlights", "Etappe nach Sarajevo"))
        self.assertEqual(sorted(context["files"]), ["content/tag-07.md"])

    def test_ui_issue_loads_app_files_but_no_stages(self):
        context = agent_runner.collect_context(self.issue("Neuer Button in der Karte"))
        self.assertEqual(
            sorted(context["files"]),
            ["web/src/main.js", "web/src/style.css", "web/tests/features.test.js"],
        )

    def test_unrelated_issue_loads_no_file_contents(self):
        context = agent_runner.collect_context(self.issue("Danke", "Alles gut"))
        self.assertEqual(context["files"], {})
        self.assertIn("web/src/main.js", context["file_list"])

    def test_context_stays_within_the_plan_budget(self):
        with patch.object(agent_runner, "PLAN_CONTEXT_BYTES", 150):
            context = agent_runner.collect_context(self.issue("CSS Layout der Karte"))
        self.assertLessEqual(sum(len(text) for text in context["files"].values()), 150)
        self.assertEqual(agent_runner.PLAN_CONTEXT_BYTES, 45000)


if __name__ == "__main__":
    unittest.main()
