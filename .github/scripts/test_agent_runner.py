import copy
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import yaml


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
        for mode in ("implement", "publish", "preview", "report"):
            with self.subTest(mode=mode):
                agent_runner.validate_event(mode, "issue_comment", self.event(), "boss", 3)
                for accepted in ("/go", "Passt so, /go", "Danke.\n/go\n"):
                    agent_runner.validate_event(mode, "issue_comment", self.event(body=accepted), "boss", 3)
                for bad in (
                    self.event(user="mallory"), self.event(body="/plan-item"),
                    self.event(body="/plan"), self.event(body="/going"),
                    self.event(body="/implement-item\n/plan"), self.event(pull_request=True),
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


class CommandTests(unittest.TestCase):
    def test_plan_commands_must_stand_on_their_own_line(self):
        for body in ("/plan", "/plan-item", "  /plan  \n", "Fokus aufs Handy\n/plan",
                     "Hinweis\r\n/plan-item\r\nDanke"):
            with self.subTest(body=body):
                self.assertEqual(agent_runner.comment_command(body), "plan")
        for body in ("/planning", "bitte /plan", "/plan jetzt", "`/plan`", "plan", "", None, 5):
            with self.subTest(body=body):
                self.assertIsNone(agent_runner.comment_command(body))

    def test_go_and_implement_item_work_as_standalone_words(self):
        for body in ("/implement-item", "/go", "Ok, /go", "/go!", "Super.\n/go\nDanke",
                     "/implement-item bitte", "alles klar /go."):
            with self.subTest(body=body):
                self.assertEqual(agent_runner.comment_command(body), "implement")

    def test_words_that_merely_contain_go_do_not_trigger(self):
        for body in ("google", "going", "/going", "/google", "go", "https://example.org/go",
                     "`/go`", "/gopher", "/go-live", "/implement-items", "Ich gehe los",
                     "Quelle: https://example.org/implement-item"):
            with self.subTest(body=body):
                self.assertIsNone(agent_runner.comment_command(body))

    def test_a_comment_with_both_kinds_of_commands_is_ambiguous(self):
        self.assertIsNone(agent_runner.comment_command("/plan\n/go"))

    def test_plan_mode_accepts_the_short_form_and_rejects_approvals(self):
        def event(body, user="boss"):
            return {"action": "created", "issue": {"number": 3, "user": {"login": "boss"}},
                    "comment": {"user": {"login": user}, "body": body}}

        for body in ("/plan", "Nur Handy beachten\n/plan", "/plan-item"):
            agent_runner.validate_event("plan", "issue_comment", event(body), "boss", 3)
        for body in ("/go", "/implement-item", "bitte /plan", "/planung"):
            with self.assertRaises(ValueError):
                agent_runner.validate_event("plan", "issue_comment", event(body), "boss", 3)
        with self.assertRaises(ValueError):
            agent_runner.validate_event("plan", "issue_comment", event("/plan", "mallory"), "boss", 3)

    def test_routing_decides_which_stage_starts(self):
        def comment(body, user="boss", action="created", pull_request=False):
            issue = {"number": 3, "user": {"login": "boss"}}
            if pull_request:
                issue["pull_request"] = {}
            return {"action": action, "issue": issue, "comment": {"user": {"login": user}, "body": body}}

        route = agent_runner.route_event
        plan, go, none = ({"plan": "true", "implement": "false"},
                          {"plan": "false", "implement": "true"},
                          {"plan": "false", "implement": "false"})
        self.assertEqual(route("issues", {"action": "opened", "issue": {"number": 3, "user": {"login": "Boss"}}}, "boss"), plan)
        self.assertEqual(route("issues", {"action": "opened", "issue": {"number": 3, "user": {"login": "x"}}}, "boss"), none)
        self.assertEqual(route("issue_comment", comment("/plan"), "boss"), plan)
        self.assertEqual(route("issue_comment", comment("Mehr Kontrast\n/plan-item"), "boss"), plan)
        self.assertEqual(route("issue_comment", comment("/go"), "boss"), go)
        self.assertEqual(route("issue_comment", comment("/implement-item"), "boss"), go)
        for body, kwargs in (("going", {}), ("google", {}), ("/go", {"user": "mallory"}),
                             ("/go", {"pull_request": True}), ("/go", {"action": "edited"}),
                             ("/plan\n/go", {})):
            with self.subTest(body=body, kwargs=kwargs):
                self.assertEqual(route("issue_comment", comment(body, **kwargs), "boss"), none)
        self.assertEqual(route("issue_comment", comment("/go"), ""), none)

    def test_route_mode_reports_the_decision_as_outputs(self):
        with tempfile.TemporaryDirectory() as directory:
            event = Path(directory) / "event.json"
            event.write_text(json.dumps({
                "action": "created", "issue": {"number": 3, "user": {"login": "boss"}},
                "comment": {"user": {"login": "boss"}, "body": "/go"},
            }), encoding="utf-8")
            output = Path(directory) / "output"
            environment = {
                "MODE": "route", "GITHUB_EVENT_NAME": "issue_comment", "GITHUB_EVENT_PATH": str(event),
                "ALLOWED_GITHUB_USER": "Boss", "ISSUE_NUMBER": "3", "GITHUB_OUTPUT": str(output),
            }
            with patch.dict(os.environ, environment):
                agent_runner.main()
            self.assertEqual(output.read_text(encoding="utf-8").splitlines(),
                             ["plan=false", "implement=true"])

    def test_footer_and_error_hints_mention_the_short_forms(self):
        self.assertIn("`/implement-item` oder `/go`", agent_runner.PLAN_FOOTER)
        self.assertIn("`/plan-item` oder `/plan`", str(agent_runner.PlanIncomplete(["web/public/sw.js"])))
        commands = Path(__file__).resolve().parents[2] / "config" / "commands"
        self.assertIn(agent_runner.PLAN_FOOTER.strip("*"), (commands / "plan-item.md").read_text(encoding="utf-8"))
        self.assertIn("`/plan`", (commands / "plan-item.md").read_text(encoding="utf-8"))
        self.assertIn("`/go`", (commands / "implement-item.md").read_text(encoding="utf-8"))


BASE_SHA = "a" * 40
HEAD_SHA = "b" * 40
SHAS = (BASE_SHA, HEAD_SHA)


class BranchTests(TemporaryRoot):
    def run_create_commit(self, issue, changes, staged):
        calls = []

        def fake_out(*args):
            calls.append(args)
            return BASE_SHA if len(calls) == 1 else HEAD_SHA

        with patch.object(agent_runner, "git", side_effect=lambda *args: calls.append(args)), \
                patch.object(agent_runner, "git_out", side_effect=fake_out), \
                patch.object(agent_runner, "git_paths", return_value=staged):
            try:
                result = agent_runner.create_commit(issue, changes)
                error = None
            except Exception as caught:
                result, error = None, caught
        return calls, result, error

    def test_only_approved_files_are_staged_and_committed_locally(self):
        self.write("web/src/main.js", "old\n")
        calls, result, error = self.run_create_commit(
            {"number": 22}, {"web/src/main.js": "new\n"}, {"web/src/main.js"})
        self.assertIsNone(error)
        self.assertEqual(result, SHAS)
        self.assertEqual((self.root / "web/src/main.js").read_text(encoding="utf-8"), "new\n")
        self.assertIn(("switch", "-c", "implement"), calls)
        self.assertIn(("add", "--", "web/src/main.js"), calls)
        commit = next(call for call in calls if "commit" in call)
        self.assertIn("user.name=AI Roadbook Agent", commit)

    def test_generation_never_touches_the_remote(self):
        self.write("web/src/main.js", "old\n")
        calls, _, error = self.run_create_commit(
            {"number": 22}, {"web/src/main.js": "new\n"}, {"web/src/main.js"})
        self.assertIsNone(error)
        forbidden = {"push", "fetch", "ls-remote", "pull", "clone"}
        self.assertFalse(any(forbidden & set(call) for call in calls), calls)

    def test_unexpected_staged_files_stop_before_commit(self):
        self.write("web/src/main.js", "old\n")
        calls, _, error = self.run_create_commit(
            {"number": 7}, {"web/src/main.js": "new\n"}, {"web/src/main.js", "docs/x.md"})
        self.assertIsInstance(error, ValueError)
        self.assertFalse(any("commit" in call for call in calls))

    def test_only_feature_issue_branches_can_be_pushed(self):
        for branch in ("main", "release/1", "fix/issue-22", "feature/issue-0", "feature/issue-1x",
                       "feature/issue-1/../main", "feature/issue-"):
            with self.subTest(branch=branch):
                with patch.object(agent_runner, "branch_name", return_value=branch), \
                        patch.object(agent_runner, "git") as git:
                    with self.assertRaises(ValueError):
                        agent_runner.push_verified_commit({"number": 22}, HEAD_SHA, None)
                    git.assert_not_called()
        self.assertEqual(agent_runner.push_branch({"number": 22}), "feature/issue-22")

    def test_invalid_head_sha_is_rejected_before_the_push(self):
        with patch.object(agent_runner, "git") as git:
            for sha in ("", "main", "b" * 39, "B" * 40, "b" * 40 + "\n--force"):
                with self.subTest(sha=sha), self.assertRaises(ValueError):
                    agent_runner.push_verified_commit({"number": 22}, sha, None)
            git.assert_not_called()


class RunnerFlowTests(TemporaryRoot):
    environment = {
        "GITHUB_SERVER_URL": "https://github.com", "REPOSITORY": "o/r", "GITHUB_RUN_ID": "9",
        "ALLOWED_GITHUB_USER": "boss", "ISSUE_NUMBER": "3", "GITHUB_TOKEN": "token",
        "GITHUB_EVENT_NAME": "issue_comment",
    }
    issue = {"number": 3, "title": "App", "body": "Text", "state": "open", "user": {"login": "boss"}}

    def run_main(self, mode, plan=None, comment_body="/implement-item", extra_env=None,
                 extra_comments=()):
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
            *extra_comments,
        ]
        posted = []

        def fake_api(session, method, url, **kwargs):
            if method == "POST":
                posted.append((url, kwargs["json"]))
                return Mock(json=Mock(return_value={"html_url": "https://github.com/o/r/pull/1"}))
            return Mock(json=Mock(return_value=self.issue))

        env = {**self.environment, "MODE": mode, "GITHUB_EVENT_PATH": str(event), **(extra_env or {})}
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
                patch.object(agent_runner, "create_commit", return_value=SHAS) as commit, \
                        patch.object(agent_runner, "write_bundle") as bundle:
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
                patch.object(agent_runner, "create_commit", return_value=SHAS) as commit, \
                        patch.object(agent_runner, "write_bundle") as bundle:
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
                patch.object(agent_runner, "create_commit", return_value=SHAS) as commit, \
                        patch.object(agent_runner, "write_bundle") as bundle:
            posted, error = self.run_main("implement", plan)
        self.assertIsInstance(error, ValueError)
        self.assertIn("ausschließlich freigegebenen Pfaden", str(error))
        commit.assert_not_called()

    def test_generation_rejects_a_wrong_version_step_before_any_commit(self):
        raw = json.dumps(valid_changes(**{
            "web/public/sw.js": sw_text(12), "web/public/version.json": version_text(cache=12),
        }))
        with patch.object(agent_runner, "ask_model", return_value=raw), \
                patch.object(agent_runner, "create_commit", return_value=SHAS) as commit, \
                        patch.object(agent_runner, "write_bundle") as bundle:
            posted, error = self.run_main("implement", complete_plan_text())
        self.assertIsInstance(error, ValueError)
        self.assertIn("Cache v12 statt v11", str(error))
        commit.assert_not_called()
        self.assertIn("Cache v12 statt v11", posted[0][1]["body"])

    def test_generation_without_version_files_in_the_changeset_is_rejected(self):
        changes = valid_changes()
        del changes["web/public/version.json"]
        with patch.object(agent_runner, "ask_model", return_value=json.dumps(changes)), \
                patch.object(agent_runner, "create_commit", return_value=SHAS) as commit, \
                        patch.object(agent_runner, "write_bundle") as bundle:
            posted, error = self.run_main("implement", complete_plan_text())
        self.assertIsInstance(error, ValueError)
        commit.assert_not_called()

    def test_approved_incomplete_plan_stops_before_model_call(self):
        plan = plan_with("- `web/src/main.js`")
        for mode in ("implement", "publish"):
            with self.subTest(mode=mode), patch.object(agent_runner, "ask_model") as ask, \
                    patch.object(agent_runner, "create_commit", return_value=SHAS) as commit, \
                    patch.object(agent_runner, "write_bundle"), \
                    patch.object(agent_runner, "publish_verified") as publish:
                posted, error = self.run_main(mode, plan)
            self.assertIsInstance(error, agent_runner.PlanIncomplete)
            ask.assert_not_called()
            commit.assert_not_called()
            publish.assert_not_called()
            body = posted[0][1]["body"]
            for expected in ("unvollständig", "web/public/sw.js", "web/public/version.json",
                             "web/tests/<name>.test.js", "Versionsstufe", "/plan-item"):
                self.assertIn(expected, body)
            self.assertFalse(posted[0][0].endswith("/pulls"))

    def test_generation_writes_the_bundle_after_the_commit(self):
        raw = json.dumps(valid_changes())
        with patch.object(agent_runner, "ask_model", return_value=raw), \
                patch.object(agent_runner, "create_commit", return_value=SHAS), \
                patch.object(agent_runner, "write_bundle") as bundle:
            posted, error = self.run_main("implement", complete_plan_text())
        self.assertIsNone(error)
        args = bundle.call_args.args
        self.assertEqual((args[2], args[3]), SHAS)
        self.assertEqual(set(args[4]), set(valid_changes()))

    def test_publish_delegates_to_the_verified_publish_and_comments_the_result(self):
        with patch.object(agent_runner, "publish_verified", return_value="PR bereit") as publish:
            posted, error = self.run_main("publish", complete_plan_text())
        self.assertIsNone(error)
        publish.assert_called_once()
        self.assertEqual(publish.call_args.args[3], complete_plan_text() + "\n" + agent_runner.plan_marker(self.issue) + "\n")
        self.assertEqual(posted[0][1]["body"], "PR bereit")

    def test_publish_failure_is_reported_once_with_the_run_marker(self):
        with patch.object(agent_runner, "publish_verified", side_effect=ValueError("Basis veraltet")):
            posted, error = self.run_main("publish", complete_plan_text())
        self.assertIsInstance(error, ValueError)
        self.assertEqual(len(posted), 1)
        self.assertIn("Basis veraltet", posted[0][1]["body"])
        self.assertIn("<!-- roadbook-run:9 -->", posted[0][1]["body"])

    def test_gate_mode_needs_neither_token_nor_api(self):
        event = self.root / "gate-event.json"
        event.write_text(json.dumps({
            "action": "created", "issue": {"number": 3, "user": {"login": "boss"}},
            "comment": {"id": 20, "user": {"login": "boss"}, "body": "/implement-item"},
        }), encoding="utf-8")
        env = {key: value for key, value in self.environment.items() if key != "GITHUB_TOKEN"}
        env.update({"MODE": "gate", "GITHUB_EVENT_PATH": str(event)})
        with patch.dict(os.environ, env), patch.object(agent_runner, "api") as api, \
                patch.object(agent_runner, "gate_bundle") as gate:
            os.environ.pop("GITHUB_TOKEN", None)
            agent_runner.main()
        gate.assert_called_once()
        api.assert_not_called()

    def test_gate_mode_still_requires_a_valid_approval_event(self):
        event = self.root / "gate-event.json"
        event.write_text(json.dumps({
            "action": "created", "issue": {"number": 3, "user": {"login": "boss"}},
            "comment": {"id": 20, "user": {"login": "mallory"}, "body": "/implement-item"},
        }), encoding="utf-8")
        env = {**self.environment, "MODE": "gate", "GITHUB_EVENT_PATH": str(event)}
        with patch.dict(os.environ, env), patch.object(agent_runner, "gate_bundle") as gate:
            with self.assertRaises(ValueError):
                agent_runner.main()
        gate.assert_not_called()

    def test_run_marker_distinguishes_rerun_attempts(self):
        with patch.dict(os.environ, {"GITHUB_RUN_ID": "9"}):
            os.environ.pop("GITHUB_RUN_ATTEMPT", None)
            self.assertEqual(agent_runner.run_marker(), "<!-- roadbook-run:9 -->")
            with patch.dict(os.environ, {"GITHUB_RUN_ATTEMPT": "1"}):
                self.assertEqual(agent_runner.run_marker(), "<!-- roadbook-run:9 -->")
            with patch.dict(os.environ, {"GITHUB_RUN_ATTEMPT": "2"}):
                self.assertEqual(agent_runner.run_marker(), "<!-- roadbook-run:9-2 -->")

    def test_report_names_the_failed_stage_and_points_to_the_visual_report(self):
        extra = {"GENERATE_RESULT": "success", "VERIFY_RESULT": "failure",
                 "PUBLISH_RESULT": "skipped", "VISUAL_ARTIFACT": "visual-report-issue-3-9-1"}
        posted, error = self.run_main("report", extra_env=extra)
        self.assertIsNone(error)
        body = posted[0][1]["body"]
        for expected in ("implement-verify", "fehlgeschlagen", "kein Pull Request",
                         "kein Feature-Branch", "visual-report-issue-3-9-1", "<!-- roadbook-run:9 -->"):
            self.assertIn(expected, body)

    def test_report_distinguishes_cancelled_generate_and_publish(self):
        posted, _ = self.run_main("report", extra_env={"GENERATE_RESULT": "cancelled"})
        self.assertIn("implement-generate", posted[0][1]["body"])
        self.assertIn("abgebrochen", posted[0][1]["body"])
        posted, _ = self.run_main("report", extra_env={
            "GENERATE_RESULT": "success", "VERIFY_RESULT": "success", "PUBLISH_RESULT": "failure"})
        self.assertIn("implement-publish", posted[0][1]["body"])
        self.assertIn("Ob bereits ein Feature-Branch gepusht wurde", posted[0][1]["body"])
        self.assertNotIn("kein Feature-Branch gepusht", posted[0][1]["body"])

    def test_report_skips_when_the_runner_already_commented_for_this_run(self):
        already = [{"id": 30, "user": {"login": agent_runner.BOT, "type": "Bot"},
                    "body": "Fehler\n\n<!-- roadbook-run:9 -->"}]
        posted, error = self.run_main("report", extra_env={"PUBLISH_RESULT": "failure"},
                                      extra_comments=already)
        self.assertIsNone(error)
        self.assertEqual(posted, [])
        other_run = [{"id": 31, "user": {"login": agent_runner.BOT, "type": "Bot"},
                      "body": "Fehler\n\n<!-- roadbook-run:8 -->"}]
        posted, _ = self.run_main("report", extra_env={"PUBLISH_RESULT": "failure"},
                                  extra_comments=other_run)
        self.assertEqual(len(posted), 1)

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


