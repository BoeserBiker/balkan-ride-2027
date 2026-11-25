import copy
import importlib.util
import json
import os
import subprocess
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
            [16000, 32000],
        )

    def test_incomplete_implementation_after_retry_fails_without_partial_text(self):
        self.create.return_value = response("max_tokens", ("text", "{}"))
        with self.assertRaisesRegex(ValueError, "stop_reason='max_tokens'"):
            agent_runner.ask_model("implement", {}, "Regeln")
        self.assertEqual(
            [call.kwargs["max_tokens"] for call in self.create.call_args_list],
            [16000, 32000],
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


COMPLETE_LINES = (
    "- `web/src/main.js` – Änderung",
    "- `web/tests/main.test.js` – neu",
    "- `web/public/sw.js` – Cache-Version",
    "- `web/public/version.json` – Versionsverlauf",
)


def complete_plan_text(level="sichtbar", lines=COMPLETE_LINES):
    """Vollständiger Plan nach A02: Pflichtdateien und Versionsstufe sind vorhanden."""
    plan = plan_with(*lines)
    return plan.replace(
        "**Geplante Änderungen:**\n", f"**Geplante Änderungen:**\nVersionsstufe: {level}\n"
    )


def sw_text(number):
    return (
        "const CACHE_PREFIX = 'balkan-ride-shell-';\n"
        f"const CACHE_NAME = `${{CACHE_PREFIX}}v{number}`;\n"
    )


OLD_VERSION = {
    "version": "v2.5",
    "serviceWorkerCache": "v10",
    "serviceWorkerHistory": [{"version": "v10", "date": "2026-11-24", "message": "Alt"}],
    "history": [{"version": "v2.5", "date": "2026-11-24", "message": "Alt"}],
}
OLD_VERSION_TEXT = json.dumps(OLD_VERSION, indent=2) + "\n"


def version_text(*, app=True, cache=11, tweak=None):
    """version.json nach einem regulären Versionsschritt (Basis: OLD_VERSION, Cache v10)."""
    data = copy.deepcopy(OLD_VERSION)
    data["serviceWorkerCache"] = f"v{cache}"
    data["serviceWorkerHistory"].insert(
        0, {"version": f"v{cache}", "date": "2026-11-25", "message": "Neu"}
    )
    if app:
        data["version"] = "v2.6"
        data["history"].insert(0, {"version": "v2.6", "date": "2026-11-25", "message": "Neu"})
    if tweak:
        tweak(data)
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def valid_changes(**overrides):
    changes = {
        "web/src/main.js": "new\n",
        "web/tests/main.test.js": "test\n",
        "web/public/sw.js": sw_text(11),
        "web/public/version.json": version_text(),
    }
    changes.update(overrides)
    return changes


BASE_VERSION_FILES = {
    "web/public/sw.js": sw_text(10),
    "web/public/version.json": OLD_VERSION_TEXT,
}


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
            "assets/gpx/tag-01.gpx", "web/scripts/visual-check.mjs", "daten/chat_verlauf/x.md",
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


class PlanRequirementsTests(unittest.TestCase):
    def test_path_classification(self):
        for path in ("web/index.html", "web/src/main.js", "web/public/sw.js", "web/public/manifest.json"):
            with self.subTest(path=path):
                self.assertTrue(agent_runner.is_app_web_path(path))
        for path in ("web/tests/features.test.js", "content/tag-06.md", "config/settings.json"):
            with self.subTest(path=path):
                self.assertFalse(agent_runner.is_app_web_path(path))
        self.assertTrue(agent_runner.requires_version({"content/tag-06.md"}))
        self.assertFalse(agent_runner.requires_version({"web/tests/features.test.js"}))

    def test_web_path_requires_versions_and_a_webtest(self):
        self.assertEqual(
            agent_runner.missing_plan_paths({"web/src/main.js"}),
            ["web/public/sw.js", "web/public/version.json", "web/tests/<name>.test.js"],
        )
        self.assertEqual(
            agent_runner.missing_plan_paths({"web/src/main.js", "web/tests/features.test.js"}),
            ["web/public/sw.js", "web/public/version.json"],
        )
        self.assertEqual(agent_runner.missing_plan_paths({
            "web/src/main.js", "web/tests/features.test.js",
            "web/public/sw.js", "web/public/version.json",
        }), [])

    def test_tests_only_plan_is_complete(self):
        self.assertEqual(agent_runner.missing_plan_paths({"web/tests/features.test.js"}), [])

    def test_content_only_plan_needs_versions_but_no_webtest(self):
        self.assertEqual(
            agent_runner.missing_plan_paths({"content/tag-06.md"}),
            ["web/public/sw.js", "web/public/version.json"],
        )
        self.assertEqual(agent_runner.missing_plan_paths(
            {"content/tag-06.md", "web/public/sw.js", "web/public/version.json"}), [])

    def test_version_files_alone_still_need_a_webtest(self):
        self.assertEqual(
            agent_runner.missing_plan_paths({"web/public/sw.js", "web/public/version.json"}),
            ["web/tests/<name>.test.js"],
        )

    def test_version_level_must_be_stated_once_and_unambiguously(self):
        self.assertEqual(agent_runner.plan_version_level("Versionsstufe: sichtbar"), "sichtbar")
        self.assertEqual(agent_runner.plan_version_level("- **Versionsstufe:** technisch"), "technisch")
        self.assertIsNone(agent_runner.plan_version_level("Keine Angabe"))
        self.assertIsNone(agent_runner.plan_version_level(
            "Versionsstufe: sichtbar\nVersionsstufe: technisch"))
        paths = {"web/src/main.js", "web/tests/a.test.js", "web/public/sw.js", "web/public/version.json"}
        self.assertEqual(agent_runner.plan_gaps("Plan", paths), ["Versionsstufe: sichtbar|technisch"])
        self.assertEqual(agent_runner.plan_gaps("Versionsstufe: technisch", paths), [])

    def test_complete_plan_adds_only_version_files_visibly_before_the_footer(self):
        plan = complete_plan_text(lines=COMPLETE_LINES[:2]).rstrip() + "\n\n" + agent_runner.PLAN_FOOTER
        completed = agent_runner.complete_plan(plan)
        self.assertEqual(agent_runner.planned_paths(completed), {
            "web/src/main.js", "web/tests/main.test.js", "web/public/sw.js", "web/public/version.json",
        })
        for path in agent_runner.VERSION_FILES:
            self.assertIn(f"- `{path}` – Pflichtdatei (vom Runner ergänzt)", completed)
        self.assertTrue(completed.endswith(agent_runner.PLAN_FOOTER))
        self.assertEqual(completed.count("Pflichtdatei (vom Runner ergänzt)"), 2)
        self.assertLess(
            completed.index("`web/public/version.json`"), completed.index("**Geplante Änderungen:**"))

    def test_complete_plan_leaves_complete_plans_untouched(self):
        plan = complete_plan_text()
        self.assertEqual(agent_runner.complete_plan(plan), plan)

    def test_missing_webtest_or_level_rejects_instead_of_adding(self):
        no_test = complete_plan_text(lines=(COMPLETE_LINES[0], *COMPLETE_LINES[2:]))
        with self.assertRaises(agent_runner.PlanIncomplete) as caught:
            agent_runner.complete_plan(no_test)
        self.assertIn("web/tests/<name>.test.js", str(caught.exception.args[0]))
        no_level = plan_with(*COMPLETE_LINES)
        with self.assertRaises(agent_runner.PlanIncomplete) as caught:
            agent_runner.complete_plan(no_level)
        self.assertIn("Versionsstufe", str(caught.exception.args[0]))


class VersionStepTests(unittest.TestCase):
    def check(self, new_worker=None, new_json=None, level=None):
        agent_runner.check_version_step(
            sw_text(10), OLD_VERSION_TEXT,
            new_worker if new_worker is not None else sw_text(11),
            new_json if new_json is not None else version_text(), level,
        )

    def test_regular_visible_and_technical_steps_pass(self):
        self.check()
        self.check(level="sichtbar")
        self.check(new_json=version_text(app=False), level="technisch")
        self.check(new_json=version_text(app=False))

    def test_cache_must_increase_by_exactly_one(self):
        for number in (10, 12):
            with self.subTest(number=number), self.assertRaisesRegex(ValueError, "Cache"):
                self.check(new_worker=sw_text(number), new_json=version_text(cache=number))

    def test_worker_and_json_must_agree(self):
        def mismatch(data):
            data["serviceWorkerCache"] = "v99"
        with self.assertRaisesRegex(ValueError, "passt nicht zu sw.js"):
            self.check(new_json=version_text(tweak=mismatch))

    def test_histories_must_be_advanced_and_keep_older_entries(self):
        def not_advanced(data):
            data["serviceWorkerHistory"] = copy.deepcopy(OLD_VERSION["serviceWorkerHistory"])
        def rewritten(data):
            data["serviceWorkerHistory"][1]["message"] = "umgeschrieben"
        def app_without_entry(data):
            data["history"] = copy.deepcopy(OLD_VERSION["history"])
        def app_history_rewritten(data):
            data["history"][1]["message"] = "umgeschrieben"
        for tweak in (not_advanced, rewritten, app_without_entry, app_history_rewritten):
            with self.subTest(tweak=tweak.__name__), self.assertRaises(ValueError):
                self.check(new_json=version_text(tweak=tweak))

    def test_entries_need_a_valid_date_and_a_message(self):
        for bad in ("25.11.2026", "2026-13-40", ""):
            def tweak(data, bad=bad):
                data["serviceWorkerHistory"][0]["date"] = bad
            with self.subTest(date=bad), self.assertRaises(ValueError):
                self.check(new_json=version_text(tweak=tweak))
        def empty_message(data):
            data["serviceWorkerHistory"][0]["message"] = "  "
        with self.assertRaises(ValueError):
            self.check(new_json=version_text(tweak=empty_message))

    def test_app_version_step_and_level_are_enforced(self):
        def skipped(data):
            data["version"] = "v2.8"
            data["history"][0]["version"] = "v2.8"
        with self.assertRaisesRegex(ValueError, "v2.6 erwartet"):
            self.check(new_json=version_text(tweak=skipped))
        with self.assertRaisesRegex(ValueError, "technisch"):
            self.check(level="technisch")
        with self.assertRaisesRegex(ValueError, "sichtbar"):
            self.check(new_json=version_text(app=False), level="sichtbar")

    def test_unreadable_inputs_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "nicht eindeutig"):
            self.check(new_worker="const x = 1;\n")
        with self.assertRaisesRegex(ValueError, "JSON"):
            self.check(new_json="{kaputt")


