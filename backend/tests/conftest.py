"""
Shared pytest fixtures for all backend tests.

Design decisions:
- Uses an in-memory SQLite database so tests never touch testmate.db.
- Overrides the `get_db` dependency on the FastAPI app so every route
  that calls Depends(get_db) gets the test session automatically.
- llama_service is NOT mocked here; individual test modules mock the
  specific methods they need so tests remain independent.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db, User
from main import app
from services.auth_service import auth_service

# ── In-memory test database ───────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite://"  # pure in-memory, discarded after each session

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once for the entire test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """Provide a transactional database session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """
    FastAPI TestClient with the real app but with get_db overridden
    to use the rollback-safe test session.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # rollback handled by db_session fixture

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Seed helpers ──────────────────────────────────────────────────────────────

@pytest.fixture()
def test_user(db_session):
    """
    Insert a minimal User row and return (user, jwt_token).
    The JWT is signed with the real auth_service so token-verify routes work.
    """
    user = User(
        github_id="999999",
        username="testuser",
        email="testuser@example.com",
        avatar_url=None,
        github_access_token="fake-github-token",
        level0_completed=False,
        level1_completed=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    token = auth_service.create_jwt_token(user.id)
    return user, token
