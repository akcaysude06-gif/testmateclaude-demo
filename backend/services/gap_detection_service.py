import re
from typing import List, Dict, Any

GAP_NOT_STARTED = "not_started"
GAP_UNTESTED    = "untested"
GAP_COMPLETE    = "complete"

TEST_FILE_PATTERNS = [
    r"test_", r"_test\.", r"\.test\.", r"\.spec\.",
    r"/tests/", r"/test/", r"/spec/",
]

STOP_WORDS = {
    "the", "and", "for", "with", "that", "this", "are", "not",
    "can", "all", "from", "has", "have", "user", "should", "will",
    "able", "when", "into", "its", "but", "also", "more", "than",
    "then", "they", "their", "there", "been", "being", "was", "were",
    "add", "new", "get", "set", "use", "fix", "bug", "task", "issue",
    "item", "page", "view", "update", "implement", "create", "make",
    "allow", "ensure", "support", "provide", "work", "need", "must",
    "test", "tests", "spec", "data", "list", "show", "display", "handle",
    "error", "type", "value", "field", "form", "button", "click",
}

DONE_STATUSES = {
    "done", "closed", "resolved", "fixed", "verified", "complete",
    "completed", "released", "won't fix", "duplicate",
}

# Common word → file-name abbreviations used by developers
ABBREVIATIONS: Dict[str, List[str]] = {
    "authentication": ["auth"],
    "authorization":  ["auth", "authz"],
    "repository":     ["repo"],
    "configuration":  ["config", "conf", "cfg"],
    "management":     ["mgmt", "manager"],
    "production":     ["prod"],
    "development":    ["dev"],
    "environment":    ["env"],
    "application":    ["app"],
    "service":        ["svc"],
    "database":       ["db"],
    "utilities":      ["utils", "util"],
    "utility":        ["utils", "util"],
    "component":      ["comp"],
    "interface":      ["iface"],
    "middleware":     ["middleware", "mid"],
    "notification":   ["notif", "notify"],
    "dashboard":      ["dash"],
    "password":       ["pwd", "pass"],
    "permission":     ["perm"],
    "navigation":     ["nav"],
    "integration":    ["integ"],
    "implementation": ["impl"],
}

MIN_KEYWORD_LEN = 3  # was 4 — now catches api, jwt, gap, css, etc.


class GapDetectionService:

    def _is_test_file(self, path: str) -> bool:
        for pattern in TEST_FILE_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                return True
        return False

    def _path_segments(self, path_lower: str) -> set:
        """Split a file path into individual tokens by / . _ - for exact matching."""
        return set(re.split(r"[/\\_.\-]", path_lower))

    def _extract_keywords(self, summary: str, acceptance_criteria: str) -> List[str]:
        combined = f"{summary} {acceptance_criteria}"
        tokens   = re.findall(r"[a-zA-Z][a-zA-Z0-9_]*", combined)
        seen: set     = set()
        keywords: List[str] = []

        for tok in tokens:
            lower = tok.lower()
            if len(lower) >= MIN_KEYWORD_LEN and lower not in STOP_WORDS and lower not in seen:
                seen.add(lower)
                keywords.append(lower)
                # Also add known abbreviations so "authentication" finds auth.py
                for abbrev in ABBREVIATIONS.get(lower, []):
                    if abbrev not in seen:
                        seen.add(abbrev)
                        keywords.append(abbrev)

        return keywords

    def _score_file(self, path_lower: str, segments: set, keywords: List[str]) -> Dict[str, int]:
        """
        Return hit counts split by match quality:
          exact  — keyword equals a path segment (strongest signal)
          substr — keyword appears anywhere in the path
        """
        exact  = 0
        substr = 0
        for kw in keywords:
            if kw in segments:
                exact += 1
            elif kw in path_lower:
                substr += 1
        return {"exact": exact, "substr": substr}

    def _qualifies(self, scores: Dict[str, int], keywords: List[str]) -> bool:
        """
        A file qualifies as related if:
          - 1+ exact segment match (strongest: 'auth' == path segment 'auth'), OR
          - 1+ specific (≥6 char) substring match, OR
          - 2+ any substring matches
        """
        if scores["exact"] >= 1:
            return True
        specific_kws = [kw for kw in keywords if len(kw) >= 6]
        specific_hits = sum(1 for kw in specific_kws if kw in self._keywords_checked)
        if specific_hits >= 1:
            return True
        if scores["substr"] >= 2:
            return True
        return False

    def _find_related_files(
        self, keywords: List[str], all_files: List[str]
    ) -> Dict[str, List[str]]:
        specific_kws = [kw for kw in keywords if len(kw) >= 6]
        source_matches: List[str] = []
        test_matches:   List[str] = []

        for fpath in all_files:
            path_lower = fpath.lower()
            segments   = self._path_segments(path_lower)

            exact_hits    = sum(1 for kw in keywords if kw in segments)
            specific_hits = sum(1 for kw in specific_kws if kw in path_lower)
            substr_hits   = sum(1 for kw in keywords if kw in path_lower)

            qualifies = (
                exact_hits    >= 1 or
                specific_hits >= 1 or
                substr_hits   >= 2
            )

            if qualifies:
                if self._is_test_file(fpath):
                    test_matches.append(fpath)
                else:
                    source_matches.append(fpath)

        return {"source": source_matches, "tests": test_matches}

    def _is_done_in_jira(self, status: str) -> bool:
        return status.lower().strip() in DONE_STATUSES or any(
            w in status.lower() for w in DONE_STATUSES
        )

    def analyze_gaps(
        self,
        jira_tasks: List[Dict[str, Any]],
        repo_files: List[str],
        repo_name: str,
    ) -> Dict[str, Any]:
        gaps: List[Dict[str, Any]] = []
        self._keywords_checked: set = set()  # used by _qualifies if needed

        for task in jira_tasks:
            status   = task.get("status", "")
            keywords = self._extract_keywords(
                task.get("summary", ""),
                task.get("acceptance_criteria", ""),
            )
            related = self._find_related_files(keywords, repo_files)
            source  = related["source"]
            tests   = related["tests"]
            done_in_jira = self._is_done_in_jira(status)

            if source and tests:
                gap_type = GAP_COMPLETE
            elif source and not tests:
                gap_type = GAP_UNTESTED
            else:
                gap_type = GAP_UNTESTED if done_in_jira else GAP_NOT_STARTED

            gaps.append({
                "task_key":            task["task_key"],
                "summary":             task.get("summary", ""),
                "status":              status,
                "acceptance_criteria": task.get("acceptance_criteria", ""),
                "gap_type":            gap_type,
                "keywords":            keywords[:15],
                "source_files":        source,
                "test_files":          tests,
            })

        total = len(gaps)

        def count(t: str) -> int:
            return sum(1 for g in gaps if g["gap_type"] == t)

        def pct(n: int) -> float:
            return round(n / total * 100, 1) if total else 0.0

        ns  = count(GAP_NOT_STARTED)
        ut  = count(GAP_UNTESTED)
        cmp = count(GAP_COMPLETE)

        return {
            "repo_name": repo_name,
            "gaps": gaps,
            "stats": {
                "total":           total,
                "not_started":     ns,  "not_started_pct":  pct(ns),
                "untested":        ut,  "untested_pct":     pct(ut),
                "complete":        cmp, "complete_pct":     pct(cmp),
            },
        }


gap_detection_service = GapDetectionService()
