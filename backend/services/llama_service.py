"""
Llama 3 AI Service via Ollama
Handles all Llama 3 model interactions
"""
import requests
from fastapi import HTTPException
from config.settings import settings

class LlamaService:
	def __init__(self):
		self.api_url = settings.LLAMA_API_URL
		self.model = settings.LLAMA_MODEL

	def generate_text(self, prompt: str, temperature: float = 0.7, top_p: float = 0.9, max_tokens: int = 2000) -> str:
		"""
		Generate text using Llama 3 model

		Args:
			prompt: The input prompt
			temperature: Controls randomness (0.0 to 1.0)
			top_p: Controls diversity (0.0 to 1.0)
			max_tokens: Maximum tokens to generate

		Returns:
			Generated text from Llama 3

		Raises:
			HTTPException: If Ollama is not available or request fails
		"""
		try:
			payload = {
				"model": self.model,
				"prompt": prompt,
				"stream": False,
				"options": {
					"temperature": temperature,
					"top_p": top_p,
					"num_predict": max_tokens,  # Limit response length
				}
			}

			# Increased timeout to 120 seconds for code generation
			response = requests.post(self.api_url, json=payload, timeout=120)
			response.raise_for_status()

			result = response.json()
			return result.get("response", "")

		except requests.exceptions.ConnectionError:
			raise HTTPException(
				status_code=503,
				detail="Llama 3 service is not available. Please make sure Ollama is running with: ollama serve"
			)
		except requests.exceptions.Timeout:
			raise HTTPException(
				status_code=504,
				detail="Request timed out. Try with a shorter test description or check if Ollama is running properly."
			)
		except Exception as e:
			raise HTTPException(
				status_code=500,
				detail=f"Error calling Llama 3: {str(e)}"
			)

	def generate_educational_content(self) -> str:
		"""
		Generate Level 0 educational content about software testing

		Returns:
			Comprehensive educational text about testing fundamentals
		"""
		prompt = """You are a friendly and expert software testing educator. 

Provide a comprehensive but beginner-friendly explanation for someone who has ZERO experience in software testing. 

Please cover these topics in a clear, encouraging way:

1. What is Software Testing?
   - Simple definition
   - Why it's important in software development
   - Real-world examples (like testing a new phone app before release)

2. Manual Testing vs Automation Testing
   - What is manual testing? (with examples)
   - What is automation testing? (with examples)
   - When to use each approach
   - Benefits and drawbacks of both

3. Why Selenium for Web Automation?
   - Brief introduction to Selenium
   - Why it's popular for web testing
   - What kind of tests can be automated with Selenium

Keep the tone conversational and encouraging. Use simple language and avoid jargon. Include practical examples that beginners can relate to.

Format your response in clear sections with proper headings."""

		return self.generate_text(prompt, max_tokens=1500)

	def generate_selenium_code(self, test_description: str) -> dict:
		"""
		Generate Level 1 Selenium automation code based on user description

		Args:
			test_description: User's description of what they want to test

		Returns:
			Dictionary with code, explanation, and steps
		"""
		# Shorter, more focused prompt for faster generation
		prompt = f"""Generate a Selenium Python script for this test:

{test_description}

Requirements:
- Use Chrome WebDriver
- Include necessary imports
- Add clear comments
- Use WebDriverWait for waits
- Follow best practices

Format your response EXACTLY like this:
```python
[Your complete Python code here]
```

STEPS:
1. [First step]
2. [Second step]
3. [Third step]

Keep it concise and professional."""

		try:
			# Use shorter timeout and fewer tokens for faster response
			response = self.generate_text(prompt, temperature=0.2, top_p=0.9, max_tokens=1500)

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
			else:
				# No code blocks found, use entire response
				code = response.strip()

			# Extract steps
			if "STEPS:" in response:
				steps_text = response[response.find("STEPS:") + 6:]
				for line in steps_text.split('\n'):
					line = line.strip()
					if line and (line[0].isdigit() or line.startswith('-')):
						steps.append(line)

			# Fallback if no steps found
			if not steps:
				steps = [
					"Import necessary Selenium libraries",
					"Set up Chrome WebDriver",
					"Navigate to the target URL",
					"Perform test actions",
					"Verify expected results",
					"Close the browser"
				]

			# Ensure we have some code
			if not code:
				code = self._generate_fallback_code(test_description)

			return {
				"code": code,
				"explanation": "AI-generated Selenium automation code based on your test scenario",
				"steps": steps,
				"language": "python"
			}

		except HTTPException:
			raise
		except Exception as e:
			print(f"Error parsing Llama response: {e}")
			# Return fallback code on error
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

	def _generate_fallback_code(self, test_description: str) -> str:
		"""Generate a basic Selenium template as fallback"""
		return f"""from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Test Description: {test_description}

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
    # username_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
    # username_field.send_keys("testuser")
    
    print("Test completed successfully!")
    
except Exception as e:
    print(f"Test failed: {{str(e)}}")
    
finally:
    # Close browser
    driver.quit()
"""

	def check_availability(self) -> bool:
		"""
		Check if Llama 3 service is available

		Returns:
			True if available, False otherwise
		"""
		try:
			response = requests.get("http://localhost:11434/api/tags", timeout=2)
			return response.status_code == 200
		except:
			return False

# Singleton instance
llama_service = LlamaService()