class GitFixture(unittest.TestCase):
    """Echte Git-Repositories (lokales Bare-Remote, kein Netz) für Commit-, Bundle- und Push-Tests."""

    ISSUE = {"number": 3, "title": "App", "body": "Text", "state": "open", "user": {"login": "boss"}}
    MAINTAINER = ("-c", "user.name=Maintainer", "-c", "user.email=maintainer@example.org")

    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.base = Path(directory.name).resolve()
        environment = patch.dict(os.environ, {
            "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_TERMINAL_PROMPT": "0", "HOME": str(self.base),
            "GITHUB_RUN_ID": "9", "GITHUB_SERVER_URL": "https://github.com", "REPOSITORY": "o/r",
        })
        environment.start()
        self.addCleanup(environment.stop)
        self.remote = self.base / "origin.git"
        self.sh(self.base, "init", "-q", "--bare", "-b", "main", str(self.remote))
        self.work = self.base / "work"
        self.sh(self.base, "init", "-q", "-b", "main", str(self.work))
        self.sh(self.work, "remote", "add", "origin", str(self.remote))
        for path, text in {
            "web/src/main.js": "old\n", "web/src/style.css": "css\n", "README.md": "readme\n",
            "web/tests/existing.test.js": "// test\n", "web/public/sw.js": sw_text(10), "web/public/version.json": OLD_VERSION_TEXT,
            "content/tag-06.md": STAGE,
        }.items():
            self.put(self.work, path, text)
        self.commit(self.work, "Basis")
        self.sh(self.work, "push", "-q", "origin", "main")
        self.bundle_dir = self.base / "out"
        outputs = patch.dict(os.environ, {
            "BUNDLE_DIR": str(self.bundle_dir), "GITHUB_OUTPUT": str(self.base / "github_output"),
        })
        outputs.start()
        self.addCleanup(outputs.stop)

    def sh(self, cwd, *args):
        return subprocess.run(
            ["git", "--no-pager", *args], cwd=cwd, check=True, capture_output=True, text=True,
        ).stdout.strip()

    def put(self, repo, path, text):
        target = Path(repo) / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")

    def commit(self, repo, message, identity=None):
        identity = identity or self.MAINTAINER
        self.sh(repo, "add", "-A")
        self.sh(repo, *identity, "commit", "-q", "-m", message)
        return self.sh(repo, "rev-parse", "HEAD")

    def clone(self, name):
        target = self.base / name
        counter = 1
        while target.exists():
            counter += 1
            target = self.base / f"{name}-{counter}"
        self.sh(self.base, "clone", "-q", str(self.remote), str(target))
        return target

    def advance_main(self, changes):
        """Neuer Commit auf main im Remote (z. B. ein zwischenzeitlich gemergter PR)."""
        other = self.clone(f"other-{len(list(self.base.iterdir()))}")
        for path, text in changes.items():
            self.put(other, path, text)
        self.commit(other, "main wandert weiter")
        self.sh(other, "push", "-q", "origin", "main")
        return self.sh(other, "rev-parse", "HEAD")

    def generate(self, changes=None, plan=None):
        """Erzeugt Commit und Bundle wie implement-generate (im Checkout `work`)."""
        plan = plan or complete_plan_text()
        with patch.object(agent_runner, "ROOT", self.work):
            self.sh(self.work, "switch", "-q", "main")
            self.sh(self.work, "branch", "-q", "-D", "implement") if self.sh(
                self.work, "branch", "--list", "implement") else None
            base, head = agent_runner.create_commit(self.ISSUE, changes or valid_changes())
            digest = agent_runner.write_bundle(self.ISSUE, plan, base, head, changes or valid_changes())
            self.sh(self.work, "switch", "-q", "main")
        return base, head, digest, plan

    def raw_bundle(self, files, *, identity=("AI Roadbook Agent", "agent@balkan-ride.local"),
                   commits=1, symlink=None):
        """Bundle mit frei gebauten Commits (um Prüfungen mit unzulässigem Inhalt zu belegen)."""
        self.sh(self.work, "switch", "-q", "main")
        base = self.sh(self.work, "rev-parse", "HEAD")
        self.sh(self.work, "switch", "-q", "-C", "implement")
        for number in range(commits):
            for path, text in files.items():
                self.put(self.work, path, text + (f"{number}\n" if number else ""))
            if symlink:
                (self.work / symlink[1]).symlink_to(symlink[0])
            self.commit(self.work, f"feat {number}", ("-c", f"user.name={identity[0]}",
                                                       "-c", f"user.email={identity[1]}"))
        head = self.sh(self.work, "rev-parse", "HEAD")
        self.bundle_dir.mkdir(parents=True, exist_ok=True)
        bundle = self.bundle_dir / agent_runner.BUNDLE_NAME
        self.sh(self.work, "bundle", "create", str(bundle), "refs/heads/implement", f"^{base}")
        digest = agent_runner.sha256_file(bundle)
        self.sh(self.work, "switch", "-q", "main")
        return base, head, digest

    def environment_for(self, base, head, digest, generated_plan=None):
        env = {
            "BUNDLE_FILE": str(self.bundle_dir / agent_runner.BUNDLE_NAME), "BASE_SHA": base,
            "HEAD_SHA": head, "BUNDLE_SHA256": digest,
            "PLAN_SHA256": agent_runner.plan_sha256(generated_plan or complete_plan_text()),
            "VISUAL_ARTIFACT": "visual-report-issue-3-9-1",
        }
        return patch.dict(os.environ, env)

    def remote_refs(self):
        return self.sh(self.base, "--git-dir", str(self.remote), "for-each-ref", "--format=%(refname) %(objectname)")

    def remote_sha(self, branch):
        return self.sh(self.base, "--git-dir", str(self.remote), "rev-parse", f"refs/heads/{branch}")

    def fake_api(self, existing_prs=()):
        calls = []

        def api(session, method, url, **kwargs):
            calls.append((method, url, kwargs))
            if method == "GET":
                return Mock(json=Mock(return_value=list(existing_prs)))
            return Mock(json=Mock(return_value={"html_url": "https://github.com/o/r/pull/7"}))

        return api, calls

    def publish(self, clone, base, head, digest, *, plan=None, generated_plan=None, existing_prs=()):
        plan = plan or complete_plan_text()
        api, calls = self.fake_api(existing_prs)
        with patch.object(agent_runner, "ROOT", clone), \
                self.environment_for(base, head, digest, generated_plan or plan), \
                patch.object(agent_runner, "api", api):
            result = agent_runner.publish_verified(
                Mock(), "https://api.github.com/repos/o/r", self.ISSUE, plan,
                agent_runner.planned_paths(plan),
            )
        return result, calls


