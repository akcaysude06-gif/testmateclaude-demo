#!/bin/bash

echo "🚀 TestMate Setup Script (macOS Compatible)"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
OS="$(uname)"

# Check if Ollama is installed
echo "Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama is not installed${NC}"
    echo ""
    if [ "$OS" == "Darwin" ]; then
        echo "Please install Ollama for macOS:"
        echo "  1. Download from: https://ollama.ai/download"
        echo "  2. Or use Homebrew: brew install ollama"
    else
        echo "Please install Ollama for Linux:"
        echo "  curl -fsSL https://ollama.ai/install.sh | sh"
    fi
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Ollama is installed${NC}"
fi

# Check if Llama 3 model is available
echo "Checking if Llama 3 model is downloaded..."
if ollama list | grep -q "llama3"; then
    echo -e "${GREEN}✅ Llama 3 model is available${NC}"
else
    echo -e "${YELLOW}⚠️  Llama 3 model not found${NC}"
    echo "Downloading Llama 3 model (this may take a few minutes)..."
    ollama pull llama3
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Llama 3 model downloaded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to download Llama 3 model${NC}"
        exit 1
    fi
fi

# Rest of the script remains the same...
# (Continue with Python, Node.js checks, etc.)