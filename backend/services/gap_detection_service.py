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
}


class GapDetectionService:

    def _is_test_file(self, path: str) -> bool:
        for pattern in TEST_FILE_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                return True
        return False

    def _extract_keywords(self, summary: str, acceptance_criteria: str) -> List[str]:
        combined = f"{summary} {acceptance_criteria}"
        tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9_]*", combined)
        seen: set = set()
        keywords: List[str] = []
        for tok in tokens:
            lower = tok.lower()
            if len(lower) >= 3 and lower not in STOP_WORDS and lower not in seen:
                seen.add(lower)
                keywords.append(lower)
        return keywords

    def _find_related_files(
        self, keywords: List[str], all_files: List[str]
    ) -> Dict[str, List[str]]:
        source_matches: List[str] = []
        test_matches: List[str] = []
        for fpath in all_files:
            path_lower = fpath.lower()
            if any(kw in path_lower for kw in keywords):
                if self._is_test_file(fpath):
                    test_matches.append(fpath)
                else:
                    source_matches.append(fpath)
        return {"source": source_matches, "tests": test_matches}

    def analyze_gaps(
        self,
        jira_tasks: List[Dict[str, Any]],
        repo_files: List[str],
        repo_name: str,
    ) -> Dict[str, Any]:
        gaps: List[Dict[str, Any]] = []

        for task in jira_tasks:
            keywords = self._extract_keywords(
                task.get("summary", ""),
                task.get("acceptance_criteria", ""),
            )
            related = self._find_related_files(keywords, repo_files)
            source = related["source"]
            tests  = related["tests"]

            if not source and not tests:
                gap_type = GAP_NOT_STARTED
            elif source and not tests:
                gap_type = GAP_UNTESTED
            else:
                gap_type = GAP_COMPLETE

            gaps.append({
                "task_key":            task["task_key"],
                "summary":             task.get("summary", ""),
                "status":              task.get("status", ""),
                "acceptance_criteria": task.get("acceptance_criteria", ""),
                "gap_type":            gap_type,
                "keywords":            keywords[:10],
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
