import base64
import requests
import httpx
from urllib.parse import urlparse, urlencode
from typing import List, Dict, Optional, Any
from fastapi import HTTPException, status
from config.settings import settings


class JiraService:

    def _normalize_url(self, instance_url: str) -> str:
        """Strip any path from the URL — keep only scheme + host."""
        parsed = urlparse(instance_url.strip())
        if not parsed.scheme:
            parsed = urlparse(f"https://{instance_url.strip()}")
        return f"{parsed.scheme}://{parsed.netloc}"

    def _make_headers(self, email: str, api_token: str) -> dict:
        credentials = base64.b64encode(f"{email}:{api_token}".encode()).decode()
        return {
            "Authorization": f"Basic {credentials}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _jira_error_message(self, resp: requests.Response) -> str:
        """Extract a human-readable message from a Jira error response."""
        try:
            body = resp.json()
            msgs = body.get("errorMessages") or []
            errs = body.get("errors") or {}
            if msgs:
                return "; ".join(msgs)
            if errs:
                return "; ".join(f"{k}: {v}" for k, v in errs.items())
        except Exception:
            pass
        return f"HTTP {resp.status_code} from Jira"

    def verify_connection(self, instance_url: str, email: str, api_token: str) -> dict:
        base = self._normalize_url(instance_url)
        url  = f"{base}/rest/api/3/myself"
        try:
            resp = requests.get(
                url,
                headers=self._make_headers(email, api_token),
                timeout=10,
                allow_redirects=True,
            )
        except requests.exceptions.ConnectionError:
            raise HTTPException(status_code=400, detail=f"Cannot reach Jira instance at {base}. Check the URL.")
        except requests.exceptions.Timeout:
            raise HTTPException(status_code=408, detail="Jira request timed out. Check the instance URL.")

        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Jira authentication failed. Check your email and API token.")
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied. Your Jira account may lack API access.")
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Jira returned {resp.status_code}. Verify your instance URL is correct (e.g. https://yourcompany.atlassian.net).")

        data = resp.json()
        # /myself always has accountId — if it's missing we followed a redirect to the wrong endpoint
        if "accountId" not in data:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Jira returned an unexpected response from /myself. "
                    "Make sure your Instance URL is just the base URL, e.g. https://yourcompany.atlassian.net"
                ),
            )
        return data

    def get_projects(self, instance_url: str, email: str, api_token: str) -> List[Dict]:
        base = self._normalize_url(instance_url)
        url  = f"{base}/rest/api/3/project/search"
        resp = requests.get(
            url,
            headers=self._make_headers(email, api_token),
            params={"maxResults": 50},
            timeout=10,
        )
        if not resp.ok:
            raise HTTPException(status_code=400, detail=self._jira_error_message(resp))
        return resp.json().get("values", [])

    def get_project_issues(
        self,
        instance_url: str,
        email: str,
        api_token: str,
        project_key: str,
        statuses: Optional[List[str]] = None,
    ) -> List[Dict]:
        # No status filter by default — custom status names cause JQL 400 errors
        if statuses:
            status_jql = ", ".join(f'"{s}"' for s in statuses)
            jql = f'project = "{project_key}" AND status in ({status_jql}) ORDER BY updated DESC'
        else:
            jql = f'project = "{project_key}" ORDER BY updated DESC'

        base     = self._normalize_url(instance_url)
        issues: List[Dict] = []
        start_at = 0
        page_size = 50

        while True:
            url = f"{base}/rest/api/3/search/jql"
            resp = requests.get(
                url,
                headers=self._make_headers(email, api_token),
                params={
                    "jql": jql,
                    "startAt": start_at,
                    "maxResults": page_size,
                    "fields": "summary,status,description,issuetype,priority",
                },
                timeout=15,
            )
            if not resp.ok:
                raise HTTPException(status_code=400, detail=self._jira_error_message(resp))
            body = resp.json()
            issues.extend(body.get("issues", []))
            if start_at + page_size >= body.get("total", 0):
                break
            start_at += page_size

        return issues

    def get_issue_details(
        self, instance_url: str, email: str, api_token: str, issue_key: str
    ) -> Dict:
        base = self._normalize_url(instance_url)
        url  = f"{base}/rest/api/3/issue/{issue_key}"
        resp = requests.get(url, headers=self._make_headers(email, api_token), timeout=10)
        if not resp.ok:
            raise HTTPException(status_code=400, detail=self._jira_error_message(resp))
        return resp.json()

    def _extract_acceptance_criteria(self, description: Any) -> str:
        """Parse ADF JSON to extract text under an 'Acceptance Criteria' heading."""
        if not description or not isinstance(description, dict):
            return ""

        content_nodes = description.get("content", [])
        ac_parts: List[str] = []
        inside_ac = False

        def extract_text(node: dict) -> str:
            if node.get("type") == "text":
                return node.get("text", "")
            result = ""
            for child in node.get("content", []):
                result += extract_text(child)
            return result

        for node in content_nodes:
            node_type = node.get("type", "")
            if node_type == "heading":
                heading_text = extract_text(node).lower()
                if "acceptance criteria" in heading_text:
                    inside_ac = True
                elif inside_ac:
                    break
                continue
            if inside_ac:
                text = extract_text(node).strip()
                if text:
                    ac_parts.append(text)

        # Fallback: extract all text if no AC heading found
        if not ac_parts:
            for node in content_nodes:
                text = extract_text(node).strip()
                if text:
                    ac_parts.append(text)

        return "\n".join(ac_parts)


jira_service = JiraService()


