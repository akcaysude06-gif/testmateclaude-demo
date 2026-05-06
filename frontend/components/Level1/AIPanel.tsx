import React from 'react';
import { Wand2, AlertCircle } from 'lucide-react';

interface AIPanelProps {
    testDescription: string;
    onTestDescriptionChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    error: string | null;
    isLlamaAvailable: boolean;
}

const AIPanel: React.FC<AIPanelProps> = ({
    testDescription,
    onTestDescriptionChange,
    onGenerate,
    isGenerating,
    error,
    isLlamaAvailable,
}) => (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden h-full flex flex-col">

        <div className="border-b border-white/10 px-5 py-3.5 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-white">Try It — Describe a Test Scenario</span>
        </div>

        <div className="flex-1 p-5 flex flex-col">
            <div className="flex-1 rounded-lg border border-white/10 bg-black/20">
                <textarea
                    value={testDescription}
                    onChange={e => onTestDescriptionChange(e.target.value)}
                    placeholder={`Write your test scenario in plain English...\n\nExample:\nNavigate to https://example.com/login\nEnter username 'testuser'\nEnter password 'password123'\nClick the 'Sign In' button\nVerify redirect to dashboard`}
                    className="w-full h-full min-h-[260px] bg-transparent text-white text-sm font-mono
                               placeholder-slate-600 focus:outline-none resize-none p-4 leading-relaxed"
                    disabled={isGenerating}
                />
            </div>

            {testDescription && (
                <div className="mt-2">
                    <span className={`text-xs ${testDescription.length > 2000 ? 'text-red-400' : 'text-slate-600'}`}>
                        {testDescription.length} / 2000
                    </span>
                    {testDescription.length > 2000 && (
                        <span className="text-xs text-red-400 ml-2">Too long — please shorten</span>
                    )}
                </div>
            )}

            {error && (
                <div className="mt-3 flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            <button
                onClick={onGenerate}
                disabled={isGenerating || !testDescription.trim() || !isLlamaAvailable || testDescription.length > 2000}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-5 rounded-lg
                           bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-slate-600
                           disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
                {isGenerating ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating with Llama 3…
                    </>
                ) : (
                    <>
                        <Wand2 className="w-4 h-4" />
                        Generate Selenium Code
                    </>
                )}
            </button>

            <p className="mt-2.5 text-center text-xs text-slate-600">
                {isGenerating
                    ? 'This may take 10–15 seconds…'
                    : 'The more detail you provide, the better the result'}
            </p>
        </div>
    </div>
);

export default AIPanel;
