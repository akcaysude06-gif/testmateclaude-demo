# TestMate - AI-Assisted Testing Framework

AI-powered educational platform for learning software testing and automation.

## 🚀 Quick Start

### Prerequisites
1. Python 3.9+
2. Node.js 18+
3. Ollama (for Llama 3)
4. Anthropic API Key (for Claude)

### Installation

**1. Install Ollama:**
```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Download from https://ollama.ai/download
```

**2. Pull Llama 3:**
```bash
ollama run llama3
# Type /bye to exit after download
```

**3. Run Setup:**
```bash
chmod +x setup.sh
./setup.sh
```

**4. Configure API Keys:**

Edit `backend/.env`:
```bash
ANTHROPIC_API_KEY=your_key_here
```

**5. Start Application:**

Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
python main.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**6. Open Browser:**
```
http://localhost:3000
```

## 🧪 Testing
```bash
python test_integration.py
```

## 📚 Architecture

- **Level 0**: Llama 3 (free, local) - Educational content
- **Level 1**: Claude Sonnet 4 (paid, cloud) - Code generation
- **Production**: Claude Sonnet 4 - Code analysis

## 🎯 Features

- ✅ Level 0: Testing fundamentals (Llama 3)
- ✅ Level 1: Selenium automation generation (Claude)
- ✅ Production Mode: Code analysis (Claude)

## 📝 API Endpoints

- `GET /api/level0/content` - Educational content
- `POST /api/generate-automation` - Generate automation code
- `POST /api/analyze-code` - Analyze code
- `GET /api/health` - Health check

## 👥 Team

- Şevval Sude Akçay
- Sude Demir

TED University - CMPE 491/SENG 491 Senior Project
```

---

## 📂 Final Project Structure

Your project should look like this:
```
testmate/
├── backend/
│   ├── main.py              ← UPDATED
│   ├── requirements.txt     ← UPDATED
│   ├── .env.example         ← NEW
│   └── .env                 ← UPDATE with your API key
├── frontend/
│   ├── pages/
│   ├── styles/
│   └── package.json
├── setup.sh                 ← NEW
├── test_integration.py      ← NEW
├── README.md                ← NEW/UPDATED
└── .gitignore