class CommitBundleTests(GitFixture):
    def test_generate_commit_is_local_only(self):
        before = self.remote_refs()
        base, head, _, _ = self.generate()
        self.assertEqual(self.sh(self.work, "rev-parse", f"{head}^"), base)
        self.assertEqual(self.sh(self.work, "log", "-1", "--format=%an <%ae>", head),
                         "AI Roadbook Agent <agent@balkan-ride.local>")
        self.assertEqual(self.remote_refs(), before)
        self.assertNotIn("feature/issue-3", self.remote_refs())

    def test_bundle_roundtrip_keeps_the_commit_sha_and_reports_the_anchors(self):
        base, head, digest, plan = self.generate()
        fresh = self.clone("fresh")
        with patch.object(agent_runner, "ROOT", fresh):
            agent_runner.import_bundle(self.bundle_dir / agent_runner.BUNDLE_NAME, base, head, digest)
            self.assertEqual(self.sh(fresh, "rev-parse", agent_runner.VERIFIED_REF), head)
        outputs = dict(line.split("=", 1) for line in
                       (self.base / "github_output").read_text(encoding="utf-8").splitlines())
        self.assertEqual(
            (outputs["base_sha"], outputs["head_sha"], outputs["bundle_sha256"], outputs["plan_sha256"]),
            (base, head, digest, agent_runner.plan_sha256(plan)),
        )
        meta = json.loads((self.bundle_dir / "meta.json").read_text(encoding="utf-8"))
        self.assertEqual((meta["head_sha"], meta["bundle_sha256"]), (head, digest))

    def test_tampered_or_mismatching_bundles_are_rejected(self):
        base, head, digest, _ = self.generate()
        bundle = self.bundle_dir / agent_runner.BUNDLE_NAME
        fresh = self.clone("fresh")
        with patch.object(agent_runner, "ROOT", fresh):
            with self.assertRaisesRegex(ValueError, "Prüfsumme"):
                agent_runner.import_bundle(bundle, base, head, "0" * 64)
            with self.assertRaisesRegex(ValueError, "head_sha"):
                agent_runner.import_bundle(bundle, base, base, digest)
            bundle.write_bytes(bundle.read_bytes() + b"x")
            with self.assertRaisesRegex(ValueError, "Prüfsumme"):
                agent_runner.import_bundle(bundle, base, head, digest)
            for bad in ("", "xyz", "A" * 40):
                with self.assertRaises(ValueError):
                    agent_runner.import_bundle(bundle, bad, head, digest)


