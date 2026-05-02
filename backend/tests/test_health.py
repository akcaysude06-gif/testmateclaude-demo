"""
Tests for the root and health-check endpoints.

These tests require no mocks and no database rows — they only verify
that the app boots, routers are registered, and the response shapes
are correct.
"""


def test_root_returns_app_name(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
    assert "TestMate" in body["message"]
    assert "version" in body


def test_root_version_is_string(client):
    body = client.get("/").json()
    assert isinstance(body["version"], str)
    assert len(body["version"]) > 0


def test_health_check_returns_status(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert "status" in body
    assert body["status"] in ("healthy", "partial", "unavailable")


def test_health_check_includes_services(client):
    body = client.get("/api/health").json()
    assert "services" in body
    assert "llama3" in body["services"]
    assert body["services"]["llama3"] in ("available", "unavailable")


def test_health_check_includes_endpoints(client):
    body = client.get("/api/health").json()
    assert "endpoints" in body
    endpoints = body["endpoints"]
    assert "level0" in endpoints
    assert "level1" in endpoints
    assert "auth" in endpoints
