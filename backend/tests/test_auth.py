"""
Tests for authentication routes:
  GET  /api/auth/github/login
  POST /api/auth/verify
  GET  /api/auth/me
  POST /api/auth/logout

GitHub OAuth callback is NOT tested here — it requires live network calls
to GitHub, which belong in integration/e2e tests. Everything else is testable
with in-process JWT operations and the seeded test_user fixture.
"""
import pytest
from services.auth_service import auth_service


# ── GET /api/auth/github/login ────────────────────────────────────────────────

class TestGithubLogin:

    def test_returns_auth_url(self, client):
        response = client.get("/api/auth/github/login")
        assert response.status_code == 200
        body = response.json()
        assert "auth_url" in body

    def test_auth_url_points_to_github(self, client):
        body = client.get("/api/auth/github/login").json()
        assert "github.com" in body["auth_url"]

    def test_auth_url_contains_client_id_param(self, client):
        body = client.get("/api/auth/github/login").json()
        assert "client_id=" in body["auth_url"]


# ── POST /api/auth/verify ─────────────────────────────────────────────────────

class TestVerifyToken:

    def test_valid_token_returns_user(self, client, test_user):
        user, token = test_user
        response = client.post("/api/auth/verify", params={"token": token})
        assert response.status_code == 200
        body = response.json()
        assert body["username"] == "testuser"
        assert body["id"] == user.id

    def test_valid_token_returns_correct_fields(self, client, test_user):
        _, token = test_user
        body = client.post("/api/auth/verify", params={"token": token}).json()
        for field in ("id", "username", "email", "avatar_url",
                      "level0_completed", "level1_completed"):
            assert field in body, f"Missing field: {field}"

    def test_garbage_token_returns_401(self, client):
        response = client.post("/api/auth/verify", params={"token": "not.a.jwt"})
        assert response.status_code == 401

    def test_empty_token_returns_401(self, client):
        response = client.post("/api/auth/verify", params={"token": ""})
        assert response.status_code == 401

    def test_token_for_nonexistent_user_returns_401(self, client):
        """JWT is valid but references a user_id that does not exist in the DB."""
        orphan_token = auth_service.create_jwt_token(user_id=99999)
        response = client.post("/api/auth/verify", params={"token": orphan_token})
        assert response.status_code == 401

    def test_level_completion_defaults_to_false(self, client, test_user):
        _, token = test_user
        body = client.post("/api/auth/verify", params={"token": token}).json()
        assert body["level0_completed"] is False
        assert body["level1_completed"] is False


# ── GET /api/auth/me ──────────────────────────────────────────────────────────

class TestGetMe:

    def test_valid_token_returns_user_info(self, client, test_user):
        user, token = test_user
        response = client.get("/api/auth/me", params={"token": token})
        assert response.status_code == 200
        assert response.json()["username"] == "testuser"

    def test_invalid_token_returns_401(self, client):
        response = client.get("/api/auth/me", params={"token": "bad-token"})
        assert response.status_code == 401

    def test_missing_token_param_returns_422(self, client):
        """token is a required query param; omitting it must return 422."""
        response = client.get("/api/auth/me")
        assert response.status_code == 422


# ── POST /api/auth/logout ─────────────────────────────────────────────────────

class TestLogout:

    def test_logout_returns_success_message(self, client):
        response = client.post("/api/auth/logout")
        assert response.status_code == 200
        body = response.json()
        assert "message" in body
        assert "logout" in body["message"].lower() or "logged" in body["message"].lower()

    def test_logout_does_not_require_auth(self, client):
        """Logout is stateless on the server — no token needed."""
        response = client.post("/api/auth/logout")
        assert response.status_code == 200