class GateTests(GitFixture):
    def gate(self, base, head, digest, *, checkout=None):
        clone = checkout or self.clone("verify")
        with patch.object(agent_runner, "ROOT", clone), self.environment_for(base, head, digest):
            agent_runner.gate_bundle()

    def test_gate_accepts_the_generated_commit(self):
        base, head, digest, _ = self.generate()
        self.gate(base, head, digest)

    def test_gate_rejects_forbidden_paths(self):
        for path in (".github/workflows/x.yml", "docs/x.md", "export/x.md", "config/commands/x.md",
                     "web/package.json", "README.md"):
            with self.subTest(path=path):
                base, head, digest = self.raw_bundle({path: "x\n"})
                with self.assertRaises(ValueError):
                    self.gate(base, head, digest)

    def test_gate_rejects_more_than_one_commit(self):
        base, head, digest = self.raw_bundle({"web/src/main.js": "neu\n"}, commits=2)
        with self.assertRaisesRegex(ValueError, "genau einen Commit"):
            self.gate(base, head, digest)

    def test_gate_rejects_foreign_authors(self):
        base, head, digest = self.raw_bundle(
            {"web/src/main.js": "neu\n"}, identity=("Mallory", "m@example.org"))
        with self.assertRaisesRegex(ValueError, "nicht vom Roadbook-Agenten"):
            self.gate(base, head, digest)

    def test_gate_rejects_symlinks(self):
        base, head, digest = self.raw_bundle(
            {"web/src/main.js": "neu\n"}, symlink=("main.js", "web/src/link.js"))
        with self.assertRaisesRegex(ValueError, "normale Textdateien"):
            self.gate(base, head, digest)

    def test_gate_rejects_a_web_change_without_version_files(self):
        base, head, digest = self.raw_bundle({"web/src/main.js": "neu\n"})
        with self.assertRaisesRegex(ValueError, "Versionsdateien"):
            self.gate(base, head, digest)

    def test_gate_rejects_a_wrong_version_step(self):
        base, head, digest = self.raw_bundle({
            "web/src/main.js": "neu\n", "web/tests/main.test.js": "test\n",
            "web/public/sw.js": sw_text(12), "web/public/version.json": version_text(cache=12),
        })
        with self.assertRaisesRegex(ValueError, "Cache v12 statt v11"):
            self.gate(base, head, digest)

    def test_gate_rejects_an_invalid_stage_file(self):
        base, head, digest = self.raw_bundle({"content/tag-06.md": "---\ntag: 6\n---\nText\n"})
        with self.assertRaises(ValueError):
            self.gate(base, head, digest)

    def test_gate_requires_the_checkout_to_be_the_base_commit(self):
        base, head, digest, _ = self.generate()
        self.advance_main({"README.md": "weiter\n"})
        moved = self.clone("moved")
        with self.assertRaisesRegex(ValueError, "Basisstand"):
            self.gate(base, head, digest, checkout=moved)


