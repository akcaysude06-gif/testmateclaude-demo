"""
Claude AI Service via Anthropic API
Handles all Claude model interactions
"""
from anthropic import Anthropic
from fastapi import HTTPException
from config.settings import settings

class ClaudeService:
	def __init__(self):
		self.api_key = settings.ANTHROPIC_API_KEY
		if self.api_key:
			self.client = Anthropic(api_key=self.api_key)
		else:
			self.client = None

	def generate_text(self, prompt: str, max_tokens: int = 2000) -> str:
		"""
		Generate text using Claude

		Args:
			prompt: The input prompt
			max_tokens: Maximum tokens to generate

		Returns:
			Generated text from Claude
		"""
		if not self.client:
			raise HTTPException(
				status_code=503,
				detail="Claude API key not configured"
			)

		try:
			message = self.client.messages.create(
				model="claude-sonnet-4-20250514",
				max_tokens=max_tokens,
				messages=[
					{"role": "user", "content": prompt}
				]
			)

			return message.content[0].text

		except Exception as e:
			raise HTTPException(
				status_code=500,
				detail=f"Error calling Claude API: {str(e)}"
			)

	def generate_selenium_code(self, test_description: str) -> dict:
		"""
		Generate Level 1 Selenium automation code based on user description

		Args:
			test_description: User's description of what they want to test

		Returns:
			Dictionary with code, explanation, and steps
		"""
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

			# Parse the response
			code = ""
			steps = []

			# Extract code between ```python and ```
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

			# Extract steps
			if "STEPS:" in response:
				steps_text = response[response.find("STEPS:") + 6:]
				for line in steps_text.split('\n'):
					line = line.strip()
					if line and (line[0].isdigit() or line.startswith('-')):
						steps.append(line)

			# Fallback if no code found
			if not code:
				code = self._generate_fallback_code(test_description)

			# Fallback if no steps found
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
			print(f"Error parsing Claude response: {e}")
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
		"""
		Analyze code and suggest test scenarios for Production Mode

		Args:
			code: The code to analyze
			repo_context: Additional context about the repository

		Returns:
			Dictionary with analysis and suggestions
		"""
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
				"analysis": response,
				"suggestions": self._extract_suggestions(response),
				"model": "claude-sonnet-4"
			}

		except Exception as e:
			raise HTTPException(
				status_code=500,
				detail=f"Failed to analyze code: {str(e)}"
			)

	def generate_test_from_context(self, repo_name: str, file_path: str, code_snippet: str, user_request: str) -> dict:
		"""
		Generate test code based on repository context and user request

		Args:
			repo_name: Name of the repository
			file_path: Path to the file being tested
			code_snippet: Relevant code snippet
			user_request: What the user wants to test

		Returns:
			Dictionary with generated test code
		"""
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

			# Parse code and explanation
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
				"model": "claude-sonnet-4"
			}

		except Exception as e:
			raise HTTPException(
				status_code=500,
				detail=f"Failed to generate test: {str(e)}"
			)

	def _generate_fallback_code(self, test_description: str) -> str:
		"""Generate a basic Selenium template as fallback"""
		return f"""from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Test Description: {test_description}

def test_scenario():
    # Setup Chrome WebDriver
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
    driver.maximize_window()
    
    try:
        # Navigate to URL
        driver.get("https://example.com")  # Replace with your URL
        
        # Wait for page to load
        wait = WebDriverWait(driver, 10)
        
        # TODO: Add your test steps here
        # Example:
        # element = wait.until(EC.presence_of_element_located((By.ID, "element-id")))
        # element.click()
        
        print("Test completed successfully!")
        
    except Exception as e:
        print(f"Test failed: {{str(e)}}")
        raise
        
    finally:
        # Always close the browser
        driver.quit()

if __name__ == "__main__":
    test_scenario()
"""

	def _extract_suggestions(self, analysis: str) -> list:
		"""Extract key suggestions from analysis"""
		suggestions = []

		# Look for numbered or bulleted lists
		lines = analysis.split('\n')
		for line in lines:
			line = line.strip()
			if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
				suggestions.append(line)

		return suggestions[:10]  # Return top 10 suggestions

	def check_availability(self) -> bool:
		"""
		Check if Claude API is available

		Returns:
			True if API key is configured, False otherwise
		"""
		return self.client is not None
def analyze_code_for_testing(self, code: str, repo_context: str = "") -> dict:
	"""
	Analyze code and suggest test scenarios for Production Mode

	Args:
		code: The code to analyze
		repo_context: Additional context about the repository

	Returns:
		Dictionary with analysis and suggestions
	"""
	prompt = f"""You are an expert software testing consultant. Analyze the following context and provide comprehensive testing recommendations.

REPOSITORY CONTEXT:
{repo_context if repo_context else "Analyzing repository for testing improvements"}

Please provide a detailed analysis covering:

1. CURRENT TEST STRUCTURE ASSESSMENT:
   - What tests appear to exist (if any)
   - Testing frameworks and patterns in use
   - Overall test organization

2. COVERAGE ANALYSIS:
   - Areas that likely have good test coverage
   - Critical gaps in testing
   - High-risk untested functionality

3. RECOMMENDATIONS:
   - Priority areas that need testing
   - Suggested test types (unit, integration, E2E)
   - Specific test scenarios to implement

4. BEST PRACTICES:
   - Testing patterns to adopt
   - Code organization improvements
   - Maintainability suggestions

Format your response as a clear, structured report."""

	try:
		response = self.generate_text(prompt, max_tokens=3000)

		return {
			"analysis": response,
			"suggestions": self._extract_suggestions(response),
			"model": "claude-sonnet-4"
		}

	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to analyze code: {str(e)}"
		)
# ⭐ SINGLETON INSTANCE - THIS IS CRITICAL!
claude_service = ClaudeService()