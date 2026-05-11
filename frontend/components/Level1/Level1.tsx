import React, { useState, useEffect } from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import CodeDisplay from './CodeDisplay';
import GenerateScreen from './GenerateScreen';
import { apiService } from '../../services/api';

interface Level1Props {
    onBack: () => void;
}

interface GeneratedCode {
    code: string;
    explanation: string;
    steps: string[];
    line_explanations: Record<string, string>;
    language: string;
    model: string;
}

const Level1: React.FC<Level1Props> = ({ onBack }) => {
    const [generatedCode, setGenerated]   = useState<GeneratedCode | null>(null);
    const [isGenerating, setGenerating]   = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [llamaAvailable, setLlama]      = useState<boolean | null>(null);

    useEffect(() => { checkLlamaHealth(); }, []);

    const checkLlamaHealth = async () => {
        try {
            const health = await apiService.checkLlamaHealth();
            setLlama(health.llama3_available);
            if (!health.llama3_available) setError('Llama 3 is not available. Please start Ollama with: ollama serve');
        } catch {
            setLlama(false);
            setError("Cannot connect to backend. Make sure it's running.");
        }
    };

    const generateCode = async (description: string) => {
        if (llamaAvailable === false) {
            setError('Llama 3 is not running. Please start Ollama with: ollama serve');
            return;
        }

        setGenerating(true);
        setError(null);
        setGenerated(null);

        try {
            const response = await apiService.generateAutomationCode(description);
            setGenerated(response);
        } catch (err: any) {
            let msg: string;
            if (err.message?.includes('timeout') || err.response?.status === 504) {
                msg = 'Request timed out. Please try again or check if Ollama is running with "ollama serve".';
            } else if (err.response?.status === 503) {
                msg = 'Llama 3 is not available. Make sure Ollama is running: ollama serve';
                setLlama(false);
            } else {
                msg = err.response?.data?.detail || err.message || 'Unknown error occurred.';
            }
            setError(msg);
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => {
        setGenerated(null);
        setError(null);
    };

    return (
        <div style={{ padding: '1.5rem 1.25rem' }}>
        <div className="max-w-[1600px] mx-auto">
            <button
                onClick={generatedCode ? handleReset : onBack}
                className="text-purple-300 hover:text-white mb-6 flex items-center space-x-2 transition-colors"
            >
                <ChevronRight className="w-4 h-4 transform rotate-180" />
                <span>{generatedCode ? 'Back to Generate' : 'Back to levels'}</span>
            </button>

            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Level 1</p>
                    <h1 className="text-3xl font-light text-white tracking-tight">
                        Generate Selenium Code
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Describe your test scenario or upload a file — get Selenium code instantly.
                    </p>
                </div>

                <div className="flex items-center gap-2 pb-1">
                    {llamaAvailable === null ? (
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" />
                    ) : llamaAvailable ? (
                        <>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
                            <span className="text-slate-400 text-xs">Llama 3 ready</span>
                        </>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                            <span className="text-red-400 text-xs">Llama 3 offline</span>
                        </>
                    )}
                </div>
            </div>

            {llamaAvailable === false && !generatedCode && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-300 font-semibold mb-1">Llama 3 Not Running</p>
                        <p className="text-red-200 text-sm">
                            Please start Ollama in a terminal:{' '}
                            <code className="bg-black/30 px-2 py-1 rounded">ollama serve</code>
                        </p>
                        <button
                            onClick={checkLlamaHealth}
                            className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                        >
                            Check again
                        </button>
                    </div>
                </div>
            )}

            {!generatedCode ? (
                <GenerateScreen
                    onGenerate={generateCode}
                    isGenerating={isGenerating}
                    error={error}
                    isLlamaAvailable={llamaAvailable !== false}
                />
            ) : (
                <CodeDisplay code={generatedCode} onReset={handleReset} />
            )}
        </div>
        </div>
    );
};

export default Level1;
