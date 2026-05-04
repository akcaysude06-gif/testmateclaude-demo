"""
AI Service — backed by Groq (Llama 3.3) with Anthropic fallback.
"""
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
            raise HTTPException(status_code=500, detail=f"Error calling Groq API: {str(e)}")

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

    def generate_tests_from_gaps(
        self,
        task_summary:        str,
        acceptance_criteria: str,
        existing_code:       str,
        gap_type:            str,
    ) -> dict:
        if gap_type == "not_started":
            prompt = f"""You are a senior test automation engineer.
A Jira task has NO implementation yet.

Task: {task_summary}
Acceptance Criteria:
{acceptance_criteria or "Not specified"}

Generate a complete Selenium Python test suite FROM SCRATCH covering the acceptance criteria.
- Use pytest as the test runner
- Use Selenium with WebDriverWait and explicit waits (no time.sleep)
- Include setup/teardown fixtures
- Cover each acceptance criterion as a separate test case

```python
[complete test code here]
```

EXPLANATION:
[What the tests cover and what gap they address]"""

        elif gap_type == "untested":
            prompt = f"""You are a senior test automation engineer.
Code exists but has NO tests.

Task: {task_summary}
Acceptance Criteria:
{acceptance_criteria or "Not specified"}

Existing Code:
```
{existing_code or "# (code not provided — generate based on task summary)"}
```

Write a complete Selenium/pytest test suite for this implementation.
Focus on user-facing behaviour, edge cases, and error states.

```python
[complete test code here]
```

EXPLANATION:
[What the tests cover and why these scenarios were chosen]"""

        else:
            prompt = f"""You are a senior test automation engineer reviewing existing coverage.

Task: {task_summary}
Acceptance Criteria:
{acceptance_criteria or "Not specified"}

Existing Code:
```
{existing_code or "# (code not provided)"}
```

Suggest ADDITIONAL edge case tests or improvements:
- Boundary value tests
- Negative / error-handling cases
- Any acceptance criteria not yet covered

```python
[additional test code here]
```

EXPLANATION:
[What gaps in coverage these tests address]"""

        try:
            response    = self.generate_text(prompt, max_tokens=3000)
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
                "explanation": explanation or "Generated test code for Jira task gap",
                "language":    "python",
                "gap_type":    gap_type,
                "model":       self.model,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate tests from gap: {str(e)}")

    def simulate_tests(
        self,
        task_summary:        str,
        acceptance_criteria: str,
        gap_type:            str,
        source_files:        list[dict],  # [{"path": str, "content": str}]
    ) -> dict:
        """
        Generate test code internally, reason about source files, return a
        structured pass/fail/inconclusive verdict + explanation.  Test code is
        returned so the frontend can offer a 'View Code' / download option.
        """
        gap_context = {
            "not_started": "WARNING: No implementation files were found for this task. The task appears to have no code written yet.",
            "untested":    "NOTE: Source files exist but no dedicated test files were found for this task.",
            "complete":    "NOTE: Both source files and test files appear to exist for this task.",
        }.get(gap_type, "")

        removal_terms = ["remove", "delete", "hide", "disable", "drop", "eliminate", "strip", "clear"]
        is_removal    = any(term in task_summary.lower() for term in removal_terms)
        has_files     = bool(source_files)

        files_block = ""
        if has_files:
            snippets = []
            for f in source_files[:5]:  # cap at 5 files to stay within token limits
                content = (f.get("content") or "")[:3000]  # cap per file
                snippets.append(f"### {f['path']}\n```\n{content}\n```")
            files_block = "\n\n".join(snippets)
        else:
            files_block = "(No source files available)"

        # Build task-specific guidance
        if not has_files and is_removal:
            task_note = (
                "IMPORTANT — REMOVAL TASK WITH NO SOURCE FILES:\n"
                "This task requires removing or deleting something. "
                "If the element to be removed is NOT found in the source files, the removal is already complete — "
                "mark that condition SATISFIED and use verdict PASS. "
                "Only mark NOT SATISFIED if the task also requires something to be KEPT that is missing."
            )
        elif not has_files:
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

        ac_section = f"ACCEPTANCE CRITERIA:\n{acceptance_criteria}" if acceptance_criteria and acceptance_criteria.strip() else ""

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
            verdict = "INCONCLUSIVE" if not has_files else "FAIL"
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