class ChangesetPolicyTests(unittest.TestCase):
    PLAN = complete_plan_text()

    def enforce(self, updated, plan=None):
        agent_runner.enforce_changeset_policy(updated, BASE_VERSION_FILES, plan or self.PLAN)

    def test_complete_web_change_passes(self):
        self.enforce(valid_changes())

    def test_web_change_needs_both_version_files(self):
        for missing in agent_runner.VERSION_FILES:
            changes = valid_changes()
            del changes[missing]
            with self.subTest(missing=missing), self.assertRaisesRegex(ValueError, "Versionsdateien"):
                self.enforce(changes)

    def test_app_change_needs_a_changed_webtest(self):
        changes = valid_changes()
        del changes["web/tests/main.test.js"]
        with self.assertRaisesRegex(ValueError, "Webtest"):
            self.enforce(changes)

    def test_test_only_change_needs_no_version_step(self):
        self.enforce({"web/tests/main.test.js": "test\n"})

    def test_stage_change_needs_versions_but_no_new_webtest(self):
        changes = {
            "content/tag-06.md": STAGE,
            "web/public/sw.js": sw_text(11),
            "web/public/version.json": version_text(),
        }
        self.enforce(changes)
        del changes["web/public/version.json"]
        with self.assertRaisesRegex(ValueError, "Versionsdateien"):
            self.enforce(changes)

    def test_wrong_version_step_is_rejected_before_any_commit(self):
        with self.assertRaisesRegex(ValueError, "Cache v12 statt v11"):
            self.enforce(valid_changes(**{
                "web/public/sw.js": sw_text(12), "web/public/version.json": version_text(cache=12),
            }))

    def test_planned_version_level_is_enforced(self):
        with self.assertRaisesRegex(ValueError, "technisch"):
            self.enforce(valid_changes(), complete_plan_text(level="technisch"))
        self.enforce(valid_changes(**{"web/public/version.json": version_text(app=False)}),
                     complete_plan_text(level="technisch"))

    def test_missing_base_files_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "Basisstand"):
            agent_runner.enforce_changeset_policy(valid_changes(), {}, self.PLAN)


