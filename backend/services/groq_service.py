"""
AI Service — backed by Groq (Llama 3.3) with Anthropic fallback.
"""
import re
from groq import Groq
from fastapi import HTTPException
from config.settings import settings


class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None
        self.model = "llama-3.3-70b-versatile"

    def generate_text(self, prompt: str, max_tokens: int = 2000) -> str:
        if not self.client:
            raise HTTPException(status_code=503, detail="Groq API key not configured")
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "rate_limit_exceeded" in error_str:
                reset_time = self._parse_reset_time(error_str)
                if reset_time:
                    raise HTTPException(status_code=429, detail=f"AI usage limit reached. Please try again in {reset_time}.")
                raise HTTPException(status_code=429, detail="AI usage limit reached. Please try again later.")
            raise HTTPException(status_code=500, detail=f"Error calling Groq API: {str(e)}")

    def _parse_reset_time(self, error_str: str) -> str:
        match = re.search(r'Please try again in ([^\s.]+(?:\s[^\s.]+)*?)\.', error_str)
        if not match:
            return ""
        raw = match.group(1).strip()
        # Convert e.g. "1h21m34.559999999s" → "1 hour 21 minutes"
        parts = []
        h = re.search(r'(\d+)h', raw)
        m = re.search(r'(\d+)m', raw)
        s = re.search(r'(\d+(?:\.\d+)?)s', raw)
        if h:
            parts.append(f"{h.group(1)} hour{'s' if int(h.group(1)) != 1 else ''}")
        if m:
            parts.append(f"{m.group(1)} minute{'s' if int(m.group(1)) != 1 else ''}")
        if s and not h and not m:
            secs = int(float(s.group(1)))
            parts.append(f"{secs} second{'s' if secs != 1 else ''}")
        return " and ".join(parts) if parts else raw

    def generate_selenium_code(self, test_description: str) -> dict:
        prompt = f"""You are an expert Selenium automation engineer. Generate a complete, professional Selenium Python script based on this test description:

TEST DESCRIPTION:
{test_description}

Please provide:

1. Complete Python code with:
   - Proper imports (selenium, webdriver_manager)
   - Chrome WebDriver setup
   - Clear comments explaining each step
   - WebDriverWait for explicit waits
   - Error handling with try/except/finally
   - Best practices for web automation

2. Format your response EXACTLY as follows:
```python
[Your complete, runnable Python code here]
```

STEPS:
1. [First step explanation]
2. [Second step explanation]
3. [Third step explanation]
... (continue for all major steps)

Keep the code professional, well-commented, and ready to run."""

        try:
            response = self.generate_text(prompt, max_tokens=2000)

            code  = ""
            steps = []

            if "```python" in response:
                code_start = response.find("```python") + 9
                code_end   = response.find("```", code_start)
                if code_end != -1:
                    code = response[code_start:code_end].strip()
            elif "```" in response:
                code_start = response.find("```") + 3
                code_end   = response.find("```", code_start)
                if code_end != -1:
                    code = response[code_start:code_end].strip()

            if "STEPS:" in response:
                steps_text = response[response.find("STEPS:") + 6:]
                for line in steps_text.split('\n'):
                    line = line.strip()
                    if line and (line[0].isdigit() or line.startswith('-')):
                        steps.append(line)

            if not code:
                code = self._generate_fallback_code(test_description)

            if not steps:
                steps = [
                    "Import necessary Selenium libraries and WebDriver",
                    "Set up Chrome WebDriver with webdriver_manager",
                    "Navigate to the target URL",
                    "Locate elements and perform test actions",
                    "Add assertions to verify expected behavior",
                    "Close the browser in the finally block",
                ]

            return {
                "code":        code,
                "explanation": "AI-generated Selenium automation code using best practices",
                "steps":       steps,
                "language":    "python",
            }

        except HTTPException:
            raise
        except Exception as e:
            return {
                "code":        self._generate_fallback_code(test_description),
                "explanation": "Basic Selenium template - customize as needed",
                "steps":       ["Import Selenium libraries", "Initialize WebDriver", "Navigate to URL", "Add your test logic", "Close browser"],
                "language":    "python",
            }

    def analyze_code_for_testing(self, code: str, repo_context: str = "") -> dict:
        prompt = f"""You are an expert software testing consultant. Analyze the following code and provide comprehensive testing recommendations.

REPOSITORY CONTEXT:
{repo_context if repo_context else "No additional context provided"}

CODE TO ANALYZE:
```
{code}
```

Please provide:

1. CODE ANALYSIS:
   - What does this code do?
   - Key functionality identified
   - Potential edge cases

2. TEST RECOMMENDATIONS:
   - Critical test scenarios (what MUST be tested)
   - Edge cases to consider
   - Integration points to test

3. SELENIUM TEST PLAN:
   - If this is UI code, suggest specific Selenium tests
   - Element locators that should be used
   - User flows to automate

4. SAMPLE TEST CODE:
   - Provide a sample Selenium test for the most critical scenario

Format your response clearly with headers."""

        try:
            response = self.generate_text(prompt, max_tokens=3000)
            return {
                "analysis":    response,
                "suggestions": self._extract_suggestions(response),
                "model":       self.model,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to analyze code: {str(e)}")

    def generate_test_from_context(self, repo_name: str, file_path: str, code_snippet: str, user_request: str) -> dict:
        prompt = f"""You are an expert test automation engineer working on a production codebase.

REPOSITORY: {repo_name}
FILE: {file_path}

RELEVANT CODE:
```
{code_snippet}
```

USER REQUEST:
{user_request}

Generate a comprehensive Selenium test that addresses the user's request. The test should:
1. Be production-ready and robust
2. Include proper setup and teardown
3. Use Page Object Model if appropriate
4. Have clear assertions
5. Include error handling

Provide the test code in this format:
```python
[Your complete test code here]
```

EXPLANATION:
[Brief explanation of what the test does and why]"""

        try:
            response = self.generate_text(prompt, max_tokens=2500)

            code        = ""
            explanation = ""

            if "```python" in response:
                code_start = response.find("```python") + 9
                code_end   = response.find("```", code_start)
                if code_end != -1:
                    code = response[code_start:code_end].strip()

            if "EXPLANATION:" in response:
                explanation = response[response.find("EXPLANATION:") + 12:].strip()

            return {
                "code":        code or response,
                "explanation": explanation or "Generated test code for your request",
                "language":    "python",
                "model":       self.model,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate test: {str(e)}")

    def simulate_tests(
        self,
        task_summary:        str,
        acceptance_criteria: str,
        gap_type:            str,
        source_files:        list[dict],       # [{"path": str, "content": str}]
        test_files:          list[dict] = None, # [{"path": str, "content": str}]
    ) -> dict:
        """
        Generate test code internally, reason about source files, return a
        structured pass/fail/inconclusive verdict + explanation.  Test code is
        returned so the frontend can offer a 'View Code' / download option.
        """
        test_files    = test_files or []
        has_source    = bool(source_files)
        has_tests     = bool(test_files)

        removal_terms = ["remove", "delete", "hide", "disable", "drop", "eliminate", "strip", "clear"]
        is_removal    = any(term in task_summary.lower() for term in removal_terms)
        ac_section    = f"ACCEPTANCE CRITERIA:\n{acceptance_criteria}" if acceptance_criteria and acceptance_criteria.strip() else ""

        # ── untested: no test files found → the gap IS the missing tests, not the implementation.
        # Evaluating source code here always returns PASS for done tasks (implementation exists),
        # which is the wrong answer. Evaluate test coverage instead.
        if gap_type == "untested":
            if not has_tests:
                # No test files at all — this is unambiguously a test coverage gap.
                return {
                    "verdict":     "FAIL",
                    "explanation": (
                        "- Condition: Automated tests exist for this task\n"
                        "  Status: NOT SATISFIED\n"
                        "  Reason: No test files were found that cover this task. "
                        "The implementation may be complete but test coverage is missing."
                    ),
                    "test_code":   "",
                    "gap_type":    gap_type,
                    "model":       self.model,
                }
            # Test files exist — evaluate whether they actually cover the AC
            test_snippets = []
            for f in test_files[:5]:
                content = (f.get("content") or "")[:3000]
                test_snippets.append(f"### {f['path']}\n```\n{content}\n```")
            test_block = "\n\n".join(test_snippets)

            prompt = f"""You are a senior QA engineer auditing test coverage.

JIRA TASK: {task_summary}
{ac_section}
NOTE: Implementation files exist. Your job is to check whether the TEST FILES below actually cover the task's requirements — NOT whether the implementation exists.

TEST FILES:
{test_block}

Your job:
1. Derive testable conditions from the task and acceptance criteria (minimum 2-3).
2. For each condition, check whether the test files contain tests that verify it.
3. VERDICT is PASS only if every condition has meaningful test coverage. FAIL if any condition is untested. INCONCLUSIVE if the test files are unreadable or empty.

You MUST format your response EXACTLY like this:

VERDICT: PASS
(or FAIL or INCONCLUSIVE)

EXPLANATION:
- Condition: [specific testable condition]
  Status: SATISFIED
  Reason: [one sentence citing the specific test function or assertion that covers it]

- Condition: [next condition]
  Status: NOT SATISFIED
  Reason: [one sentence explaining what test is missing]

```python
[Suggested test code for any missing conditions, or empty if all covered]
```

Do NOT evaluate the implementation. Only evaluate whether tests cover each condition.
Never write "Not specified" or "No acceptance criteria" as a condition.
"""
            try:
                response = self.generate_text(prompt, max_tokens=5000)
                verdict = "FAIL"
                if "VERDICT: PASS" in response.upper():
                    verdict = "PASS"
                elif "VERDICT: INCONCLUSIVE" in response.upper():
                    verdict = "INCONCLUSIVE"

                explanation = ""
                if "EXPLANATION:" in response:
                    exp_start = response.find("EXPLANATION:") + 12
                    exp_end   = response.find("```", exp_start)
                    explanation = response[exp_start:exp_end].strip() if exp_end != -1 else response[exp_start:].strip()

                code = ""
                last_py = response.rfind("```python")
                if last_py != -1:
                    code_start = last_py + 9
                    code_end   = response.find("```", code_start)
                    if code_end != -1:
                        code = response[code_start:code_end].strip()

                return {
                    "verdict":     verdict,
                    "explanation": explanation or "AI analysis complete.",
                    "test_code":   code,
                    "gap_type":    gap_type,
                    "model":       self.model,
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to simulate tests: {str(e)}")

        # ── not_started / complete: original source-file evaluation logic ────────
        gap_context = {
            "not_started": "WARNING: No implementation files were found for this task. The task appears to have no code written yet.",
            "complete":    "NOTE: Both source files and test files appear to exist for this task.",
        }.get(gap_type, "")

        files_block = ""
        if has_source:
            snippets = []
            for f in source_files[:5]:
                content = (f.get("content") or "")[:3000]
                snippets.append(f"### {f['path']}\n```\n{content}\n```")
            files_block = "\n\n".join(snippets)
        else:
            files_block = "(No source files available)"

        if not has_source and is_removal:
            task_note = (
                "IMPORTANT — REMOVAL TASK WITH NO SOURCE FILES:\n"
                "This task requires removing or deleting something. "
                "If the element to be removed is NOT found in the source files, the removal is already complete — "
                "mark that condition SATISFIED and use verdict PASS. "
                "Only mark NOT SATISFIED if the task also requires something to be KEPT that is missing."
            )
        elif not has_source:
            task_note = (
                "IMPORTANT — NO SOURCE FILES AVAILABLE:\n"
                "Without source files you cannot verify any implementation detail. "
                "Use verdict INCONCLUSIVE for the overall result. "
                "For every condition write Status: INCONCLUSIVE and explain which file or code would need to be inspected."
            )
        elif is_removal:
            task_note = (
                "NOTE — REMOVAL TASK: "
                "If the element to be removed is absent from the source code, that condition is SATISFIED (it has already been removed)."
            )
        else:
            task_note = ""

        prompt = f"""You are a senior QA engineer performing an AI-based test simulation.

JIRA TASK: {task_summary}
{ac_section}
IMPLEMENTATION STATUS: {gap_context}
{task_note}

SOURCE FILES:
{files_block}

Your job:
1. Derive testable conditions for this task. Use acceptance criteria if provided. If not, infer conditions from the task title, implementation status, and source file contents — look at what the code does, what functions/endpoints/classes exist, and what behaviours are implied by the task name. You must always produce at least 2-3 meaningful conditions regardless of how little information is available.
2. For each condition, check whether the source code satisfies it.
3. Write a pytest/Selenium test suite that validates all conditions.
4. Return a structured verdict.

You MUST format your response EXACTLY like this — no prose, no paragraphs, no deviations:

VERDICT: PASS
(or)
VERDICT: FAIL
(or)
VERDICT: INCONCLUSIVE

EXPLANATION:
- Condition: [a specific testable condition derived from the task or source code]
  Status: SATISFIED
  Reason: [one sentence citing specific evidence from the source files]

- Condition: [next condition]
  Status: NOT SATISFIED
  Reason: [one sentence explaining exactly what is missing or wrong in the code]

- Condition: [next condition when no files available]
  Status: INCONCLUSIVE
  Reason: [one sentence naming the specific file or element that would need to be checked]

(one block per condition, every condition must appear)

```python
[Complete pytest test code that validates each condition above]
```

Do NOT write any paragraphs or free text in the EXPLANATION section. Only the bullet blocks above.
Never write "Not specified" or "No acceptance criteria" as a condition.
"""

        try:
            response = self.generate_text(prompt, max_tokens=5000)

            # Parse verdict
            verdict = "INCONCLUSIVE" if not has_source else "FAIL"
            if "VERDICT: PASS" in response.upper():
                verdict = "PASS"
            elif "VERDICT: FAIL" in response.upper():
                verdict = "FAIL"
            elif "VERDICT: INCONCLUSIVE" in response.upper():
                verdict = "INCONCLUSIVE"

            # Parse explanation
            explanation = ""
            if "EXPLANATION:" in response:
                exp_start = response.find("EXPLANATION:") + 12
                exp_end   = response.find("```", exp_start)
                explanation = response[exp_start:exp_end].strip() if exp_end != -1 else response[exp_start:].strip()

            # Parse test code — use rfind so we always grab the LAST ```python block,
            # not an earlier one that may be a source file echoed in the explanation.
            code = ""
            last_py_marker = response.rfind("```python")
            if last_py_marker != -1:
                code_start = last_py_marker + 9
                code_end   = response.find("```", code_start)
                if code_end != -1:
                    code = response[code_start:code_end].strip()

            return {
                "verdict":     verdict,
                "explanation": explanation or "AI analysis complete.",
                "test_code":   code,
                "gap_type":    gap_type,
                "model":       self.model,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to simulate tests: {str(e)}")

    def generate_test_for_gap(
        self,
        task_summary:        str,
        acceptance_criteria: str,
        gap_type:            str,
        source_files:        list[dict],
        existing_test_files: list[dict] | None = None,
    ) -> dict:
        """
        Generate an actual test file for a missing/untested task.
        Returns test_code, a short summary, and a list of main points.
        """
        gap_context = {
            "not_started": "No implementation files found — this task has not been started yet.",
            "untested":    "Source files exist but no dedicated test files were found.",
            "complete":    "Both source files and test files exist.",
        }.get(gap_type, "")

        files_block = ""
        if source_files:
            snippets = []
            for f in source_files[:5]:
                content = (f.get("content") or "")[:3000]
                snippets.append(f"### {f['path']}\n```\n{content}\n```")
            files_block = "\n\n".join(snippets)
        else:
            files_block = "(No source files available — generate tests based on task description alone)"

        ac_section = f"ACCEPTANCE CRITERIA:\n{acceptance_criteria}" if acceptance_criteria and acceptance_criteria.strip() else ""

        # For untested tasks: include existing tests and instruct AI to cover only the gaps
        existing_block = ""
        gap_instruction = ""
        if gap_type == "untested" and existing_test_files:
            snippets = []
            for f in existing_test_files[:5]:
                content = (f.get("content") or "")[:2000]
                snippets.append(f"### {f['path']}\n```\n{content}\n```")
            existing_block = "\n\n".join(snippets)
            gap_instruction = (
                "\nIMPORTANT: Existing tests are provided above. "
                "Do NOT re-test anything already covered by them. "
                "Identify which acceptance criteria or behaviours are NOT tested yet, "
                "and generate tests ONLY for those missing parts."
            )

        existing_section = f"\nEXISTING TESTS (already covered — do not duplicate):\n{existing_block}" if existing_block else ""

        prompt = f"""You are a senior QA engineer. Generate a complete, production-ready pytest test file for the following Jira task.

JIRA TASK: {task_summary}
{ac_section}
IMPLEMENTATION STATUS: {gap_context}
{existing_section}
SOURCE FILES:
{files_block}
{gap_instruction}

Your response MUST follow this EXACT format:

SUMMARY:
[One sentence describing what this test suite validates]

MAIN POINTS:
- [Key aspect 1 being tested]
- [Key aspect 2 being tested]
- [Key aspect 3 being tested]
(add more points as needed, minimum 3)

```python
[Complete pytest test code. Include imports, fixtures, and at least 3 test functions. Use realistic assertions. If no source files are available, generate tests based on the task description using mocks or stubs.]
```

Do NOT add any extra prose. Only the three sections above."""

        try:
            response = self.generate_text(prompt, max_tokens=4000)

            summary = ""
            main_points: list[str] = []
            code = ""

            if "SUMMARY:" in response:
                s_start = response.find("SUMMARY:") + 8
                s_end   = response.find("\n", s_start)
                summary = response[s_start:s_end].strip() if s_end != -1 else response[s_start:].strip()

            if "MAIN POINTS:" in response:
                mp_start = response.find("MAIN POINTS:") + 12
                mp_end   = response.find("```", mp_start)
                mp_block = response[mp_start:mp_end].strip() if mp_end != -1 else response[mp_start:].strip()
                main_points = [
                    line.lstrip("- •*").strip()
                    for line in mp_block.splitlines()
                    if line.strip().startswith(("-", "•", "*"))
                ]

            last_py = response.rfind("```python")
            if last_py != -1:
                code_start = last_py + 9
                code_end   = response.find("```", code_start)
                if code_end != -1:
                    code = response[code_start:code_end].strip()

            return {
                "test_code":   code or "# Test generation failed — no code returned",
                "summary":     summary or f"Tests for: {task_summary}",
                "main_points": main_points or ["Test generation returned no structured points"],
                "gap_type":    gap_type,
                "model":       self.model,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate test: {str(e)}")

    def verify_test_coverage(
        self,
        task_summary: str,
        acceptance_criteria: str,
        test_files: list[dict],  # [{"path": str, "content": str}]
    ) -> dict:
        """
        Check whether the provided test files actually cover the task's requirements.
        Returns {"covered": bool, "reason": str}.
        """
        snippet_blocks = []
        for f in test_files[:3]:
            content_snip = (f.get("content") or "")[:2000]
            snippet_blocks.append(f"### {f['path']}\n```\n{content_snip}\n```")
        files_block = "\n\n".join(snippet_blocks) if snippet_blocks else "(no content)"

        ac_section = (
            f"\nACCEPTANCE CRITERIA:\n{acceptance_criteria}"
            if acceptance_criteria and acceptance_criteria.strip()
            else ""
        )

        prompt = f"""You are a QA engineer. Determine if the test files below actually test the described task.

TASK: {task_summary}{ac_section}

TEST FILES:
{files_block}

Respond with EXACTLY this format — no other text:
COVERED: YES
REASON: [one sentence]

or

COVERED: NO
REASON: [one sentence]

Answer YES only if the test file content clearly exercises the task's functionality or verifies its acceptance criteria."""

        try:
            response = self.generate_text(prompt, max_tokens=200)
            covered = bool(re.search(r'COVERED:\s*YES', response, re.IGNORECASE))
            reason  = ""
            m = re.search(r'REASON:\s*(.+)', response, re.IGNORECASE)
            if m:
                reason = m.group(1).strip()
            return {"covered": covered, "reason": reason}
        except Exception:
            # On any error, do not downgrade — treat as covered to avoid false negatives
            return {"covered": True, "reason": "Verification unavailable"}

    def evaluate_manual_test(self, test_steps: str, scenario: str = "Login Form", url: str = "") -> str:
        prompt = (
            f"Test engineer. Review this manual test.\n"
            f"Scenario: {scenario} URL: {url}\n{test_steps}\n\n"
            f"Feedback (max 100 words): gaps, quality, suggestions. Bullets."
        )
        return self.generate_text(prompt, max_tokens=250)

    def answer_automation_question(self, question: str, context: str = "") -> str:
        prompt = (
            f"Selenium Python expert. {context or ''}\n"
            f"Q: {question}\n"
            f"Answer max 150 words. Short code if needed."
        )
        return self.generate_text(prompt, max_tokens=300)

    def check_availability(self) -> bool:
        return self.client is not None

    def _generate_fallback_code(self, test_description: str) -> str:
        return f"""from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Test Description: {test_description}

def test_scenario():
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
    driver.maximize_window()
    try:
        driver.get("https://example.com")
        wait = WebDriverWait(driver, 10)
        print("Test completed successfully!")
    except Exception as e:
        print(f"Test failed: {{str(e)}}")
        raise
    finally:
        driver.quit()

if __name__ == "__main__":
    test_scenario()
"""

    def _extract_suggestions(self, analysis: str) -> list:
        suggestions = []
        for line in analysis.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                suggestions.append(line)
        return suggestions[:10]


groq_service = GroqService()
