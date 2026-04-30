"""
Jira OAuth 2.0 (3LO) routes — connect, callback, projects, issues.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from config.settings import settings
from database import get_db, User
from services.auth_service import auth_service
from services.jira_service import jira_oauth_service

router = APIRouter(prefix="/api/jira", tags=["Jira"])


def _require_jira(user: User) -> None:
    if not user.jira_access_token or not user.jira_cloud_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jira account not connected. Visit /api/jira/connect first.",
        )


async def _with_token_refresh(user: User, db: Session, coro):
    """
    Await *coro*. If a 401 is raised and a refresh token exists, refresh and retry once.
    The caller must pass an awaitable (coroutine), not a coroutine function.
    """
    try:
        return await coro
    except HTTPException as exc:
        if exc.status_code != status.HTTP_401_UNAUTHORIZED or not user.jira_refresh_token:
            raise
        token_data = await jira_oauth_service.refresh_access_token(user.jira_refresh_token)
        user.jira_access_token = token_data["access_token"]
        if token_data.get("refresh_token"):
            user.jira_refresh_token = token_data["refresh_token"]
        db.commit()
        raise  # caller must retry with new token after commit


# ── GET /api/jira/connect ─────────────────────────────────────────────────────

@router.get("/connect")
async def jira_connect(token: str = Query(...), db: Session = Depends(get_db)):
    """
    Redirect the authenticated user to Atlassian's OAuth consent page.
    The JWT token is threaded through via the `state` parameter so the
    callback can identify the user without a separate session store.
    """
    auth_service.get_current_user(db, token)  # validates token before redirecting
    url = jira_oauth_service.get_oauth_url(state=token)
    return RedirectResponse(url=url)


# ── GET /api/jira/callback ────────────────────────────────────────────────────

@router.get("/callback")
async def jira_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Atlassian redirects here after user consent.
    `state` carries the user's JWT so we can match the Jira tokens to the right account.
    """
    try:
        user = auth_service.get_current_user(db, state)
    except HTTPException:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/#production?jira_error=auth_failed"
        )

    try:
        token_data = await jira_oauth_service.exchange_code_for_token(code)
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        cloud_id = await jira_oauth_service.get_cloud_id(access_token)

        user.jira_access_token = access_token
        user.jira_refresh_token = refresh_token
        user.jira_cloud_id = cloud_id
        db.commit()
    except HTTPException:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/#production?jira_error=token_exchange_failed"
        )

    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/#production?jira_connected=true"
    )


# ── GET /api/jira/projects ────────────────────────────────────────────────────

@router.get("/projects")
async def get_jira_projects(token: str = Query(...), db: Session = Depends(get_db)):
    """Return all Jira projects accessible to the connected account."""
    user = auth_service.get_current_user(db, token)
    _require_jira(user)

    try:
        projects = await jira_oauth_service.get_projects(user.jira_access_token, user.jira_cloud_id)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED and user.jira_refresh_token:
            token_data = await jira_oauth_service.refresh_access_token(user.jira_refresh_token)
            user.jira_access_token = token_data["access_token"]
            if token_data.get("refresh_token"):
                user.jira_refresh_token = token_data["refresh_token"]
            db.commit()
            projects = await jira_oauth_service.get_projects(user.jira_access_token, user.jira_cloud_id)
        else:
            raise

    return {"projects": projects}


# ── GET /api/jira/project/{project_key}/issues ────────────────────────────────

@router.get("/project/{project_key}/issues")
async def get_project_issues(
    project_key: str,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Return all issues for *project_key* grouped by status:
    { todo, in_progress, in_review, done }
    """
    user = auth_service.get_current_user(db, token)
    _require_jira(user)

    try:
        grouped = await jira_oauth_service.get_project_issues_grouped(
            user.jira_access_token, user.jira_cloud_id, project_key
        )
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED and user.jira_refresh_token:
            token_data = await jira_oauth_service.refresh_access_token(user.jira_refresh_token)
            user.jira_access_token = token_data["access_token"]
            if token_data.get("refresh_token"):
                user.jira_refresh_token = token_data["refresh_token"]
            db.commit()
            grouped = await jira_oauth_service.get_project_issues_grouped(
                user.jira_access_token, user.jira_cloud_id, project_key
            )
        else:
            raise

    return grouped
