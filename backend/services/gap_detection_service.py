import re
from typing import List, Dict, Any, Set

GAP_NOT_STARTED   = "not_started"
GAP_UNTESTED      = "untested"
GAP_COMPLETE      = "complete"
GAP_NON_CODE_TASK = "non_code_task"

TEST_FILE_PATTERNS = [
    r"test_", r"_test\.", r"\.test\.", r"\.spec\.",
    r"/tests/", r"/test/", r"/spec/",
]

STOP_WORDS = {
    "the", "and", "for", "with", "that", "this", "are", "not",
    "can", "all", "from", "has", "have", "should", "will",
    "able", "when", "into", "its", "but", "also", "more", "than",
    "then", "they", "their", "there", "been", "being", "was", "were",
    "add", "new", "get", "set", "use", "fix", "bug", "task", "issue",
    "item", "page", "view", "update", "implement", "create", "make",
    "allow", "ensure", "support", "provide", "work", "need", "must",
    "test", "tests", "spec", "list", "show", "display",
    "button", "click",
    # "user", "error", "handle", "data", "type", "form" intentionally
    # NOT stopped — they appear in real file names (user_service.py etc.)
}

# Task word → file-name abbreviations (forward direction)
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
    "controller":     ["ctrl", "ctl"],
    "administrator":  ["admin"],
    "validator":      ["valid", "validator"],
    "serializer":     ["serial"],
    "initializer":    ["init"],
    "generator":      ["gen"],
    "processor":      ["proc"],
}

# File path segment → full words (backward direction)
# e.g. file segment "auth" → also try "authentication", "login", "signin"
INVERSE_ABBREVIATIONS: Dict[str, List[str]] = {
    "auth":    ["authentication", "authorization", "login", "signin"],
    "authz":   ["authorization"],
    "repo":    ["repository"],
    "config":  ["configuration"],
    "conf":    ["configuration"],
    "cfg":     ["configuration"],
    "mgmt":    ["management"],
    "prod":    ["production"],
    "dev":     ["development"],
    "env":     ["environment"],
    "app":     ["application"],
    "svc":     ["service"],
    "db":      ["database"],
    "utils":   ["utilities", "utility"],
    "util":    ["utilities", "utility"],
    "comp":    ["component"],
    "mid":     ["middleware"],
    "notif":   ["notification"],
    "notify":  ["notification"],
    "dash":    ["dashboard"],
    "pwd":     ["password"],
    "perm":    ["permission"],
    "nav":     ["navigation"],
    "integ":   ["integration"],
    "impl":    ["implementation"],
    "ctrl":    ["controller"],
    "ctl":     ["controller"],
    "admin":   ["administrator"],
    "gen":     ["generator"],
    "proc":    ["processor"],
    "init":    ["initializer", "initialization"],
    "valid":   ["validation", "validator"],
    "mgr":     ["manager"],
}

# Synonym clusters: if a task keyword belongs to any group,
# all other group members are also added to the search keywords.
CODE_SYNONYMS: List[Set[str]] = [
    {"login",       "signin",   "auth",      "oauth",   "sso",     "session"},
    {"signup",      "register", "registration", "onboarding"},
    {"upload",      "attachment", "ingest",  "import"},
    {"download",    "export"},
    {"payment",     "checkout", "billing",   "invoice", "subscription"},
    {"notification","notify",   "alert",     "email",   "sms",     "push"},
    {"search",      "filter",   "query",     "find"},
    {"profile",     "account",  "settings",  "preferences"},
    {"permission",  "role",     "access",    "acl",     "authz"},
    {"webhook",     "callback", "event",     "listener"},
    {"cache",       "redis",    "session",   "store"},
    {"file",        "storage",  "s3",        "blob",    "media"},
    {"job",         "queue",    "worker",    "background", "celery"},
    {"schema",      "migration","model",     "entity"},
    {"dashboard",   "analytics","metrics",   "chart"},
    {"password",    "credential","secret",   "token",   "jwt"},
    {"report",      "reporting","analytics"},   # "report" in a CODE context
]

# ── Non-code task detection ───────────────────────────────────────────────────
#
# Two-tier strategy (technical words always veto):
#   Tier 1 – STRONG_NON_CODE_NOUNS : one of these alone is enough
#             (Agile ceremonies, pure UI-design artefacts — never produce code)
#   Tier 2 – PROCESS_VERBS + NON_CODE_NOUNS : verb AND noun must both appear
#             (e.g. "write report", "prepare presentation")
#
# Deliberately NO "2+ non_code_nouns" tier — that caused false positives like
# "Add gap report button" or "Level 1 report view" being wrongly classified.

STRONG_NON_CODE_NOUNS: Set[str] = {
    "meeting",       # any meeting
    "standup",       # daily standup
    "retrospective", "retro",
    "grooming",      # backlog grooming
    "refinement",    # sprint refinement
    "wireframe",     # UI wireframe design
    "mockup",        # UI mockup
    "sprint",        # sprint ceremony (planning, review, retro)
    "planning",      # sprint planning / release planning
}