class PublishTests(GitFixture):
    def test_publish_pushes_exactly_the_verified_sha_and_opens_the_pr(self):
        base, head, digest, _ = self.generate()
        result, calls = self.publish(self.clone("publish"), base, head, digest)
        self.assertEqual(self.remote_sha("feature/issue-3"), head)
        post = next(kwargs for method, url, kwargs in calls if method == "POST")
        self.assertIn(head, post["json"]["body"])
        self.assertIn(base, post["json"]["body"])
        self.assertIn("visual-report-issue-3-9-1", post["json"]["body"])
        self.assertIn("Closes #3", post["json"]["body"])
        self.assertEqual((post["json"]["head"], post["json"]["base"]), ("feature/issue-3", "main"))
        self.assertIn("pull/7", result)

    def test_changed_plan_stops_before_any_remote_access(self):
        base, head, digest, plan = self.generate()
        before = self.remote_refs()
        with self.assertRaisesRegex(ValueError, "Plan hat sich"):
            self.publish(self.clone("publish"), base, head, digest,
                         plan=plan + "\nNeu", generated_plan=plan)
        self.assertEqual(self.remote_refs(), before)

    def test_changes_outside_the_approved_plan_stop_before_the_push(self):
        base, head, digest, plan = self.generate()
        narrow = complete_plan_text(lines=COMPLETE_LINES[1:])
        before = self.remote_refs()
        with self.assertRaisesRegex(ValueError, "nicht freigegebene Dateien"):
            self.publish(self.clone("publish"), base, head, digest, plan=narrow, generated_plan=narrow)
        self.assertEqual(self.remote_refs(), before)

    def test_lease_rejects_when_the_remote_moved_after_observation(self):
        base, head, _, _ = self.generate()
        other = self.clone("other")
        self.sh(other, "switch", "-q", "-c", "feature/issue-3")
        self.put(other, "README.md", "a\n")
        first = self.commit(other, "agent a", ("-c", "user.name=AI Roadbook Agent",
                                               "-c", "user.email=agent@balkan-ride.local"))
        self.sh(other, "push", "-q", "origin", "feature/issue-3")
        self.put(other, "README.md", "b\n")
        second = self.commit(other, "agent b", ("-c", "user.name=AI Roadbook Agent",
                                                "-c", "user.email=agent@balkan-ride.local"))
        self.sh(other, "push", "-q", "origin", "feature/issue-3")
        fresh = self.clone("push")
        with patch.object(agent_runner, "ROOT", fresh), self.environment_for(base, head, "0" * 64):
            self.sh(fresh, "fetch", "-q", str(self.work), "refs/heads/implement:refs/agent/verified")
            with self.assertRaises(subprocess.CalledProcessError):
                agent_runner.push_verified_commit(self.ISSUE, head, first)
        self.assertEqual(self.remote_sha("feature/issue-3"), second)

    def test_absent_remote_uses_an_empty_expectation(self):
        base, head, _, _ = self.generate()
        fresh = self.clone("push")
        with patch.object(agent_runner, "ROOT", fresh):
            self.sh(fresh, "fetch", "-q", str(self.work), "refs/heads/implement:refs/agent/verified")
            self.assertIsNone(agent_runner.remote_branch_sha("feature/issue-3"))
            agent_runner.push_verified_commit(self.ISSUE, head, None)
            self.assertEqual(self.remote_sha("feature/issue-3"), head)
            # Der Branch ist inzwischen von jemand anderem angelegt worden: kein Überschreiben.
            self.sh(fresh, "push", "-q", "--force", "origin", f"{base}:refs/heads/feature/issue-3")
            with self.assertRaises(subprocess.CalledProcessError):
                agent_runner.push_verified_commit(self.ISSUE, head, None)
        self.assertEqual(self.remote_sha("feature/issue-3"), base)

    def test_ls_remote_error_is_not_treated_as_a_missing_branch(self):
        fresh = self.clone("push")
        self.sh(fresh, "remote", "set-url", "origin", str(self.base / "gibt-es-nicht.git"))
        with patch.object(agent_runner, "ROOT", fresh):
            with self.assertRaisesRegex(RuntimeError, "Remote-Zustand nicht ermittelbar"):
                agent_runner.remote_branch_sha("feature/issue-3")

    def test_foreign_commits_on_the_remote_branch_block_the_overwrite(self):
        base, head, digest, _ = self.generate()
        other = self.clone("human")
        self.sh(other, "switch", "-q", "-c", "feature/issue-3")
        self.put(other, "README.md", "von Hand\n")
        human = self.commit(other, "manuell")
        self.sh(other, "push", "-q", "origin", "feature/issue-3")
        with self.assertRaisesRegex(ValueError, "nicht vom Roadbook-Agenten"):
            self.publish(self.clone("publish"), base, head, digest)
        self.assertEqual(self.remote_sha("feature/issue-3"), human)

    def test_agent_only_branches_are_overwritten_by_a_repeated_run(self):
        first_base, first_head, _, _ = self.generate()
        self.publish(self.clone("first"), first_base, first_head,
                     agent_runner.sha256_file(self.bundle_dir / agent_runner.BUNDLE_NAME))
        shutil.rmtree(self.bundle_dir)
        changes = valid_changes(**{"web/src/main.js": "zweiter Lauf\n"})
        base, head, digest, _ = self.generate(changes)
        self.assertNotEqual(head, first_head)
        self.publish(self.clone("second"), base, head, digest)
        self.assertEqual(self.remote_sha("feature/issue-3"), head)

    def test_stale_base_blocks_when_main_touched_the_same_paths(self):
        base, head, digest, _ = self.generate()
        self.advance_main({"web/src/main.js": "anderer Stand\n"})
        before = self.remote_refs()
        with self.assertRaisesRegex(ValueError, "Basis veraltet.*web/src/main.js"):
            self.publish(self.clone("publish"), base, head, digest)
        self.assertEqual(self.remote_refs(), before)

    def test_stale_base_blocks_when_main_bumped_the_version_files(self):
        base, head, digest, _ = self.generate()
        self.advance_main({"web/public/sw.js": sw_text(11), "web/public/version.json": version_text()})
        with self.assertRaisesRegex(ValueError, "Basis veraltet.*web/public/sw.js"):
            self.publish(self.clone("publish"), base, head, digest)
        self.assertNotIn("feature/issue-3", self.remote_refs())

    def test_stale_base_allows_unrelated_main_changes(self):
        base, head, digest, _ = self.generate()
        self.advance_main({"README.md": "weiter\n"})
        self.publish(self.clone("publish"), base, head, digest)
        self.assertEqual(self.remote_sha("feature/issue-3"), head)

    def test_existing_open_pr_is_updated_not_duplicated(self):
        base, head, digest, _ = self.generate()
        existing = [{"html_url": "https://github.com/o/r/pull/5"}]
        result, calls = self.publish(self.clone("publish"), base, head, digest, existing_prs=existing)
        self.assertEqual([method for method, _, _ in calls], ["GET"])
        self.assertIn("aktualisiert", result)
        self.assertIn(head, result)
        self.assertIn("pull/5", result)
        self.assertEqual(self.remote_sha("feature/issue-3"), head)


PNG = agent_runner.PNG_HEADER + b"\x00" * 24


