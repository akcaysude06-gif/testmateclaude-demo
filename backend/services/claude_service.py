"""
Claude AI Service via Anthropic API
Handles all Claude model interactions for code generation and analysis
"""
import anthropic
from fastapi import HTTPException
from config.settings import settings

class ClaudeService:
	def __init__(self):
		if not settings.ANTHROPIC_API_KEY:
			print("Warning: ANTHROPIC_API_KEY not set")
			self.client = None
		else:
			self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

		self.model = "claude-sonnet-4-20250514"

	def generate_text(self, prompt: str, max_tokens: int = 3000) -> str:
		"""
		Generate text using Claude

		Args:
			prompt: The input prompt
			max_tokens: Maximum tokens to generate

		Returns:
			Generated text from Claude

		Raises:
			HTTPException: If Claude API fails
		"""
		if not self.client:
			raise HTTPException(
				status_code=503,
				detail="Claude service not configured. Please set ANTHROPIC_API_KEY in .env"
			)

		try:
			message = self.client.messages.create(
				model=self.model,
				max_tokens=max_tokens,
				messages=[{"role": "user", "content": prompt}]
			)
			return message.content[0].text

		except Exception as e:
			raise HTTPException(
				status_code=500,
				detail=f"Error calling Claude: {str(e)}"
			)

	def generate_automation_code(self, test_case: str) -> dict:
		"""
		Generate Selenium automation code from test case

		Args:
			test_case: Description of the test case

		Returns:
			Dictionary with explanation, code, and reasoning
		"""
		prompt = f"""You are an expert in Selenium WebDriver and Cucumber BDD testing. 

Given this test case: "{test_case}"

Please provide:
1. A brief explanation of the approach (2-3 sentences)
2. A complete Cucumber feature file with the scenario
3. Python step definitions using Selenium WebDriver with proper waits and best practices
4. A detailed reasoning section explaining why you structured it this way

Format your response with clear sections for Explanation, Code, and Reasoning."""

		response_text = self.generate_text(prompt, max_tokens=3000)

		return {
			"explanation": response_text[:500],
			"code": response_text,
			"reasoning": "The structure follows BDD principles with Gherkin syntax for the feature file and Python step definitions implementing Selenium actions with explicit waits for reliability."
		}

	def analyze_code(self, code: str, repo_name: str = None) -> str:
		"""
		Analyze automation code and provide improvements

		Args:
			code: The code to analyze
			repo_name: Optional repository name

		Returns:
			Analysis and recommendations
		"""
		code_to_analyze = code if code else f"Code from repository: {repo_name}"

		prompt = f"""You are an expert automation testing consultant. Analyze this Selenium automation code or repository:

{code_to_analyze}

Provide:
1. Top 3 issues found (with severity: high/medium/low, title, description, location, suggestion)
2. Recommended improvements with code examples
3. Metrics estimation (total tests, code coverage estimate, redundant code percentage, avg execution time)

Be specific and actionable."""

		return self.generate_text(prompt, max_tokens=2500)

	def check_availability(self) -> bool:
		"""
		Check if Claude service is available

		Returns:
			True if available, False otherwise
		"""
		return self.client is not None

# Singleton instance
claude_service = ClaudeService()