# Only trigger when combined with a PROCESS_VERB — reduces false positives.
NON_CODE_NOUNS: Set[str] = {
    "report",        # "write report" ✓ | "gap report button" ✗ (no process verb)
    "documentation", "docs", "doc", "document",
    "presentation",  "slides", "slide",
    "proposal",      "roadmap",
    "survey",        "checklist", "spreadsheet",
    "diagram",       "flowchart",
    "minutes",       "agenda",
    "interview",     "sketch", "estimation",
}

# Verbs that clearly signal document/coordination work, NOT coding
PROCESS_VERBS: Set[str] = {
    "write", "draft", "prepare", "document", "record",
    "present", "gather", "collect", "organise", "organize",
    "coordinate", "schedule", "conduct", "facilitate",
    "arrange", "attend", "host", "review", "update",
}
# NOTE: "implement", "build", "develop", "deploy" are coding verbs — absent here.

# If ANY of these appear in the task summary, non-code classification is vetoed.
TECHNICAL_NOUNS: Set[str] = {
    # Code artefacts
    "api", "endpoint", "database", "service", "component", "class",
    "function", "method", "module", "interface", "route", "handler",
    "model", "controller", "repository", "schema", "migration",
    "webhook", "socket", "query", "mutation", "middleware", "hook",
    "reducer", "store", "action", "decorator", "serializer", "validator",
    "pipeline", "workflow", "trigger", "connector", "adapter",
    "client", "server", "backend", "frontend", "library", "package",
    "algorithm", "logic", "feature", "refactor", "patch", "cache", "index",
    # Coding verbs (appear in task titles like "Implement X", "Build Y")
    "implement", "build", "develop", "code", "program",
    "deploy", "configure", "refactor", "debug", "integrate",
    "migrate", "initialize", "optimise", "optimize",
    # Tech domain words that confirm a code task
    "authentication", "authorization", "login", "logout", "signup",
    "encryption", "hashing", "validation", "sanitization",
    "pagination", "rendering", "deployment", "testing", "debugging",
    "container", "docker", "kubernetes", "ci", "cd",
}

MIN_KEYWORD_LEN = 3