class PreviewTests(GitFixture):
    HEAD = "b" * 40

    def preview_dir(self, files=None, name="previews"):
        directory = self.base / name
        shutil.rmtree(directory, ignore_errors=True)
        directory.mkdir()
        for name in (files if files is not None else agent_runner.PREVIEW_IMAGES):
            (directory / name).write_bytes(PNG)
        return directory

    def tree(self, ref="pr-previews"):
        return self.sh(self.base, "--git-dir", str(self.remote), "ls-tree", "-r", "--name-only", f"refs/heads/{ref}").splitlines()

    def update(self, clone, number=3, sha="b" * 7, names=("desktop-main.png",)):
        with patch.object(agent_runner, "ROOT", clone):
            return agent_runner.update_preview_branch(
                number, {f"{sha}/{name}": PNG for name in names}, f"Vorschau {number}")

    def test_only_valid_known_png_files_are_accepted(self):
        images = agent_runner.validated_previews(self.preview_dir())
        self.assertEqual(set(images), set(agent_runner.PREVIEW_IMAGES))
        directory = self.preview_dir(["desktop-main.png"])
        self.assertEqual(set(agent_runner.validated_previews(directory)), {"desktop-main.png"})
        for label, prepare in {
            "kein PNG": lambda d: (d / "desktop-main.png").write_bytes(b"<html>nope</html>"),
            "nur Signatur": lambda d: (d / "desktop-main.png").write_bytes(agent_runner.PNG_SIGNATURE + b"x" * 30),
            "zu groß": lambda d: (d / "desktop-main.png").write_bytes(
                PNG + b"\0" * agent_runner.MAX_PREVIEW_BYTES),
            "fremder Name": lambda d: (d / "evil.png").write_bytes(PNG),
            "Skript": lambda d: (d / "run.sh").write_text("echo hi"),
            "Unterordner": lambda d: (d / "iphone-12-mini-main.png").mkdir(),
            "Symlink": lambda d: ((d / "iphone-12-mini-main.png").symlink_to("/etc/hosts")),
        }.items():
            with self.subTest(label):
                directory = self.preview_dir(["desktop-main.png"])
                prepare(directory)
                with self.assertRaises(ValueError):
                    agent_runner.validated_previews(directory)
        with self.assertRaisesRegex(ValueError, "keine Bilder"):
            agent_runner.validated_previews(self.preview_dir([]))
        with self.assertRaisesRegex(ValueError, "fehlt"):
            agent_runner.validated_previews(self.base / "gibt-es-nicht")

    def test_comment_embeds_the_images_and_carries_the_issue_marker(self):
        body = agent_runner.preview_comment(3, "o/r", "b" * 40, set(agent_runner.PREVIEW_IMAGES))
        base = "https://raw.githubusercontent.com/o/r/pr-previews/issue-3/bbbbbbb"
        self.assertIn(f"![Mobile Vorschau – Hauptansicht]({base}/iphone-12-mini-main.png)", body)
        self.assertIn(f"![Desktop Vorschau – Hauptansicht]({base}/desktop-main.png)", body)
        self.assertEqual(body.splitlines()[-1], "<!-- roadbook-preview:3 -->")
        partial = agent_runner.preview_comment(3, "o/r", "b" * 40, {"desktop-main.png"})
        self.assertNotIn("iphone", partial)

    def test_previews_go_to_an_isolated_orphan_branch_and_leave_other_branches_alone(self):
        before = self.remote_refs()
        clone = self.clone("publish")
        self.assertTrue(self.update(clone, names=("desktop-main.png", "iphone-12-mini-main.png")))
        self.assertEqual(self.tree(), ["issue-3/bbbbbbb/desktop-main.png", "issue-3/bbbbbbb/iphone-12-mini-main.png"])
        self.assertEqual(self.sh(self.base, "--git-dir", str(self.remote), "rev-list", "--max-parents=0",
                                 "refs/heads/pr-previews"), self.remote_sha("pr-previews"))
        shared = subprocess.run(["git", "--git-dir", str(self.remote), "merge-base",
                                 "refs/heads/main", "refs/heads/pr-previews"], capture_output=True)
        self.assertNotEqual(shared.returncode, 0)
        self.assertEqual([line for line in self.remote_refs().splitlines() if "pr-previews" not in line],
                         before.splitlines())
        self.assertEqual(self.sh(clone, "status", "--porcelain"), "")

    def test_a_rerun_replaces_only_its_own_issue_folder(self):
        clone = self.clone("publish")
        self.update(clone, number=4, sha="1" * 7)
        self.update(clone, number=3, sha="a" * 7)
        self.assertTrue(self.update(clone, number=3, sha="b" * 7))
        self.assertEqual(self.tree(), ["issue-3/bbbbbbb/desktop-main.png", "issue-4/1111111/desktop-main.png"])
        tip = self.remote_sha("pr-previews")
        self.assertFalse(self.update(clone, number=3, sha="b" * 7))
        self.assertEqual(self.remote_sha("pr-previews"), tip)

    def test_cleanup_removes_only_the_closed_issue_and_ignores_other_branches(self):
        clone = self.clone("cleanup")
        self.update(clone, number=3)
        self.update(clone, number=4, sha="1" * 7)
        with patch.object(agent_runner, "ROOT", clone):
            for ref in ("main", "feature/issue-03", "feature/issue-3/../x", "feature/issue-", "copilot/fix-3"):
                with patch.dict(os.environ, {"PR_HEAD_REF": ref}):
                    self.assertFalse(agent_runner.cleanup_previews(), ref)
            self.assertEqual(len(self.tree()), 2)
            with patch.dict(os.environ, {"PR_HEAD_REF": "feature/issue-3"}):
                self.assertTrue(agent_runner.cleanup_previews())
                self.assertFalse(agent_runner.cleanup_previews())
        self.assertEqual(self.tree(), ["issue-4/1111111/desktop-main.png"])

    def test_cleanup_without_a_preview_branch_creates_nothing(self):
        before = self.remote_refs()
        with patch.object(agent_runner, "ROOT", self.clone("cleanup")), \
                patch.dict(os.environ, {"PR_HEAD_REF": "feature/issue-3"}):
            self.assertFalse(agent_runner.cleanup_previews())
        self.assertEqual(self.remote_refs(), before)

    def test_a_concurrent_push_is_rebased_never_forced(self):
        clone = self.clone("publish")
        self.update(clone, number=4, sha="1" * 7)
        real, raced = agent_runner.preview_git, []

        def racing(*args, **kwargs):
            if args[0] == "push" and not raced:
                raced.append(True)
                other = self.clone("racer")
                self.sh(other, "switch", "-q", "-c", "work", "origin/pr-previews")
                self.put(other, "issue-5/x/desktop-main.png", "fremd")
                self.commit(other, "anderer Lauf")
                self.sh(other, "push", "-q", "origin", "HEAD:refs/heads/pr-previews")
            return real(*args, **kwargs)

        with patch.object(agent_runner, "preview_git", racing):
            self.assertTrue(self.update(clone, number=3))
        self.assertEqual(self.tree(), ["issue-3/bbbbbbb/desktop-main.png", "issue-4/1111111/desktop-main.png",
                                       "issue-5/x/desktop-main.png"])

    def test_a_persistent_push_failure_is_reported(self):
        clone = self.clone("publish")
        real = agent_runner.preview_git

        def denied(*args, **kwargs):
            if args[0] == "push":
                raise subprocess.CalledProcessError(1, "git", stderr=b"denied")
            return real(*args, **kwargs)

        with patch.object(agent_runner, "preview_git", denied):
            with self.assertRaisesRegex(RuntimeError, "pr-previews fehlgeschlagen: denied"):
                self.update(clone)
        self.assertNotIn("pr-previews", self.remote_refs())

    def publish_preview(self, directory, *, pulls=None, comments=()):
        calls = []

        def api(session, method, url, **kwargs):
            calls.append((method, url, kwargs))
            if method == "GET":
                return Mock(json=Mock(return_value=pulls if pulls is not None
                                      else [{"number": 7, "head": {"sha": self.HEAD}}]))
            return Mock(json=Mock(return_value={}))

        environment = {"PREVIEW_DIR": str(directory), "HEAD_SHA": self.HEAD}
        with patch.object(agent_runner, "ROOT", self.clone("publish")), patch.dict(os.environ, environment), \
                patch.object(agent_runner, "api", api), \
                patch.object(agent_runner, "get_comments", Mock(return_value=list(comments))):
            result = agent_runner.publish_preview(Mock(), "https://api.github.com/repos/o/r", self.ISSUE)
        return result, calls

    def test_preview_comment_is_posted_after_the_images_are_published(self):
        _, calls = self.publish_preview(self.preview_dir())
        self.assertEqual(len(self.tree()), 3)
        post = next(kwargs for method, url, kwargs in calls if method == "POST")
        self.assertTrue(next(url for method, url, _ in calls if method == "POST").endswith("/issues/7/comments"))
        self.assertIn("raw.githubusercontent.com/o/r/pr-previews/issue-3/bbbbbbb/desktop-main.png", post["json"]["body"])
        self.assertIn("<!-- roadbook-preview:3 -->", post["json"]["body"])

    def test_a_repeated_run_updates_the_marker_comment_instead_of_adding_one(self):
        marker = "Alt\n\n<!-- roadbook-preview:3 -->"
        own = {"id": 41, "user": {"login": agent_runner.BOT}, "body": marker}
        _, calls = self.publish_preview(self.preview_dir(), comments=[own])
        methods = [(method, url.rsplit("/", 2)[-2:]) for method, url, _ in calls]
        self.assertIn(("PATCH", ["comments", "41"]), methods)
        self.assertNotIn("POST", [method for method, _ in methods])

    def test_a_foreign_comment_with_the_marker_is_never_edited(self):
        forged = {"id": 42, "user": {"login": "mallory"}, "body": "<!-- roadbook-preview:3 -->"}
        _, calls = self.publish_preview(self.preview_dir(), comments=[forged])
        self.assertEqual([method for method, _, _ in calls], ["GET", "POST"])

    def test_invalid_images_or_a_mismatching_pr_publish_nothing(self):
        broken = self.preview_dir(["desktop-main.png"], "broken")
        (broken / "desktop-main.png").write_bytes(b"GIF89a")
        for label, directory, pulls in (
            ("kein PNG", broken, None),
            ("anderer Commit", self.preview_dir(), [{"number": 7, "head": {"sha": "c" * 40}}]),
            ("kein offener PR", self.preview_dir(), []),
        ):
            with self.subTest(label), self.assertRaises(ValueError):
                self.publish_preview(directory, pulls=pulls)
        self.assertNotIn("pr-previews", self.remote_refs())

    def test_preview_mode_failures_warn_but_are_raised_for_the_step_log(self):
        issue = dict(self.ISSUE)
        event = {"action": "created", "issue": issue, "comment": {"id": 20, "user": {"login": "boss"}, "body": "/go"}}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "event.json"
            path.write_text(json.dumps(event), encoding="utf-8")
            environment = {
                "MODE": "preview", "GITHUB_EVENT_NAME": "issue_comment", "GITHUB_EVENT_PATH": str(path),
                "ALLOWED_GITHUB_USER": "boss", "ISSUE_NUMBER": "3", "GITHUB_TOKEN": "t",
                "HEAD_SHA": self.HEAD, "PREVIEW_DIR": str(self.base / "fehlt"),
            }
            with patch.dict(os.environ, environment), \
                    patch.object(agent_runner, "api", Mock(return_value=Mock(json=Mock(return_value=issue)))), \
                    patch("builtins.print") as printed:
                with self.assertRaisesRegex(ValueError, "Vorschau-Artefakt fehlt"):
                    agent_runner.main()
        self.assertTrue(any("::warning::" in str(call.args[0]) for call in printed.call_args_list))


