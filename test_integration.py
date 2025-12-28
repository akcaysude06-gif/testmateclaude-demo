#!/usr/bin/env python3
"""
Test script for TestMate Llama 3 integration
"""

import requests
import json
import sys
import time

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(message):
	print(f"{GREEN}✅ {message}{RESET}")

def print_error(message):
	print(f"{RED}❌ {message}{RESET}")

def print_info(message):
	print(f"{BLUE}ℹ️  {message}{RESET}")

def print_warning(message):
	print(f"{YELLOW}⚠️  {message}{RESET}")

def test_ollama_connection():
	"""Test if Ollama is running"""
	print_info("Testing Ollama connection...")
	try:
		response = requests.post(
			"http://localhost:11434/api/generate",
			json={
				"model": "llama3",
				"prompt": "Say 'OK'",
				"stream": False
			},
			timeout=10
		)
		if response.status_code == 200:
			print_success("Ollama is running and Llama 3 is available")
			return True
		else:
			print_error(f"Ollama returned status code: {response.status_code}")
			return False
	except requests.exceptions.ConnectionError:
		print_error("Cannot connect to Ollama. Is it running?")
		print_info("Try running: ollama serve")
		return False
	except Exception as e:
		print_error(f"Error connecting to Ollama: {e}")
		return False

def test_backend_health():
	"""Test backend health endpoint"""
	print_info("Testing backend health...")
	try:
		response = requests.get("http://localhost:8000/api/health", timeout=5)
		if response.status_code == 200:
			data = response.json()
			print_success("Backend is running")
			print(f"  Status: {data.get('status')}")
			print(f"  Llama 3: {data.get('llama3')}")
			print(f"  Claude: {data.get('claude')}")
			return True
		else:
			print_error(f"Backend returned status code: {response.status_code}")
			return False
	except requests.exceptions.ConnectionError:
		print_error("Cannot connect to backend. Is it running?")
		print_info("Try running: cd backend && python main.py")
		return False
	except Exception as e:
		print_error(f"Error connecting to backend: {e}")
		return False

def test_level0_content():
	"""Test Level 0 content generation with Llama 3"""
	print_info("Testing Level 0 content generation...")
	try:
		start_time = time.time()
		response = requests.get("http://localhost:8000/api/level0/content", timeout=60)
		elapsed = time.time() - start_time

		if response.status_code == 200:
			data = response.json()
			content = data.get('content', '')
			model = data.get('model', 'unknown')

			print_success(f"Level 0 content generated in {elapsed:.2f}s")
			print(f"  Model used: {model}")
			print(f"  Content length: {len(content)} characters")

			if len(content) > 100:
				print_success("Content appears to be complete")
				print("\n--- Sample Content ---")
				print(content[:300] + "..." if len(content) > 300 else content)
				print("--- End Sample ---\n")
				return True
			else:
				print_warning("Content seems too short")
				return False
		else:
			print_error(f"Failed with status code: {response.status_code}")
			print(f"Response: {response.text}")
			return False
	except requests.exceptions.Timeout:
		print_error("Request timed out. Llama 3 might be slow or not responding.")
		return False
	except Exception as e:
		print_error(f"Error testing Level 0: {e}")
		return False

def test_level1_generation():
	"""Test Level 1 automation generation with Claude"""
	print_info("Testing Level 1 automation generation...")
	try:
		test_case = "Test login functionality with valid credentials"
		start_time = time.time()
		response = requests.post(
			"http://localhost:8000/api/generate-automation",
			json={"test_case": test_case},
			timeout=30
		)
		elapsed = time.time() - start_time

		if response.status_code == 200:
			data = response.json()
			code = data.get('code', '')
			model = data.get('model', 'unknown')

			print_success(f"Automation code generated in {elapsed:.2f}s")
			print(f"  Model used: {model}")
			print(f"  Code length: {len(code)} characters")
			return True
		else:
			print_error(f"Failed with status code: {response.status_code}")
			if response.status_code == 500:
				print_warning("This might be due to missing ANTHROPIC_API_KEY")
			return False
	except Exception as e:
		print_error(f"Error testing Level 1: {e}")
		return False

def main():
	print("\n" + "="*50)
	print("TestMate Integration Test Suite")
	print("="*50 + "\n")

	tests = [
		("Ollama Connection", test_ollama_connection),
		("Backend Health", test_backend_health),
		("Level 0 (Llama 3)", test_level0_content),
		("Level 1 (Claude)", test_level1_generation),
	]

	results = []

	for test_name, test_func in tests:
		print(f"\n--- {test_name} ---")
		result = test_func()
		results.append((test_name, result))
		print()

	# Summary
	print("\n" + "="*50)
	print("Test Summary")
	print("="*50)

	passed = sum(1 for _, result in results if result)
	total = len(results)

	for test_name, result in results:
		status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
		print(f"{status} - {test_name}")

	print(f"\nTotal: {passed}/{total} tests passed")

	if passed == total:
		print_success("\n🎉 All tests passed! TestMate is ready to use.")
		return 0
	else:
		print_error("\n❌ Some tests failed. Please check the errors above.")
		return 1

if __name__ == "__main__":
	sys.exit(main())