class GapDetectionService:

    def _is_test_file(self, path: str) -> bool:
        for pattern in TEST_FILE_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                return True
        return False

    def _path_segments(self, fpath: str) -> Set[str]:
        """
        Split a file path into tokens used for exact keyword matching.

        Steps:
          1. Split on path / extension separators (/ \\ _ . -)
          2. For each raw segment, split on digit↔letter boundaries
             so "level1" → {"level1", "level", "1"}
          3. CamelCase split using original-case segment
             so "AIChatStep" → {"aichatstep", "ai", "chat", "step"}
          4. Expand known abbreviations (backward direction)
        """
        path_lower = fpath.lower()
        raw_lower  = re.split(r"[/\\_.\-]", path_lower)
        raw_orig   = re.split(r"[/\\_.\-]", fpath)
        result: Set[str] = set(raw_lower)

        for seg_lower, seg_orig in zip(raw_lower, raw_orig):
            if not seg_lower:
                continue
            # Digit↔letter boundary split
            sub_parts = re.split(r'(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])', seg_lower)
            if len(sub_parts) > 1:
                result.update(sub_parts)
            # CamelCase split using original-case segment
            camel_split  = re.sub(r'(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])', '_', seg_orig)
            camel_tokens = [p.lower() for p in camel_split.split('_') if p]
            if len(camel_tokens) > 1:
                result.update(camel_tokens)

        # Backward abbreviation expansion
        for seg in list(result):
            for full_word in INVERSE_ABBREVIATIONS.get(seg, []):
                result.add(full_word)

        return result

    def _is_non_code_task(self, summary: str) -> bool:
        """
        Returns True when the task clearly describes process/management work
        with no expected source-code output.

        Tier 1 – one STRONG_NON_CODE_NOUN alone → True
        Tier 2 – a PROCESS_VERB + at least one NON_CODE_NOUN → True
        Any TECHNICAL_NOUN → False (veto)
        """
        tokens = set(re.findall(r"[a-zA-Z]+", summary.lower()))

        # Veto: any technical word means it's a code task
        if tokens & TECHNICAL_NOUNS:
            return False

        # Tier 1: clear ceremony / design-artefact words
        if tokens & STRONG_NON_CODE_NOUNS:
            return True

        # Tier 2: explicit writing/coordination verb + document noun
        if (tokens & PROCESS_VERBS) and (tokens & NON_CODE_NOUNS):
            return True

        return False

    def _extract_keywords(self, summary: str, acceptance_criteria: str) -> List[str]:
        combined = f"{summary} {acceptance_criteria}"
        tokens   = re.findall(r"[a-zA-Z][a-zA-Z0-9_]*", combined)
        seen: Set[str]  = set()
        keywords: List[str] = []

        for tok in tokens:
            lower = tok.lower()
            if len(lower) >= MIN_KEYWORD_LEN and lower not in STOP_WORDS and lower not in seen:
                seen.add(lower)
                keywords.append(lower)
                # Forward abbreviation expansion
                for abbrev in ABBREVIATIONS.get(lower, []):
                    if abbrev not in seen:
                        seen.add(abbrev)
                        keywords.append(abbrev)
                # Synonym cluster expansion
                for group in CODE_SYNONYMS:
                    if lower in group:
                        for synonym in group:
                            if synonym not in seen:
                                seen.add(synonym)
                                keywords.append(synonym)

        return keywords

    def _content_matches_keywords(
        self, content: str, keywords: List[str], specific_kws: List[str]
    ) -> bool:
        """Return True if file content contains enough task keywords (word-boundary aware)."""
        content_lower = content.lower()
        exact_hits = sum(
            1 for kw in keywords
            if re.search(r'\b' + re.escape(kw) + r'\b', content_lower)
        )
        specific_hits = sum(
            1 for kw in specific_kws
            if re.search(r'\b' + re.escape(kw) + r'\b', content_lower)
        )
        return exact_hits >= 2 or specific_hits >= 1

    def _find_related_files(
        self,
        keywords: List[str],
        all_files: List[str],
        file_contents: Dict[str, str] = None,
    ) -> Dict[str, List[str]]:
        specific_kws   = [kw for kw in keywords if len(kw) >= 6]
        source_matches: List[str] = []
        test_matches:   List[str] = []
        file_contents  = file_contents or {}

        for fpath in all_files:
            path_lower = fpath.lower()
            # _path_segments handles camelCase, digit↔letter splitting + inverse abbrevs
            segments   = self._path_segments(fpath)

            exact_hits    = sum(1 for kw in keywords  if kw in segments)
            specific_hits = sum(1 for kw in specific_kws if kw in path_lower)
            substr_hits   = sum(1 for kw in keywords  if kw in path_lower)

            path_qualifies = (
                exact_hits    >= 1 or
                specific_hits >= 1 or
                substr_hits   >= 2
            )

            # Content-based matching for test files — discovers tests with non-standard names
            content_qualifies = False
            if not path_qualifies and self._is_test_file(fpath):
                content = file_contents.get(fpath, "")
                if content:
                    content_qualifies = self._content_matches_keywords(
                        content, keywords, specific_kws
                    )

            if path_qualifies or content_qualifies:
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
        file_contents: Dict[str, str] = None,
    ) -> Dict[str, Any]:
        gaps: List[Dict[str, Any]] = []

        for task in jira_tasks:
            status  = task.get("status", "")
            summary = task.get("summary", "")

            # 1. Non-code detection — before keyword extraction
            if self._is_non_code_task(summary):
                gaps.append({
                    "task_key":            task["task_key"],
                    "summary":             summary,
                    "status":              status,
                    "acceptance_criteria": task.get("acceptance_criteria", ""),
                    "gap_type":            GAP_NON_CODE_TASK,
                    "keywords":            [],
                    "source_files":        [],
                    "test_files":          [],
                })
                continue

            keywords = self._extract_keywords(
                summary,
                task.get("acceptance_criteria", ""),
            )

            # 2. Empty keywords after filtering → nothing technical to search for
            if not keywords:
                gaps.append({
                    "task_key":            task["task_key"],
                    "summary":             summary,
                    "status":              status,
                    "acceptance_criteria": task.get("acceptance_criteria", ""),
                    "gap_type":            GAP_NON_CODE_TASK,
                    "keywords":            [],
                    "source_files":        [],
                    "test_files":          [],
                })
                continue

            # 3. File matching (path-based + optional content-based for test files)
            related = self._find_related_files(keywords, repo_files, file_contents)
            source  = related["source"]
            tests   = related["tests"]

            if source and tests:
                gap_type = GAP_COMPLETE
            elif source and not tests:
                gap_type = GAP_UNTESTED
            else:
                gap_type = GAP_NOT_STARTED

            gaps.append({
                "task_key":            task["task_key"],
                "summary":             summary,
                "status":              status,
                "acceptance_criteria": task.get("acceptance_criteria", ""),
                "gap_type":            gap_type,
                "keywords":            keywords,
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
        nct = count(GAP_NON_CODE_TASK)

        return {
            "repo_name": repo_name,
            "gaps": gaps,
            "stats": {
                "total":           total,
                "not_started":     ns,  "not_started_pct":   pct(ns),
                "untested":        ut,  "untested_pct":      pct(ut),
                "complete":        cmp, "complete_pct":      pct(cmp),
                "non_code_task":   nct, "non_code_task_pct": pct(nct),
            },
        }


gap_detection_service = GapDetectionService()
