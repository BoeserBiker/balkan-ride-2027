import importlib.util
import sys
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
        self.assertEqual(self.create.call_args.kwargs["max_tokens"], 2500)

    def test_truncated_plan_is_retried_with_larger_budget(self):
        self.create.side_effect = [
            response("max_tokens", ("text", "Unvollständig")),
            response("end_turn", ("text", "Vollständig")),
        ]
        self.assertEqual(agent_runner.ask_model("plan", {}, "Regeln"), "Vollständig")
        self.assertEqual([call.kwargs["max_tokens"] for call in self.create.call_args_list], [2500, 8192])

    def test_empty_plan_is_retried(self):
        self.create.side_effect = [response("end_turn"), response("end_turn", ("text", "Plan"))]
        self.assertEqual(agent_runner.ask_model("plan", {}, "Regeln"), "Plan")
        self.assertEqual(self.create.call_count, 2)

    def test_repeated_truncation_fails_without_returning_partial_text(self):
        self.create.return_value = response("max_tokens", ("text", "Unvollständig"))
        with self.assertRaisesRegex(ValueError, "stop_reason='max_tokens'"):
            agent_runner.ask_model("plan", {}, "Regeln")
        self.assertEqual(self.create.call_count, 2)

    def test_other_stop_reason_is_not_retried(self):
        self.create.return_value = response("refusal", ("text", "Ablehnung"))
        with self.assertRaisesRegex(ValueError, "stop_reason='refusal'"):
            agent_runner.ask_model("plan", {}, "Regeln")
        self.assertEqual(self.create.call_count, 1)

    def test_implementation_still_rejects_incomplete_response_without_retry(self):
        self.create.return_value = response("max_tokens", ("text", "{}"))
        with self.assertRaisesRegex(ValueError, "stop_reason='max_tokens'"):
            agent_runner.ask_model("implement", {}, "Regeln")
        self.assertEqual(self.create.call_count, 1)
        self.assertEqual(self.create.call_args.kwargs["max_tokens"], 8000)


if __name__ == "__main__":
    unittest.main()