class JiraOAuthService:
    """Atlassian OAuth 2.0 (3LO) — same pattern as auth_service / github_service."""

    _AUTH_URL = "https://auth.atlassian.com/authorize"
    _TOKEN_URL = "https://auth.atlassian.com/oauth/token"
    _RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources"
    _API_BASE = "https://api.atlassian.com/ex/jira"
    _SCOPES = "read:issue-details:jira read:project:jira offline_access"

    # ── OAuth flow ────────────────────────────────────────────────────────────

    def get_oauth_url(self, state: str) -> str:
        params = {
            "audience": "api.atlassian.com",
            "client_id": settings.JIRA_CLIENT_ID,
            "scope": self._SCOPES,
            "redirect_uri": settings.JIRA_REDIRECT_URI,
            "state": state,
            "response_type": "code",
            "prompt": "consent",
        }
        return f"{self._AUTH_URL}?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self._TOKEN_URL,
                json={
                    "grant_type": "authorization_code",
                    "client_id": settings.JIRA_CLIENT_ID,
                    "client_secret": settings.JIRA_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.JIRA_REDIRECT_URI,
                },
                headers={"Content-Type": "application/json"},
                timeout=15,
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to exchange code for Jira token: {resp.text}",
                )
            return resp.json()

    async def refresh_access_token(self, refresh_token: str) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self._TOKEN_URL,
                json={
                    "grant_type": "refresh_token",
                    "client_id": settings.JIRA_CLIENT_ID,
                    "client_secret": settings.JIRA_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                },
                headers={"Content-Type": "application/json"},
                timeout=15,
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Jira token refresh failed. Please reconnect your Jira account.",
                )
            return resp.json()

    async def get_accessible_sites(self, access_token: str) -> list:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                self._RESOURCES_URL,
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                timeout=10,
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to fetch accessible Jira sites.",
                )
            return [
                {
                    "cloud_id":   r["id"],
                    "name":       r.get("name", ""),
                    "url":        r.get("url", ""),
                    "avatar_url": r.get("avatarUrl"),
                }
                for r in resp.json()
            ]

    async def get_cloud_id(self, access_token: str) -> str:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                self._RESOURCES_URL,
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                timeout=10,
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to fetch Atlassian cloud resources.",
                )
            resources = resp.json()
            if not resources:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No accessible Atlassian cloud instances found for this account.",
                )
            return resources[0]["id"]

    # ── Internal API helper ───────────────────────────────────────────────────

    async def _api_get(
        self, access_token: str, cloud_id: str, path: str, params: dict = None
    ) -> dict:
        url = f"{self._API_BASE}/{cloud_id}/rest/api/3{path}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                params=params or {},
                timeout=15,
            )
            if resp.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Jira token expired. Please reconnect your Jira account.",
                )
            if not resp.is_success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Jira API error: {resp.text}",
                )
            return resp.json()

    # ── Projects ──────────────────────────────────────────────────────────────

    async def get_myself(self, access_token: str, cloud_id: str) -> Dict:
        return await self._api_get(access_token, cloud_id, "/myself")

    async def get_project_issues_flat(
        self, access_token: str, cloud_id: str, project_key: str
    ) -> List[Dict]:
        jql = f'project = "{project_key}" ORDER BY updated DESC'
        issues: List[Dict] = []
        start_at = 0
        page_size = 50
        while True:
            data = await self._api_get(
                access_token, cloud_id, "/search",
                {"jql": jql, "startAt": start_at, "maxResults": page_size,
                 "fields": "summary,status,description,issuetype,priority"},
            )
            issues.extend(data.get("issues", []))
            if start_at + page_size >= data.get("total", 0):
                break
            start_at += page_size
        return issues

    async def get_projects(self, access_token: str, cloud_id: str) -> List[Dict]:
        data = await self._api_get(access_token, cloud_id, "/project/search", {"maxResults": 50})
        return [
            {
                "id": p["id"],
                "key": p["key"],
                "name": p["name"],
                "style": p.get("style"),
                "avatar_url": p.get("avatarUrls", {}).get("48x48"),
            }
            for p in data.get("values", [])
        ]

    # ── Issues grouped by status ──────────────────────────────────────────────

    def _status_bucket(self, status_name: str, category_key: str) -> str:
        if category_key == "done":
            return "done"
        if category_key == "new":
            return "todo"
        # indeterminate — split on "review" heuristic
        if "review" in status_name.lower():
            return "in_review"
        return "in_progress"

    async def get_project_issues_grouped(
        self, access_token: str, cloud_id: str, project_key: str
    ) -> Dict[str, List[Dict]]:
        jql = f'project = "{project_key}" ORDER BY updated DESC'
        groups: Dict[str, List] = {"todo": [], "in_progress": [], "in_review": [], "done": []}
        start_at = 0
        page_size = 50

        while True:
            data = await self._api_get(
                access_token,
                cloud_id,
                "/search",
                {
                    "jql": jql,
                    "startAt": start_at,
                    "maxResults": page_size,
                    "fields": "summary,status,description,issuetype,priority,assignee",
                },
            )
            for issue in data.get("issues", []):
                fields = issue.get("fields", {})
                status_obj = fields.get("status", {})
                status_name = status_obj.get("name", "")
                category_key = status_obj.get("statusCategory", {}).get("key", "new")
                bucket = self._status_bucket(status_name, category_key)
                groups[bucket].append({
                    "key": issue["key"],
                    "summary": fields.get("summary", ""),
                    "status": status_name,
                    "issue_type": fields.get("issuetype", {}).get("name", ""),
                    "priority": (fields.get("priority") or {}).get("name"),
                    "assignee": (fields.get("assignee") or {}).get("displayName"),
                })

            total = data.get("total", 0)
            if start_at + page_size >= total:
                break
            start_at += page_size

        return groups


jira_oauth_service = JiraOAuthService()
