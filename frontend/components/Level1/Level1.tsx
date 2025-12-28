import React, { useState, useEffect } from 'react';
import { ChevronRight, Upload, FileText, Sparkles, AlertCircle } from 'lucide-react';
import InfoPanel from './InfoPanel';
import AIPanel from './AIPanel';
import CodeDisplay from './CodeDisplay';
import { apiService } from '../../services/api';

interface Level1Props {
    onBack: () => void;
}

interface GeneratedCode {
    code: string;
    explanation: string;
    steps: string[];
    language: string;
    model: string;
}

const Level1: React.FC<Level1Props> = ({ onBack }) => {
    const [testDescription, setTestDescription] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [llamaAvailable, setLlamaAvailable] = useState<boolean | null>(null);

    // Check Llama availability on mount
    useEffect(() => {
        checkLlamaHealth();
    }, []);

    const checkLlamaHealth = async () => {
        try {
            const health = await apiService.checkLlamaHealth();
            setLlamaAvailable(health.llama3_available);
            if (!health.llama3_available) {
                setError('Llama 3 is not available. Please start Ollama with: ollama serve');
            }
        } catch (err) {
            console.error('Health check failed:', err);
            setLlamaAvailable(false);
            setError('Cannot connect to backend. Make sure it\'s running.');
        }
    };

    const handleGenerateCode = async () => {
        // Character limit check
        if (testDescription.length > 2000) {
            setError('Test description is too long. Please keep it under 2000 characters.');
            return;
        }

        if (!testDescription.trim() && !uploadedFile) {
            setError('Please provide a test description or upload a file');
            return;
        }

        // Check Llama availability first
        if (llamaAvailable === false) {
            setError('Llama 3 is not running. Please start Ollama with: ollama serve');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedCode(null);

        try {
            let finalDescription = testDescription;

            if (uploadedFile) {
                const fileContent = await uploadedFile.text();
                // Limit file content as well
                if (fileContent.length > 2000) {
                    setError('File content is too long. Please use a smaller file (under 2000 characters).');
                    setIsGenerating(false);
                    return;
                }
                finalDescription = `Based on this test scenario:\n\n${fileContent}`;
            }

            const response = await apiService.generateAutomationCode(finalDescription);
            setGeneratedCode(response);
        } catch (err: any) {
            console.error('Code generation error:', err);

            let errorMessage = 'Failed to generate code. ';

            if (err.message.includes('timeout')) {
                errorMessage = '⏱️ Request timed out. Try a shorter description or check if Ollama is running with "ollama serve".';
            } else if (err.response?.status === 504) {
                errorMessage = '⏱️ Generation took too long. Please try with a shorter, more focused test description.';
            } else if (err.response?.status === 503) {
                errorMessage = '🔌 Llama 3 is not available. Make sure Ollama is running: ollama serve';
                setLlamaAvailable(false);
            } else {
                errorMessage = err.response?.data?.detail || err.message || 'Unknown error occurred.';
            }

            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = (file: File) => {
        setUploadedFile(file);
        setError(null);
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
    };

    const handleReset = () => {
        setTestDescription('');
        setUploadedFile(null);
        setGeneratedCode(null);
        setError(null);
    };

    return (
        <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <button
                onClick={onBack}
                className="text-purple-300 hover:text-white mb-6 flex items-center space-x-2 transition-colors"
            >
                <ChevronRight className="w-4 h-4 transform rotate-180" />
                <span>Back to levels</span>
            </button>

            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Level 1: AI-Powered Code Generation
                        </h1>
                        <p className="text-green-100">
                            Describe your test scenario and let Llama 3 generate Selenium code
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {llamaAvailable === null ? (
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        ) : llamaAvailable ? (
                            <>
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-100 text-sm">Llama 3 Ready</span>
                            </>
                        ) : (
                            <>
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <span className="text-red-200 text-sm">Llama 3 Offline</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning if Llama is not available */}
            {llamaAvailable === false && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-300 font-semibold mb-1">Llama 3 Not Running</p>
                        <p className="text-red-200 text-sm">
                            Please start Ollama in a terminal: <code className="bg-black/30 px-2 py-1 rounded">ollama serve</code>
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

            {/* Main Split Screen Layout */}
            {!generatedCode ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side - Info Panel (1/3 width) */}
                    <div className="lg:col-span-1">
                        <InfoPanel />
                    </div>

                    {/* Right Side - AI Panel (2/3 width) */}
                    <div className="lg:col-span-2">
                        <AIPanel
                            testDescription={testDescription}
                            onTestDescriptionChange={setTestDescription}
                            uploadedFile={uploadedFile}
                            onFileUpload={handleFileUpload}
                            onRemoveFile={handleRemoveFile}
                            onGenerate={handleGenerateCode}
                            isGenerating={isGenerating}
                            error={error}
                            isLlamaAvailable={llamaAvailable !== false}
                        />
                    </div>
                </div>
            ) : (
                <CodeDisplay code={generatedCode} onReset={handleReset} />
            )}
        </div>
    );
};

export default Level1;