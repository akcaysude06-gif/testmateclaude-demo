import React, { useState } from 'react';
import { Play, GitBranch, BookOpen, Code, Sparkles, ChevronRight, LogOut, FileCode, Zap } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

interface Repo {
    id: number;
    name: string;
    language: string;
    updated: string;
}

interface Issue {
    severity: string;
    title: string;
    description: string;
    location: string;
    suggestion: string;
}

interface AIResponse {
    type: string;
    content?: string;
    testCase?: string;
    explanation?: string;
    code?: string;
    reasoning?: string;
    issues?: Issue[];
    improvements?: string;
    metrics?: {
        totalTests: number;
        codeCoverage: string;
        redundantCode: string;
        avgExecutionTime: string;
    };
}

export default function TestMateDemo() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentMode, setCurrentMode] = useState<string | null>(null);
    const [currentLevel, setCurrentLevel] = useState<number | null>(null);
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
    const [testCaseInput, setTestCaseInput] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGitHubLogin = async () => {
        setIsLoading(true);

        // Mock login - backend olmadan çalışır
        setTimeout(() => {
            setIsAuthenticated(true);
            setRepos([
                { id: 1, name: 'ecommerce-tests', language: 'Python', updated: '2 days ago' },
                { id: 2, name: 'login-automation', language: 'Java', updated: '1 week ago' },
                { id: 3, name: 'api-test-suite', language: 'Python', updated: '3 days ago' }
            ]);
            setIsLoading(false);
        }, 1500);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentMode(null);
        setCurrentLevel(null);
        setSelectedRepo(null);
        setAiResponse(null);
    };

    const handleLevel0Continue = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/level0/content`);
            setAiResponse(response.data);
        } catch (error) {
            console.error('Failed to fetch content:', error);
        }
        setIsLoading(false);
    };

    const handleGenerateAutomation = async () => {
        if (!testCaseInput.trim()) return;

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/generate-automation`, {
                test_case: testCaseInput
            });
            setAiResponse(response.data);
        } catch (error) {
            console.error('Generation failed:', error);
        }
        setIsLoading(false);
    };

    const handleAnalyzeCode = async () => {
        if (!codeInput.trim() && !selectedRepo) return;

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/analyze-code`, {
                code: codeInput,
                repo_name: selectedRepo?.name
            });
            setAiResponse(response.data);
        } catch (error) {
            console.error('Analysis failed:', error);
        }
        setIsLoading(false);
    };
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">TestMate</h1>
                            <p className="text-purple-200">AI-Powered Testing Assistant</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleGitHubLogin}
                                disabled={isLoading}
                                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-105 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <GitBranch className="w-5 h-5" />
                                        <span>Continue with GitHub</span>
                                    </>
                                )}
                            </button>

                            <p className="text-purple-200 text-sm text-center">
                                Secure OAuth authentication • Your code stays private
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-purple-200 text-sm">
                        <p>Learn • Automate • Optimize</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <Sparkles className="w-8 h-8 text-purple-400" />
                            <span className="text-white font-bold text-xl">TestMate</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 text-purple-200 hover:text-white transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {!currentMode ? (
                    <>
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Path</h2>
                            <p className="text-purple-200 text-lg">Select the mode that fits your experience level</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            <div
                                onClick={() => setCurrentMode('guided')}
                                className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-purple-400/50 transition-all cursor-pointer transform hover:scale-105"
                            >
                                <div className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-6">
                                    <BookOpen className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Guided Mode</h3>
                                <p className="text-purple-200 mb-6">
                                    Perfect for beginners and those learning automation testing. Step-by-step guidance with AI explanations.
                                </p>
                                <div className="space-y-2 text-sm text-purple-200">
                                    <div className="flex items-center space-x-2">
                                        <ChevronRight className="w-4 h-4" />
                                        <span>Level 0: Testing Fundamentals</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <ChevronRight className="w-4 h-4" />
                                        <span>Level 1: Selenium Automation</span>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setCurrentMode('production')}
                                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-pink-400/50 transition-all cursor-pointer transform hover:scale-105"
                            >
                                <div className="flex items-center justify-center w-16 h-16 bg-purple-500 rounded-2xl mb-6">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Production Mode</h3>
                                <p className="text-purple-200 mb-6">
                                    For experienced testers. Analyze and optimize your existing automation code with AI assistance.
                                </p>
                                <div className="space-y-2 text-sm text-purple-200">
                                    <div className="flex items-center space-x-2">
                                        <ChevronRight className="w-4 h-4" />
                                        <span>Code Analysis & Optimization</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <ChevronRight className="w-4 h-4" />
                                        <span>Repository Integration</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : currentMode === 'guided' && !currentLevel ? (
                    <>
                        <button
                            onClick={() => setCurrentMode(null)}
                            className="text-purple-300 hover:text-white mb-8 flex items-center space-x-2"
                        >
                            <ChevronRight className="w-4 h-4 transform rotate-180" />
                            <span>Back to modes</span>
                        </button>

                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-white mb-4">Select Your Level</h2>
                            <p className="text-purple-200 text-lg">Start where you feel most comfortable</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div
                                onClick={() => setCurrentLevel(0)}
                                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer"
                            >
                                <div className="text-3xl font-bold text-blue-400 mb-2">Level 0</div>
                                <h3 className="text-xl font-semibold text-white mb-3">Complete Beginner</h3>
                                <p className="text-purple-200 mb-4">
                                    No testing experience? No problem! Learn the fundamentals of software testing from scratch.
                                </p>
                                <div className="text-sm text-purple-300">
                                    Topics: What is testing, Manual vs Automation, Why Selenium
                                </div>
                            </div>

                            <div
                                onClick={() => setCurrentLevel(1)}
                                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all cursor-pointer"
                            >
                                <div className="text-3xl font-bold text-purple-400 mb-2">Level 1</div>
                                <h3 className="text-xl font-semibold text-white mb-3">Manual Tester</h3>
                                <p className="text-purple-200 mb-4">
                                    Know manual testing but new to automation? Learn to generate Selenium tests from test cases.
                                </p>
                                <div className="text-sm text-purple-300">
                                    Topics: Selenium basics, Cucumber BDD, Test automation
                                </div>
                            </div>
                        </div>
                    </>
                ) : currentMode === 'guided' && currentLevel === 0 ? (
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => setCurrentLevel(null)}
                            className="text-purple-300 hover:text-white mb-8 flex items-center space-x-2"
                        >
                            <ChevronRight className="w-4 h-4 transform rotate-180" />
                            <span>Back to levels</span>
                        </button>

                        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <div className="flex items-center space-x-3 mb-6">
                                <BookOpen className="w-8 h-8 text-blue-400" />
                                <h2 className="text-3xl font-bold text-white">Level 0: Testing Fundamentals</h2>
                            </div>

                            <p className="text-purple-200 mb-6">
                                Welcome to your testing journey! Let's start by understanding what software testing is and why it matters.
                            </p>

                            <button
                                onClick={handleLevel0Continue}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        <span>Start Learning</span>
                                    </>
                                )}
                            </button>

                            {aiResponse && aiResponse.type === 'education' && (
                                <div className="mt-8 bg-black/20 rounded-xl p-6 border border-purple-400/30">
                                    <div className="text-purple-100 whitespace-pre-line leading-relaxed">
                                        {aiResponse.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : currentMode === 'guided' && currentLevel === 1 ? (
                    <div className="max-w-6xl mx-auto">
                        <button
                            onClick={() => setCurrentLevel(null)}
                            className="text-purple-300 hover:text-white mb-8 flex items-center space-x-2"
                        >
                            <ChevronRight className="w-4 h-4 transform rotate-180" />
                            <span>Back to levels</span>
                        </button>

                        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <div className="flex items-center space-x-3 mb-6">
                                <Code className="w-8 h-8 text-purple-400" />
                                <h2 className="text-3xl font-bold text-white">Level 1: Automation Test Generation</h2>
                            </div>

                            <p className="text-purple-200 mb-6">
                                Describe your manual test case, and I'll generate Selenium automation code with explanations.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-purple-200 mb-2 font-medium">Your Test Case</label>
                                    <textarea
                                        value={testCaseInput}
                                        onChange={(e) => setTestCaseInput(e.target.value)}
                                        placeholder="Example: Test login functionality - Navigate to login page, enter username 'testuser@example.com', enter password 'SecurePass123', click login button, verify user is redirected to dashboard and sees welcome message."
                                        className="w-full h-32 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleGenerateAutomation}
                                    disabled={isLoading || !testCaseInput.trim()}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            <span>Generate Automation Code</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {aiResponse && aiResponse.type === 'automation' && (
                                <div className="mt-8 space-y-6">
                                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
                                        <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
                                            <BookOpen className="w-5 h-5 text-blue-400" />
                                            <span>Explanation</span>
                                        </h3>
                                        <div className="text-purple-100 whitespace-pre-line leading-relaxed">
                                            {aiResponse.explanation}
                                        </div>
                                    </div>

                                    <div className="bg-black/30 border border-purple-400/30 rounded-xl p-6">
                                        <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
                                            <FileCode className="w-5 h-5 text-purple-400" />
                                            <span>Generated Code</span>
                                        </h3>
                                        <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-green-300">{aiResponse.code}</code>
                    </pre>
                                    </div>

                                    <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-6">
                                        <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                            <span>Reasoning</span>
                                        </h3>
                                        <div className="text-purple-100 whitespace-pre-line leading-relaxed">
                                            {aiResponse.reasoning}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : currentMode === 'production' ? (
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => setCurrentMode(null)}
                            className="text-purple-300 hover:text-white mb-8 flex items-center space-x-2"
                        >
                            <ChevronRight className="w-4 h-4 transform rotate-180" />
                            <span>Back to modes</span>
                        </button>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Repository Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 sticky top-6">
                                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                                        <GitBranch className="w-5 h-5 text-purple-400" />
                                        <span>Your Repositories</span>
                                    </h3>
                                    <div className="space-y-3">
                                        {repos.map(repo => (
                                            <div
                                                key={repo.id}
                                                onClick={() => setSelectedRepo(repo)}
                                                className={`p-4 rounded-xl cursor-pointer transition-all ${
                                                    selectedRepo?.id === repo.id
                                                        ? 'bg-purple-500/20 border border-purple-400'
                                                        : 'bg-black/20 border border-white/10 hover:border-purple-400/50'
                                                }`}
                                            >
                                                <div className="font-semibold text-white">{repo.name}</div>
                                                <div className="text-sm text-purple-300 mt-1">
                                                    {repo.language} • {repo.updated}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Panel */}
                            <div className="lg:col-span-2">
                                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <Zap className="w-8 h-8 text-purple-400" />
                                        <h2 className="text-3xl font-bold text-white">Production Mode</h2>
                                    </div>

                                    <p className="text-purple-200 mb-6">
                                        Analyze your automation code for improvements, optimizations, and best practices.
                                    </p>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-purple-200 mb-2 font-medium">
                                                Paste Your Code (or select a repository)
                                            </label>
                                            <textarea
                                                value={codeInput}
                                                onChange={(e) => setCodeInput(e.target.value)}
                                                placeholder="Paste your Selenium automation code here..."
                                                className="w-full h-48 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 resize-none font-mono text-sm"
                                            />
                                        </div>

                                        <button
                                            onClick={handleAnalyzeCode}
                                            disabled={isLoading || (!codeInput.trim() && !selectedRepo)}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Analyzing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    <span>Analyze Code</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Analysis Results */}
                                    {aiResponse && aiResponse.type === 'analysis' && (
                                        <div className="space-y-6">
                                            {/* Metrics Dashboard */}
                                            <div className="grid md:grid-cols-4 gap-4">
                                                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                                                    <div className="text-2xl font-bold text-blue-400">
                                                        {aiResponse.metrics?.totalTests}
                                                    </div>
                                                    <div className="text-sm text-purple-200">Total Tests</div>
                                                </div>
                                                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4">
                                                    <div className="text-2xl font-bold text-green-400">
                                                        {aiResponse.metrics?.codeCoverage}
                                                    </div>
                                                    <div className="text-sm text-purple-200">Coverage</div>
                                                </div>
                                                <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-4">
                                                    <div className="text-2xl font-bold text-orange-400">
                                                        {aiResponse.metrics?.redundantCode}
                                                    </div>
                                                    <div className="text-sm text-purple-200">Redundant</div>
                                                </div>
                                                <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4">
                                                    <div className="text-2xl font-bold text-purple-400">
                                                        {aiResponse.metrics?.avgExecutionTime}
                                                    </div>
                                                    <div className="text-sm text-purple-200">Avg Time</div>
                                                </div>
                                            </div>

                                            {/* Issues List */}
                                            <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6">
                                                <h3 className="text-xl font-semibold text-white mb-4">Issues Found</h3>
                                                <div className="space-y-4">
                                                    {aiResponse.issues?.map((issue, idx) => (
                                                        <div key={idx} className="bg-black/20 rounded-lg p-4">
                                                            <div className="flex items-start space-x-3">
                                                                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                    issue.severity === 'high' ? 'bg-red-500 text-white' :
                                                                        issue.severity === 'medium' ? 'bg-orange-500 text-white' :
                                                                            'bg-yellow-500 text-black'
                                                                }`}>
                                                                    {issue.severity.toUpperCase()}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-white mb-1">{issue.title}</div>
                                                                    <div className="text-purple-200 text-sm mb-2">{issue.description}</div>
                                                                    <div className="text-purple-300 text-xs mb-1">
                                                                        📍 {issue.location}
                                                                    </div>
                                                                    <div className="text-green-300 text-sm">
                                                                        💡 {issue.suggestion}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Improvements Section */}
                                            <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
                                                <h3 className="text-xl font-semibold text-white mb-4">Recommended Improvements</h3>
                                                <div className="text-purple-100 whitespace-pre-line leading-relaxed">
                                                    {aiResponse.improvements}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

