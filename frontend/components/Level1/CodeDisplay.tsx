import React, { useState } from 'react';
import { Download, Copy, Check, Code, BookOpen, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface CodeDisplayProps {
    code: {
        code: string;
        explanation: string;
        steps: string[];
        language: string;
        model: string;
    };
    onReset: () => void;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, onReset }) => {
    const [copied, setCopied] = useState(false);
    const [showExplanation, setShowExplanation] = useState(true);

    const handleCopy = () => {
        navigator.clipboard.writeText(code.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([code.code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selenium_test.py';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Explanation (1/3) */}
            <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-blue-400/30 p-6 sticky top-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                            <h3 className="font-semibold text-white">How It Works</h3>
                        </div>
                        <button
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="text-blue-400 hover:text-blue-300"
                        >
                            {showExplanation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                    </div>

                    {showExplanation && (
                        <>
                            {code.steps && code.steps.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    {code.steps.map((step, index) => (
                                        <div key={index} className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 text-sm font-semibold">
                                                {index + 1}
                                            </div>
                                            <p className="text-purple-200 text-sm flex-1 pt-0.5">
                                                {step.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-blue-500/10 rounded-lg p-3 mb-4">
                                <p className="text-xs text-blue-200">
                                    ✨ Generated with <span className="font-semibold">{code.model}</span>
                                </p>
                            </div>
                        </>
                    )}

                    <button
                        onClick={onReset}
                        className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-3 rounded-xl transition-all"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Generate New Code</span>
                    </button>
                </div>
            </div>

            {/* Right Side - Code Display (2/3) */}
            <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-green-400/30 overflow-hidden">
                    {/* Code Header */}
                    <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-white/10 p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Code className="w-5 h-5 text-green-400" />
                            <h3 className="font-semibold text-white">Generated Selenium Code</h3>
                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                                Python
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleCopy}
                                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all text-sm"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-400" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDownload}
                                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all text-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                            </button>
                        </div>
                    </div>

                    {/* Code Content - Simple Pre/Code Block */}
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <pre className="p-6 text-sm">
                            <code className="text-green-300 font-mono whitespace-pre">
                                {code.code}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeDisplay;