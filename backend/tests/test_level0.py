"""
Tests for Level 0 routes:
  POST /api/level0/evaluate-manual-test
  POST /api/level0/ask

llama_service methods are mocked so tests never require Ollama to be running.
"""
import pytest
from fastapi import HTTPException


# ── /evaluate-manual-test ─────────────────────────────────────────────────────

class TestEvaluateManualTest:

    def test_valid_payload_returns_feedback(self, client, mocker):
        mocker.patch(
            "routes.level0.llama_service.evaluate_manual_test",
            return_value="Good test steps. Consider adding an assertion for the error message.",
        )
        response = client.post("/api/level0/evaluate-manual-test", json={
            "test_steps": "Opened login page, entered credentials, clicked submit, saw dashboard.",
            "scenario": "Login Form",
            "url": "https://the-internet.herokuapp.com/login",
        })
        assert response.status_code == 200
        body = response.json()
        assert "feedback" in body
        assert isinstance(body["feedback"], str)
        assert len(body["feedback"]) > 0

    def test_feedback_content_matches_mock(self, client, mocker):
        expected = "Excellent coverage of the happy path."
        mocker.patch(
            "routes.level0.llama_service.evaluate_manual_test",
            return_value=expected,
        )
        body = client.post("/api/level0/evaluate-manual-test", json={
            "test_steps": "Opened the page and checked the title.",
        }).json()
        assert body["feedback"] == expected

    def test_optional_fields_have_defaults(self, client, mocker):
        """scenario and url are optional — omitting them must not cause a 422."""
        mocker.patch(
            "routes.level0.llama_service.evaluate_manual_test",
            return_value="ok",
        )
        response = client.post("/api/level0/evaluate-manual-test", json={
            "test_steps": "Just a step.",
        })
        assert response.status_code == 200

    def test_missing_test_steps_returns_422(self, client):
        """test_steps is required; omitting it must return 422 Unprocessable Entity."""
        response = client.post("/api/level0/evaluate-manual-test", json={})
        assert response.status_code == 422

    def test_llama_503_propagates(self, client, mocker):
        mocker.patch(
            "routes.level0.llama_service.evaluate_manual_test",
            side_effect=HTTPException(status_code=503, detail="Ollama not running"),
        )
        response = client.post("/api/level0/evaluate-manual-test", json={
            "test_steps": "Some steps.",
        })
        assert response.status_code == 503

    def test_unexpected_exception_returns_500(self, client, mocker):
        mocker.patch(
            "routes.level0.llama_service.evaluate_manual_test",
            side_effect=RuntimeError("boom"),
        )
        response = client.post("/api/level0/evaluate-manual-test", json={
            "test_steps": "Some steps.",
        })
        assert response.status_code == 500


# ── /ask ─────────────────────────────────────────────────────────────────────

class TestAskQuestion:

    def test_valid_question_returns_answer(self, client, mocker):
        mocker.patch(
            "routes.level0.llama_service.answer_automation_question",
            return_value="By.ID is preferred because IDs are unique on a page.",
        )
        response = client.post("/api/level0/ask", json={
            "question": "Why use By.ID instead of By.CLASS_NAME?",
            "context": "Selenium Python",
        })
        assert response.status_code == 200
        body = response.json()
        assert "answer" in body
        assert isinstance(body["answer"], str)

    def test_context_is_optional(self, client, mocker):
        mocker.patch(
            "routes.level0.llama_service.answer_automation_question",
            return_value="answer",
        )
        response = client.post("/api/level0/ask", json={
            "question": "What is WebDriverWait?",
        })
        assert response.status_code == 200

    def test_missing_question_returns_422(self, client):
        response = client.post("/api/level0/ask", json={})
        assert response.status_code == 422

    def test_llama_503_propagates(self, client, mocker):
        mocker.patch(
            "routes.level0.llama_service.answer_automation_question",
            side_effect=HTTPException(status_code=503, detail="Ollama not running"),
        )
        response = client.post("/api/level0/ask", json={"question": "What is Selenium?"})
        assert response.status_code == 503

    def test_unexpected_exception_returns_500(self, client, mocker):
        mocker.patch(
            "routes.level0.llama_service.answer_automation_question",
            side_effect=RuntimeError("unexpected"),
        )
        response = client.post("/api/level0/ask", json={"question": "Anything?"})
        assert response.status_code == 500