WORKFLOW_DIRECTORY = Path(__file__).resolve().parents[1] / "workflows"


def load_workflow(name):
    return yaml.safe_load((WORKFLOW_DIRECTORY / name).read_text(encoding="utf-8"))


def step_runs(job):
    return [step.get("run", "") for step in job["steps"]]


def step_index(job, predicate, label):
    for index, step in enumerate(job["steps"]):
        if predicate(step):
            return index
    raise AssertionError(f"Schritt fehlt: {label}")


class WorkflowPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.agent = load_workflow("ai-agent-workflow.yml")
        cls.pages = load_workflow("deploy-pages.yml")
        cls.jobs = cls.agent["jobs"]

    def test_generate_cannot_write_to_the_repository_and_keeps_no_credentials(self):
        job = self.jobs["implement-generate"]
        self.assertEqual(job["permissions"], {"contents": "read", "issues": "write"})
        checkouts = [step for step in job["steps"] if str(step.get("uses", "")).startswith("actions/checkout")]
        self.assertTrue(checkouts)
        for step in checkouts:
            self.assertIs(step["with"]["persist-credentials"], False)
        self.assertTrue(job["concurrency"]["group"].startswith("roadbook-implement-"))
        self.assertIs(job["concurrency"]["cancel-in-progress"], False)
        self.assertEqual(
            set(job["outputs"]),
            {"base_sha", "head_sha", "bundle_sha256", "plan_sha256", "artifact_name"},
        )
        upload = next(step for step in job["steps"] if str(step.get("uses", "")).startswith("actions/upload-artifact"))
        self.assertEqual(upload["with"]["retention-days"], 1)
        runner = next(step for step in job["steps"] if step.get("id") == "runner")
        self.assertEqual(runner["env"]["MODE"], "implement")
        self.assertIn("${{ github.run_id }}-${{ github.run_attempt }}", runner["env"]["ARTIFACT_NAME"])
        self.assertTrue(runner["env"]["ARTIFACT_NAME"].startswith("implement-bundle-"))

    def test_verify_runs_without_secrets_tokens_or_write_access(self):
        job = self.jobs["implement-verify"]
        self.assertEqual(job["permissions"], {"contents": "read"})
        dump = json.dumps(job)
        self.assertNotEqual(job["permissions"].get("contents"), "write")
        for forbidden in ("secrets.", "ANTHROPIC", "GITHUB_TOKEN"):
            self.assertNotIn(forbidden, dump)
        self.assertEqual(job["needs"], "implement-generate")
        checkout = job["steps"][0]
        self.assertTrue(checkout["uses"].startswith("actions/checkout"))
        self.assertIs(checkout["with"]["persist-credentials"], False)
        self.assertEqual(checkout["with"]["ref"], "${{ needs.implement-generate.outputs.base_sha }}")

    def test_verify_checks_the_bound_commit_before_running_any_of_its_code(self):
        job = self.jobs["implement-verify"]
        gate = step_index(job, lambda step: step.get("env", {}).get("MODE") == "gate", "gate")
        detach = step_index(job, lambda step: "checkout --detach" in step.get("run", ""), "detach")
        agent_tests = step_index(job, lambda step: "test_agent_runner.py" in step.get("run", ""), "agent tests")
        python_tests = step_index(job, lambda step: 'web/tests -p "test_*.py"' in step.get("run", "")
                                  and 'scripts -p "test_*.py"' in step.get("run", ""), "python tests")
        install = step_index(job, lambda step: step.get("run", "") == "npm ci", "npm ci")
        node = step_index(job, lambda step: "node --test web/tests/*.test.js" in step.get("run", ""), "node")
        build = step_index(job, lambda step: "npm run build --prefix web" in step.get("run", ""), "build")
        browser = step_index(job, lambda step: "playwright install" in step.get("run", ""), "chromium")
        visual = step_index(job, lambda step: "npm run test:visual --prefix web" in step.get("run", ""), "visual")
        self.assertLess(gate, detach)
        self.assertLess(detach, agent_tests)
        self.assertLess(detach, install)
        self.assertLess(install, node)
        self.assertLess(node, build)
        self.assertLess(build, browser)
        self.assertLess(browser, visual)
        self.assertLess(detach, python_tests)
        env = job["steps"][gate]["env"]
        self.assertEqual(
            {key: env[key] for key in ("BASE_SHA", "HEAD_SHA", "BUNDLE_SHA256")},
            {"BASE_SHA": "${{ needs.implement-generate.outputs.base_sha }}",
             "HEAD_SHA": "${{ needs.implement-generate.outputs.head_sha }}",
             "BUNDLE_SHA256": "${{ needs.implement-generate.outputs.bundle_sha256 }}"},
        )

    def test_visual_gate_is_blocking_and_the_report_is_kept_on_failure(self):
        job = self.jobs["implement-verify"]
        for step in job["steps"]:
            if step.get("name") != "Vorschaubilder sichern":
                self.assertNotIn("continue-on-error", step)
        upload = next(step for step in job["steps"]
                      if str(step.get("uses", "")).startswith("actions/upload-artifact"))
        self.assertEqual(upload["if"], "always()")
        self.assertEqual(upload["with"]["path"], "web/.visual-report/")
        self.assertTrue(upload["with"]["name"].startswith("visual-report-issue-"))

    def test_publish_needs_generate_and_verify_and_executes_no_artifact_code(self):
        job = self.jobs["implement-publish"]
        self.assertEqual(set(job["needs"]), {"implement-generate", "implement-verify"})
        self.assertEqual(job["permissions"], {
            "contents": "write", "issues": "write", "pull-requests": "write"})
        self.assertTrue(job["concurrency"]["group"].startswith("roadbook-publish-"))
        self.assertIs(job["concurrency"]["cancel-in-progress"], False)
        for command in step_runs(job):
            for forbidden in ("npm", "node ", "unittest", "pytest", "bash ", "sh "):
                self.assertNotIn(forbidden, command)
        runner = next(step for step in job["steps"] if step.get("env", {}).get("MODE") == "publish")
        self.assertEqual(runner["run"], "python .github/scripts/agent_runner.py")
        self.assertIn("PLAN_SHA256", runner["env"])

    def test_report_jobs_wait_for_every_stage_and_deduplicate_by_run_marker(self):
        report = self.jobs["implement-report"]
        self.assertEqual(set(report["needs"]),
                         {"implement-generate", "implement-verify", "implement-publish"})
        self.assertIn("always()", report["if"])
        runner = next(step for step in report["steps"] if step.get("env", {}).get("MODE") == "report")
        for stage in ("GENERATE_RESULT", "VERIFY_RESULT", "PUBLISH_RESULT"):
            self.assertIn(stage, runner["env"])
        plan_report = self.jobs["plan-report"]
        script = next(step["with"]["script"] for step in plan_report["steps"] if "with" in step)
        self.assertIn("roadbook-run:", script)
        self.assertIn("listComments", script)

    def test_run_steps_never_interpolate_expressions_into_shell_commands(self):
        for workflow in (self.agent, self.pages):
            for name, job in workflow["jobs"].items():
                for step in job.get("steps", []):
                    self.assertNotIn("${{", step.get("run", ""), f"{name}: {step.get('name')}")
                    self.assertNotIn("${{", step.get("with", {}).get("script", ""), f"{name}: {step.get('name')}")

    def test_commands_are_routed_by_the_tested_runner_not_by_substring_checks(self):
        route = self.jobs["route"]
        self.assertEqual(route["permissions"], {"contents": "read"})
        self.assertEqual(set(route["outputs"]), {"plan", "implement"})
        step = next(step for step in route["steps"] if step.get("id") == "route")
        self.assertEqual(step["env"], {"MODE": "route"})
        checkout = route["steps"][0]
        self.assertEqual(checkout["with"]["ref"], "main")
        self.assertIs(checkout["with"]["persist-credentials"], False)
        for command in ("/plan", "/implement-item", "/go"):
            self.assertIn(f"contains(github.event.comment.body, '{command}')", route["if"])
        self.assertIn("vars.ROADBOOK_AGENT_USER", route["if"])
        self.assertIn("!github.event.issue.pull_request", route["if"])
        plan, generate = self.jobs["plan-stage"], self.jobs["implement-generate"]
        self.assertEqual(plan["needs"], "route")
        self.assertEqual(plan["if"], "needs.route.outputs.plan == 'true'")
        self.assertEqual(generate["needs"], "route")
        self.assertEqual(generate["if"], "needs.route.outputs.implement == 'true'")
        for stage in (plan, generate):
            self.assertNotIn("github.event.comment", stage["if"])

    def test_reports_ignore_routing_and_only_react_to_their_own_stages(self):
        self.assertNotIn("route", self.jobs["implement-report"]["needs"])
        self.assertNotIn("implement-publish-preview", self.jobs)
        plan_report = self.jobs["plan-report"]
        self.assertEqual(plan_report["needs"], ["plan-stage"])
        self.assertIn("needs.plan-stage.result == 'failure'", plan_report["if"])
        self.assertIn("always()", plan_report["if"])

    def test_verify_uploads_only_the_selected_png_previews_without_blocking(self):
        job = self.jobs["implement-verify"]
        upload = next(step for step in job["steps"] if step.get("name") == "Vorschaubilder sichern")
        self.assertTrue(upload["uses"].startswith("actions/upload-artifact"))
        self.assertEqual(upload["with"]["name"], "pr-preview-images-${{ github.run_id }}-${{ github.run_attempt }}")
        self.assertEqual(upload["with"]["retention-days"], 1)
        self.assertIs(upload["continue-on-error"], True)
        self.assertEqual(
            upload["with"]["path"].split(),
            [f"web/.visual-report/{name}" for name in agent_runner.PREVIEW_IMAGES],
        )
        self.assertTrue(all(path.endswith(".png") for path in upload["with"]["path"].split()))
        visual = step_index(job, lambda step: "npm run test:visual --prefix web" in step.get("run", ""), "visual")
        self.assertLess(visual, job["steps"].index(upload))

    def test_preview_images_exist_in_the_visual_check(self):
        source = (Path(__file__).resolve().parents[2] / "web" / "scripts" / "visual-check.mjs").read_text(encoding="utf-8")
        for name in agent_runner.PREVIEW_IMAGES:
            slug, suffix = name.removesuffix(".png").rsplit("-", 1)
            self.assertIn(f"slug: '{slug}'", source, name)
            self.assertIn(f"'{suffix}'", source, name)

    def test_publish_shows_previews_only_after_the_pr_and_without_failing_the_run(self):
        job = self.jobs["implement-publish"]
        publish = step_index(job, lambda step: step.get("env", {}).get("MODE") == "publish", "publish")
        download = step_index(job, lambda step: str(step.get("uses", "")).startswith("actions/download-artifact")
                              and step["with"]["name"].startswith("pr-preview-images-"), "download")
        show = step_index(job, lambda step: step.get("env", {}).get("MODE") == "preview", "preview")
        self.assertLess(publish, download)
        self.assertLess(download, show)
        self.assertNotIn("continue-on-error", job["steps"][publish])
        self.assertIs(job["steps"][download]["continue-on-error"], True)
        self.assertIs(job["steps"][show]["continue-on-error"], True)
        self.assertEqual(job["steps"][show]["if"], f"steps.{job['steps'][download]['id']}.outcome == 'success'")
        env = job["steps"][show]["env"]
        self.assertEqual(env["HEAD_SHA"], "${{ needs.implement-generate.outputs.head_sha }}")
        self.assertEqual(env["PREVIEW_DIR"], job["steps"][download]["with"]["path"])
        self.assertEqual(job["steps"][show]["run"], "python .github/scripts/agent_runner.py")
        self.assertEqual(job["steps"][download]["with"]["name"],
                         "pr-preview-images-${{ github.run_id }}-${{ github.run_attempt }}")
        # Der Checkout bleibt main; der Vorschau-Branch wird nie ausgecheckt.
        for step in job["steps"]:
            self.assertNotEqual(step.get("with", {}).get("ref"), "pr-previews")

    def test_cleanup_workflow_deletes_the_preview_folder_when_a_feature_pr_closes(self):
        workflow = load_workflow("cleanup-pr-preview.yml")
        trigger = workflow.get("on", workflow.get(True))
        self.assertEqual(trigger, {"pull_request": {"types": ["closed"]}})
        job = workflow["jobs"]["cleanup"]
        self.assertEqual(job["permissions"], {"contents": "write"})
        self.assertIn("startsWith(github.event.pull_request.head.ref, 'feature/issue-')", job["if"])
        self.assertIn("github.event.pull_request.head.repo.full_name == github.repository", job["if"])
        checkout = job["steps"][0]
        self.assertEqual(checkout["with"]["ref"], "main")
        runner = next(step for step in job["steps"] if step.get("env", {}).get("MODE") == "cleanup")
        self.assertEqual(runner["env"]["PR_HEAD_REF"], "${{ github.event.pull_request.head.ref }}")
        for step in job["steps"]:
            self.assertNotIn("${{", step.get("run", ""))

    def test_all_workflows_start_without_default_permissions_or_with_read_only(self):
        self.assertEqual(self.agent["permissions"], {})
        self.assertEqual(self.pages["permissions"], {"contents": "read"})

    def test_pages_deploys_only_main_and_runs_the_gates_before_the_artifact(self):
        build = self.pages["jobs"]["build"]
        deploy = self.pages["jobs"]["deploy"]
        trigger = self.pages.get("on", self.pages.get(True))
        self.assertEqual(trigger["pull_request"]["branches"], ["main"])
        self.assertEqual(trigger["push"]["branches"], ["main"])
        self.assertIn("refs/heads/main", deploy["if"])
        self.assertIn("github.event_name != 'pull_request'", deploy["if"])
        self.assertEqual(deploy["needs"], "build")
        upload = step_index(build, lambda step: str(step.get("uses", "")).startswith("actions/upload-pages-artifact"), "pages")
        self.assertIn("refs/heads/main", build["steps"][upload]["if"])
        node = step_index(build, lambda step: "node --test web/tests/*.test.js" in step.get("run", ""), "node")
        build_step = step_index(build, lambda step: "npm run build --prefix web" in step.get("run", ""), "build")
        browser = step_index(build, lambda step: "playwright install" in step.get("run", ""), "chromium")
        visual = step_index(build, lambda step: step.get("id") == "visual", "visual")
        python_tests = step_index(build, lambda step: 'scripts -p "test_*.py"' in step.get("run", ""), "python")
        self.assertLess(python_tests, node)
        self.assertLess(node, build_step)
        self.assertLess(build_step, browser)
        self.assertLess(browser, visual)
        self.assertLess(visual, upload)

    def test_pages_visual_gate_is_staged_through_a_repository_variable(self):
        build = self.pages["jobs"]["build"]
        visual = next(step for step in build["steps"] if step.get("id") == "visual")
        self.assertEqual(visual["run"], "npm run test:visual --prefix web")
        self.assertEqual(
            visual["continue-on-error"], "${{ vars.VISUAL_GATE_BLOCKING != 'true' }}")
        report = next(step for step in build["steps"]
                      if str(step.get("uses", "")).startswith("actions/upload-artifact"))
        self.assertEqual(report["if"], "always()")


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