class FileAccessTests(TemporaryRoot):
    def test_allowed_listing_skips_private_system_binary_and_symlinked_files(self):
        for path in (
            "content/tag-01.md", "content/notizen.md", "web/src/a.js", "web/public/icon.png",
            "web/node_modules/x/y.js", "web/dist/z.js", "web/package.json",
            "config/ok.json", "config/commands/plan-item.md", "docs/secret.md",
            "web/scripts/visual-check.mjs", "daten/notiz.md", "export/ARBEITSSTAND.md",
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
            agent_runner.commit_branch({"number": 22}, {"web/src/main.js": "new\n"})
        self.assertEqual((self.root / "web/src/main.js").read_text(encoding="utf-8"), "new\n")
        self.assertEqual(calls[0], ("switch", "-c", "feature/issue-22"))
        self.assertIn(("add", "--", "web/src/main.js"), calls)
        self.assertIn((
            "fetch", "origin",
            "refs/heads/feature/issue-22:refs/remotes/origin/feature/issue-22",
        ), calls)
        self.assertEqual(calls[-1], (
            "push", "--force-with-lease", "origin",
            "refs/heads/feature/issue-22:refs/heads/feature/issue-22",
        ))

    def test_missing_remote_branch_does_not_block_the_lease_push(self):
        self.write("web/src/main.js", "old\n")
        calls = []

        def fake_git(*args):
            calls.append(args)
            if args[0] == "fetch":
                raise subprocess.CalledProcessError(1, ["git", *args])

        with patch.object(agent_runner, "git", side_effect=fake_git), \
                patch.object(agent_runner, "git_paths", return_value={"web/src/main.js"}):
            agent_runner.commit_branch({"number": 22}, {"web/src/main.js": "new\n"})
        self.assertEqual(calls[-1], (
            "push", "--force-with-lease", "origin",
            "refs/heads/feature/issue-22:refs/heads/feature/issue-22",
        ))

    def test_non_feature_branches_are_rejected_before_any_git_operation(self):
        for branch in ("main", "release/1", "fix/issue-22"):
            with self.subTest(branch=branch):
                with patch.object(agent_runner, "branch_name", return_value=branch), \
                        patch.object(agent_runner, "git") as git:
                    with self.assertRaises(ValueError):
                        agent_runner.commit_branch({"number": 22}, {"web/src/main.js": "new\n"})
                git.assert_not_called()

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

    def run_main(self, mode, plan=None, comment_body="/implement-item"):
        self.write("web/src/main.js", "old\n")
        self.write("web/tests/existing.test.js")
        for path, text in BASE_VERSION_FILES.items():
            self.write(path, text)
        event = self.root / "event.json"
        event.write_text(json.dumps({
            "action": "created", "issue": {"number": 3, "user": {"login": "boss"}},
            "comment": {"id": 20, "user": {"login": "boss"}, "body": comment_body},
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
        plan = complete_plan_text()
        raw = json.dumps(valid_changes(**{"web/src/main.js": "new", "web/tests/main.test.js": "test"}))
        with patch.object(agent_runner, "ask_model", return_value=raw) as ask, \
                patch.object(agent_runner, "commit_branch") as commit:
            posted, error = self.run_main("implement", plan)
        self.assertIsNone(error)
        context = ask.call_args.args[1]
        self.assertEqual(context["allowed_paths"], sorted(
            ["web/src/main.js", "web/tests/main.test.js", *BASE_VERSION_FILES]))
        self.assertEqual(
            context["files"], {"web/src/main.js": "old\n", **BASE_VERSION_FILES})
        self.assertEqual(context["reference_test_files"], ["web/tests/existing.test.js"])
        self.assertNotIn("reference_tests", context)
        self.assertNotIn("web/tests/existing.test.js", context["allowed_paths"])
        self.assertEqual(commit.call_args.args[1], valid_changes())
        self.assertEqual(posted, [])

    def test_generation_rejects_changes_outside_the_approved_plan(self):
        plan = complete_plan_text()
        raw = json.dumps({**valid_changes(), "web/src/style.css": "x"})
        with patch.object(agent_runner, "ask_model", return_value=raw), \
                patch.object(agent_runner, "commit_branch") as commit:
            posted, error = self.run_main("implement", plan)
        self.assertIsInstance(error, ValueError)
        self.assertIn("ausschließlich freigegebenen Pfaden", str(error))
        commit.assert_not_called()

    def test_generation_rejects_a_wrong_version_step_before_any_commit(self):
        raw = json.dumps(valid_changes(**{
            "web/public/sw.js": sw_text(12), "web/public/version.json": version_text(cache=12),
        }))
        with patch.object(agent_runner, "ask_model", return_value=raw), \
                patch.object(agent_runner, "commit_branch") as commit:
            posted, error = self.run_main("implement", complete_plan_text())
        self.assertIsInstance(error, ValueError)
        self.assertIn("Cache v12 statt v11", str(error))
        commit.assert_not_called()
        self.assertIn("Cache v12 statt v11", posted[0][1]["body"])

    def test_generation_without_version_files_in_the_changeset_is_rejected(self):
        changes = valid_changes()
        del changes["web/public/version.json"]
        with patch.object(agent_runner, "ask_model", return_value=json.dumps(changes)), \
                patch.object(agent_runner, "commit_branch") as commit:
            posted, error = self.run_main("implement", complete_plan_text())
        self.assertIsInstance(error, ValueError)
        commit.assert_not_called()

    def test_approved_incomplete_plan_stops_before_model_call(self):
        plan = plan_with("- `web/src/main.js`")
        for mode in ("implement", "publish"):
            with self.subTest(mode=mode), patch.object(agent_runner, "ask_model") as ask, \
                    patch.object(agent_runner, "commit_branch") as commit:
                posted, error = self.run_main(mode, plan)
            self.assertIsInstance(error, agent_runner.PlanIncomplete)
            ask.assert_not_called()
            commit.assert_not_called()
            body = posted[0][1]["body"]
            for expected in ("unvollständig", "web/public/sw.js", "web/public/version.json",
                             "web/tests/<name>.test.js", "Versionsstufe", "/plan-item"):
                self.assertIn(expected, body)
            self.assertFalse(posted[0][0].endswith("/pulls"))

    def test_publish_opens_the_pull_request_only_after_the_diff_matches_the_plan(self):
        plan = complete_plan_text()
        changed = set(valid_changes())
        heads = {path: text for path, text in valid_changes().items() if path.startswith("web/public/")}

        def show(ref, path):
            return (heads if ref.startswith("origin/feature/") else BASE_VERSION_FILES).get(path)

        with patch.object(agent_runner, "git_paths", return_value=changed), \
                patch.object(agent_runner, "git_show", side_effect=show):
            posted, error = self.run_main("publish", plan)
        self.assertIsNone(error)
        pr = posted[0][1]
        self.assertEqual((posted[0][0].endswith("/pulls"), pr["head"], pr["base"]),
                         (True, "feature/issue-3", "main"))
        self.assertIn("web/src/main.js", pr["body"])
        self.assertIn("Closes #3", pr["body"])
        with patch.object(agent_runner, "git_paths", return_value={*changed, "docs/x.md"}), \
                patch.object(agent_runner, "git_show", side_effect=show):
            posted, error = self.run_main("publish", plan)
        self.assertIsInstance(error, ValueError)
        self.assertFalse(posted[0][0].endswith("/pulls"))

    def test_publish_rejects_a_version_step_that_no_longer_fits_main(self):
        changed = set(valid_changes())
        heads = {path: text for path, text in valid_changes().items() if path.startswith("web/public/")}
        moved_main = {
            "web/public/sw.js": sw_text(11),
            "web/public/version.json": version_text(),
        }

        def show(ref, path):
            return (heads if ref.startswith("origin/feature/") else moved_main).get(path)

        with patch.object(agent_runner, "git_paths", return_value=changed), \
                patch.object(agent_runner, "git_show", side_effect=show):
            posted, error = self.run_main("publish", complete_plan_text())
        self.assertIsInstance(error, ValueError)
        self.assertIn("Basis veraltet", str(error))
        self.assertIn("Cache v11 statt v12", str(error))
        self.assertFalse(posted[0][0].endswith("/pulls"))

    def test_publish_requires_the_version_files_in_the_branch_diff(self):
        changed = {"web/src/main.js", "web/tests/main.test.js"}
        with patch.object(agent_runner, "git_paths", return_value=changed), \
                patch.object(agent_runner, "git_show", return_value="x"):
            posted, error = self.run_main("publish", complete_plan_text())
        self.assertIsInstance(error, ValueError)
        self.assertIn("ohne Versionsdateien", str(error))

    def test_plan_failure_posts_a_specific_comment_with_the_run_marker(self):
        incomplete = complete_plan_text(lines=COMPLETE_LINES[:1]).rstrip() + "\n\n" + agent_runner.PLAN_FOOTER
        with patch.object(agent_runner, "ask_model", return_value=incomplete):
            posted, error = self.run_main("plan", comment_body="/plan-item")
        self.assertIsInstance(error, agent_runner.PlanIncomplete)
        body = posted[0][1]["body"]
        self.assertIn("Planerstellung ist fehlgeschlagen", body)
        self.assertIn("web/tests/<name>.test.js", body)
        self.assertIn("<!-- roadbook-run:9 -->", body)
        self.assertEqual(len(posted), 1)

    def test_failed_failure_comment_is_reported_with_the_original_reason(self):
        with patch.object(agent_runner, "ask_model", side_effect=ValueError("Modell kaputt")), \
                patch.object(agent_runner, "report_failure",
                             wraps=agent_runner.report_failure) as report:
            def failing(session, method, url, **kwargs):
                if method == "POST":
                    raise OSError("offline")
                return Mock(json=Mock(return_value=self.issue))
            env = {**self.environment, "MODE": "plan", "GITHUB_EVENT_PATH": str(self.root / "e.json")}
            (self.root / "e.json").write_text(json.dumps({
                "action": "created", "issue": {"number": 3, "user": {"login": "boss"}},
                "comment": {"id": 20, "user": {"login": "boss"}, "body": "/plan-item"},
            }), encoding="utf-8")
            self.write("web/src/main.js", "old\n")
            with patch.dict(os.environ, env), patch.object(agent_runner, "api", failing):
                with self.assertRaisesRegex(RuntimeError, "Modell kaputt.*offline"):
                    agent_runner.main()
        report.assert_called_once()

    def test_plan_with_forbidden_path_is_rejected_before_it_is_posted(self):
        self.write("content/tag-01.md", STAGE)
        bad_plan = plan_with("- `.github/scripts/agent_runner.py`") + agent_runner.PLAN_FOOTER
        with patch.object(agent_runner, "ask_model", return_value=bad_plan):
            with self.assertRaises(ValueError):
                agent_runner.plan_comment(self.issue)
        good_plan = complete_plan_text().rstrip() + "\n" + agent_runner.PLAN_FOOTER
        self.write("web/src/main.js", "old\n")
        with patch.object(agent_runner, "ask_model", return_value=good_plan) as ask:
            comment = agent_runner.plan_comment(self.issue)
        self.assertIn(agent_runner.plan_marker(self.issue), comment)
        context = ask.call_args.args[1]
        self.assertEqual(sorted(context["files"]), ["web/src/main.js"])
        self.assertEqual(context["file_list"], ["content/tag-01.md", "web/src/main.js"])
        self.assertNotIn("logistik", ask.call_args.args[1])

    def test_private_docs_never_reach_the_model_context(self):
        self.write("content/tag-01.md", STAGE)
        self.write("web/src/main.js", "old\n")
        self.write("docs/motorrad_checkliste_logistik.md", "PRIVATE-DOCS-MARKER")
        good_plan = complete_plan_text().rstrip() + "\n" + agent_runner.PLAN_FOOTER
        with patch.object(agent_runner, "ask_model", return_value=good_plan) as ask:
            agent_runner.plan_comment(self.issue)
        context = ask.call_args.args[1]
        self.assertNotIn("PRIVATE-DOCS-MARKER", json.dumps(context))
        self.assertFalse(any(path.startswith("docs/") for path in context["file_list"]))

    def test_plan_comment_makes_added_version_files_visible_before_approval(self):
        self.write("web/src/main.js", "old\n")
        plan = complete_plan_text(lines=COMPLETE_LINES[:2]).rstrip() + "\n\n" + agent_runner.PLAN_FOOTER
        with patch.object(agent_runner, "ask_model", return_value=plan):
            comment = agent_runner.plan_comment(self.issue)
        self.assertIn("- `web/public/sw.js` – Pflichtdatei (vom Runner ergänzt)", comment)
        self.assertEqual(agent_runner.planned_paths(comment), {
            "web/src/main.js", "web/tests/main.test.js", *agent_runner.VERSION_FILES,
        })
        self.assertTrue(comment.endswith(agent_runner.PLAN_FOOTER))
        self.assertIn(agent_runner.plan_marker(self.issue), comment)

    def test_plan_prompt_mentions_required_files_level_and_omitted_files(self):
        self.write("web/src/main.js", "old\n")
        good_plan = complete_plan_text().rstrip() + "\n" + agent_runner.PLAN_FOOTER
        with patch.object(agent_runner, "ask_model", return_value=good_plan) as ask:
            agent_runner.plan_comment(self.issue)
        rules = ask.call_args.args[2]
        for expected in ("required_files", "test_candidates", "Versionsstufe", "omitted_files"):
            self.assertIn(expected, rules)

    def test_plan_with_intro_text_and_altered_footer_is_normalized(self):
        self.write("web/src/main.js", "old\n")
        body = complete_plan_text().rstrip()
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

    def test_omitted_files_are_reported_when_the_budget_is_exhausted(self):
        with patch.object(agent_runner, "PLAN_CONTEXT_BYTES", 150):
            context = agent_runner.collect_context(self.issue("CSS Layout der Karte"))
        self.assertEqual(sorted(context["files"]), ["web/src/main.js", "web/tests/features.test.js"])
        self.assertEqual(context["omitted_files"], ["web/src/style.css"])
        context = agent_runner.collect_context(self.issue("Danke", "Alles gut"))
        self.assertEqual(context["omitted_files"], [])

    def test_test_candidates_follow_the_hint_table_for_ui_issues_only(self):
        self.write("web/src/roadbook.js", "r")
        self.write("web/tests/roadbook.test.js", "t")
        context = agent_runner.collect_context(self.issue("Neuer Button in der Karte"))
        self.assertEqual(context["test_candidates"], {
            "web/tests/features.test.js": ["web/src/main.js", "web/src/style.css"],
            "web/tests/roadbook.test.js": ["web/src/roadbook.js"],
        })
        self.assertEqual(agent_runner.collect_context(self.issue("Tag 6 überarbeiten"))["test_candidates"], {})

    def test_version_files_are_required_but_never_loaded_into_the_plan_context(self):
        self.write("web/public/sw.js", "const CACHE_NAME = 1;")
        self.write("web/public/version.json", "{}")
        context = agent_runner.collect_context(self.issue("Neuer Button in der Karte"))
        self.assertEqual(context["required_files"], ["web/public/sw.js", "web/public/version.json"])
        self.assertNotIn("web/public/sw.js", context["files"])
        self.assertNotIn("web/public/version.json", context["files"])
        self.assertIn("web/public/sw.js", context["file_list"])


if __name__ == "__main__":
    unittest.main()
