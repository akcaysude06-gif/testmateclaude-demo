"""
Gemini AI Service (replaces Claude/Anthropic)
Handles all AI model interactions using Google Gemini
"""
import google.generativeai as genai
from fastapi import HTTPException
from backend.config.settings import settings

class GeminiService:
	def __init__(self):
		self.api_key = settings.GEMINI_API_KEY
		if self.api_key:
			genai.configure(api_key=self.api_key)
			self.model = genai.GenerativeModel("gemini-2.0-flash")
		else:
			self.model = None

	def generate_text(self, prompt: str, max_tokens: int = 2000) -> str:
		if not self.model:
			raise HTTPException(status_code=503, detail="Gemini API key not configured")
		try:
			response = self.model.generate_content(
				prompt,
				generation_config=genai.types.GenerationConfig(max_output_tokens=max_tokens)
			)
			return response.text
		except Exception as e:
			raise HTTPException(status_code=500, detail=f"Error calling Gemini API: {str(e)}")

	def generate_selenium_code(self, test_description: str) -> dict:
		prompt = f"""You are an expert Selenium automation engineer. Generate a complete Selenium Python script for:

TEST DESCRIPTION:
{test_description}

Format your response EXACTLY as:
```python
[Your complete Python code here]
```

STEPS:
1. [First step]
2. [Second step]
3. [Third step]"""

		try:
			response = self.generate_text(prompt, max_tokens=2000)
			code = ""
			steps = []

			if "```python" in response:
				code_start = response.find("```python") + 9
				code_end = response.find("```", code_start)
				if code_end != -1:
					code = response[code_start:code_end].strip()
			elif "```" in response:
				code_start = response.find("```") + 3
				code_end = response.find("```", code_start)
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
					"Close the browser in the finally block"
				]

			return {
				"code": code,
				"explanation": "AI-generated Selenium automation code using best practices",
				"steps": steps,
				"language": "python"
			}

		except HTTPException:
			raise
		except Exception as e:
			return {
				"code": self._generate_fallback_code(test_description),
				"explanation": "Basic Selenium template - customize as needed",
				"steps": [
					"Import Selenium libraries",
					"Initialize WebDriver",
					"Navigate to URL",
					"Add your test logic",
					"Close browser"
				],
				"language": "python"
			}

	def analyze_code_for_testing(self, code: str, repo_context: str = "") -> dict:
		prompt = f"""You are an expert software testing consultant. Analyze the following code and provide comprehensive testing recommendations.

REPOSITORY CONTEXT:
{repo_context if repo_context else "No additional context provided"}

CODE TO ANALYZE:
{code}

Provide: code analysis, test recommendations, edge cases, Selenium test plan, and sample test code."""

		try:
			response = self.generate_text(prompt, max_tokens=3000)
			return {
				"analysis": response,
				"suggestions": self._extract_suggestions(response),
				"model": "gemini-2.0-flash"
			}
		except Exception as e:
			raise HTTPException(status_code=500, detail=f"Failed to analyze code: {str(e)}")

	def generate_test_from_context(self, repo_name: str, file_path: str, code_snippet: str, user_request: str) -> dict:
		prompt = f"""You are an expert test automation engineer.

REPOSITORY: {repo_name}
FILE: {file_path}

RELEVANT CODE:
{code_snippet}

USER REQUEST:
{user_request}

Generate a comprehensive Selenium test. Format:
```python
[Your complete test code here]
```

EXPLANATION:
[Brief explanation]"""

		try:
			response = self.generate_text(prompt, max_tokens=2500)
			code = ""
			explanation = ""

			if "```python" in response:
				code_start = response.find("```python") + 9
				code_end = response.find("```", code_start)
				if code_end != -1:
					code = response[code_start:code_end].strip()

			if "EXPLANATION:" in response:
				explanation = response[response.find("EXPLANATION:") + 12:].strip()

			return {
				"code": code or response,
				"explanation": explanation or "Generated test code for your request",
				"language": "python",
				"model": "gemini-2.0-flash"
			}
		except Exception as e:
			raise HTTPException(status_code=500, detail=f"Failed to generate test: {str(e)}")

	def evaluate_manual_test(self, test_steps: str, scenario: str, url: str) -> str:
		prompt = f"""You are a software testing expert. Evaluate these manual test steps:

SCENARIO: {scenario}
URL: {url}
TEST STEPS:
{test_steps}

Provide feedback on: completeness, clarity, edge cases missed, and improvements."""
		return self.generate_text(prompt, max_tokens=1000)

	def answer_automation_question(self, question: str, context: str = "") -> str:
		prompt = f"""You are a Selenium automation expert.

CONTEXT: {context}

QUESTION: {question}

Provide a clear, practical answer."""
		return self.generate_text(prompt, max_tokens=1000)

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

	def check_availability(self) -> bool:
		return self.model is not None


llama_service = GeminiService()