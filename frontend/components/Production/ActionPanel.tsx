import React, { useState } from 'react';
import { TestTube, Wand2, Sparkles, Send, Zap, FileText } from 'lucide-react';
import { apiService } from '../../services/api';

interface Repository {
    id: number;
    name: string;
    full_name: string;
}

interface ActionPanelProps {
    selectedRepo: Repository | null;
    workMode: 'whole-project' | 'specific-files' | null;
    selectedFiles: string[];
}

type ActionType = 'analyze' | 'improve' | 'generate' | null;

const ActionPanel: React.FC<ActionPanelProps> = ({
                                                     selectedRepo,
                                                     workMode,
                                                     selectedFiles
                                                 }) => {
    const [currentAction, setCurrentAction] = useState<ActionType>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [generatePrompt, setGeneratePrompt] = useState('');

    const handleActionClick = async (action: ActionType) => {
        if (action === 'generate') {
            setCurrentAction(action);
            return;
        }

        setCurrentAction(action);
        setIsProcessing(true);
        setResult(null);

        try {
            const context = `Repository: ${selectedRepo?.full_name}\nScope: ${workMode === 'whole-project' ? 'Whole Project' : `${selectedFiles.length} specific files`}`;

            const response = await apiService.analyzeCode('', context);

            setResult({
                type: action,
                content: response.analysis,
                suggestions: response.suggestions
            });
        } catch (error: any) {
            console.error('Action failed:', error);
            setResult({
                type: 'error',
                content: error.response?.data?.detail || 'Failed to process request'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerate = async () => {
        if (!generatePrompt.trim()) return;

        setIsProcessing(true);
        setResult(null);

        try {
            const response = await apiService.generateTest({
                repo_name: selectedRepo?.full_name || '',
                file_path: selectedFiles[0] || '',
                code_snippet: '',
                user_request: generatePrompt
            });

            setResult({
                type: 'generate',
                content: response.code,
                explanation: response.explanation
            });
        } catch (error: any) {
            console.error('Generation failed:', error);
            setResult({
                type: 'error',
                content: error.response?.data?.detail || 'Failed to generate test'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCustomPrompt = async () => {
        if (!userPrompt.trim()) return;

        setIsProcessing(true);
        setCurrentAction(null);
        setResult(null);

        try {
            const context = `Repository: ${selectedRepo?.full_name}\nUser Question: ${userPrompt}`;
            const response = await apiService.analyzeCode('', context);

            setResult({
                type: 'custom',
                content: response.analysis
            });
        } catch (error: any) {
            setResult({
                type: 'error',
                content: error.response?.data?.detail || 'Failed to process request'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden h-[calc(100vh-300px)] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10 p-4">
                <h3 className="font-semibold text-white">AI Actions & Results</h3>
                <p className="text-xs text-purple-200 mt-1">
                    {!selectedRepo
                        ? 'Select a repository and work scope'
                        : !workMode
                            ? 'Choose a work scope to continue'
                            : 'Choose an action or ask TestMate anything'
                    }
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {!selectedRepo || !workMode ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Zap className="w-16 h-16 text-purple-400 mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Ready for AI Assistance
                        </h3>
                        <p className="text-purple-300 max-w-md">
                            {!selectedRepo
                                ? 'Select a repository to get started'
                                : 'Choose a work scope (whole project or specific files) to enable AI actions'
                            }
                        </p>
                    </div>
                ) : result ? (
                    /* Show Results */
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-green-400" />
                                <span>
                                    {result.type === 'analyze' && 'Analysis Report'}
                                    {result.type === 'improve' && 'Improvement Recommendations'}
                                    {result.type === 'generate' && 'Generated Test Code'}
                                    {result.type === 'custom' && 'AI Response'}
                                    {result.type === 'error' && 'Error'}
                                </span>
                            </h4>
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setCurrentAction(null);
                                    setGeneratePrompt('');
                                }}
                                className="text-sm text-purple-300 hover:text-white transition-colors"
                            >
                                ← Back to actions
                            </button>
                        </div>

                        <div className={`bg-white/5 border rounded-xl p-6 ${
                            result.type === 'error'
                                ? 'border-red-400/30'
                                : result.type === 'generate'
                                    ? 'border-green-400/30'
                                    : 'border-blue-400/30'
                        }`}>
                            {result.type === 'generate' ? (
                                <div>
                                    <pre className="bg-black/30 p-4 rounded-lg overflow-x-auto mb-4">
                                        <code className="text-green-300 text-sm font-mono">
                                            {result.content}
                                        </code>
                                    </pre>
                                    {result.explanation && (
                                        <p className="text-purple-200 text-sm">
                                            {result.explanation}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-purple-100 whitespace-pre-wrap text-sm leading-relaxed">
                                        {result.content}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : isProcessing ? (
                    /* Loading State */
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-300 text-lg">
                            {currentAction === 'analyze' && 'Analyzing test structure...'}
                            {currentAction === 'improve' && 'Generating improvement suggestions...'}
                            {currentAction === 'generate' && 'Generating test code...'}
                            {!currentAction && 'Processing your request...'}
                        </p>
                        <p className="text-purple-400 text-sm mt-2">
                            This may take a few seconds
                        </p>
                    </div>
                ) : currentAction === 'generate' ? (
                    /* Generate Input Form */
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">
                                What would you like to generate?
                            </h3>
                            <p className="text-purple-300">
                                Describe the test scenario you need
                            </p>
                        </div>

                        <textarea
                            value={generatePrompt}
                            onChange={(e) => setGeneratePrompt(e.target.value)}
                            placeholder="E.g., Generate a test for the login functionality that checks valid credentials, invalid password, and account lockout after 3 failed attempts..."
                            className="w-full h-48 bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 resize-none"
                        />

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setCurrentAction(null)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 px-6 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!generatePrompt.trim()}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center space-x-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                <span>Generate Test</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Action Buttons */
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">
                                How can TestMate help?
                            </h3>
                            <p className="text-purple-300 text-sm">
                                Choose a quick action or ask anything below
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={() => handleActionClick('analyze')}
                                className="w-full group bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border-2 border-blue-400/30 hover:border-blue-400 rounded-xl p-4 transition-all text-left"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="bg-blue-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <TestTube className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white mb-1">
                                            Analyze Test Structure
                                        </h4>
                                        <p className="text-xs text-blue-200">
                                            Review existing tests, identify gaps, and get insights on test coverage
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleActionClick('improve')}
                                className="w-full group bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border-2 border-purple-400/30 hover:border-purple-400 rounded-xl p-4 transition-all text-left"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="bg-purple-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <Wand2 className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white mb-1">
                                            Improve Test Structure
                                        </h4>
                                        <p className="text-xs text-purple-200">
                                            Get recommendations to enhance test quality, maintainability, and coverage
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleActionClick('generate')}
                                className="w-full group bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border-2 border-green-400/30 hover:border-green-400 rounded-xl p-4 transition-all text-left"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="bg-green-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white mb-1">
                                            Generate New Tests
                                        </h4>
                                        <p className="text-xs text-green-200">
                                            Create comprehensive Selenium tests for your code automatically
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Custom Prompt (only show when no action is selected) */}
            {!currentAction && !result && selectedRepo && workMode && (
                <div className="border-t border-white/10 p-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCustomPrompt()}
                            placeholder="Or ask: How else can TestMate help with testing?"
                            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/70 focus:outline-none focus:border-purple-400 text-sm"
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleCustomPrompt}
                            disabled={isProcessing || !userPrompt.trim()}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionPanel;