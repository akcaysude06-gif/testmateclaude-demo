import React, { useState, useEffect } from 'react';
import { ChevronRight, AlertCircle, Check } from 'lucide-react';
import CodeDisplay from './CodeDisplay';
import WhyAutomation from './WhyAutomation';
import ToolLandscape from './ToolLandscape';
import WhatNotToAutomate from './WhatNotToAutomate';
import ScenarioPicker from './ScenarioPicker';
import { apiService } from '../../services/api';
type Phase = 'why' | 'tools' | 'what-not' | 'generate' | 'results';

const PHASES: { id: Phase; label: string }[] = [
    { id: 'why',       label: 'Why Automation' },
    { id: 'tools',     label: 'The Tools' },
    { id: 'what-not',  label: 'What to Automate' },
    { id: 'generate',  label: 'See It Live' },
    { id: 'results',   label: 'Review & Practice' },
];

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

// ── Progress stepper ──────────────────────────────────────────────────────────
const Stepper: React.FC<{ current: Phase }> = ({ current }) => {
    const currentIdx = PHASES.findIndex(p => p.id === current);
    return (
        <div className="flex items-center mb-10">
            {PHASES.map((phase, i) => {
                const done   = i < currentIdx;
                const active = i === currentIdx;
                return (
                    <React.Fragment key={phase.id}>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                active ? 'bg-purple-600 border border-purple-500' :
                                done   ? 'bg-white/10 border border-white/20' :
                                         'bg-white/5 border border-white/10'
                            }`}>
                                {done ? (
                                    <Check className="w-3 h-3 text-slate-300" />
                                ) : (
                                    <span className={`text-xs font-mono leading-none ${active ? 'text-white' : 'text-slate-600'}`}>
                                        {i + 1}
                                    </span>
                                )}
                            </div>
                            <span className={`text-xs whitespace-nowrap hidden sm:inline ${
                                active ? 'text-white' : done ? 'text-slate-500' : 'text-slate-700'
                            }`}>
                                {phase.label}
                            </span>
                        </div>
                        {i < PHASES.length - 1 && (
                            <div className={`flex-1 h-px mx-3 min-w-[12px] ${i < currentIdx ? 'bg-white/20' : 'bg-white/8'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────────
const Level1: React.FC<Level1Props> = ({ onBack }) => {
    const [phase, setPhase]               = useState<Phase>('why');
    const [selectedScenarioId, setSelId]  = useState<string | null>(null);
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

    const currentIdx = PHASES.findIndex(p => p.id === phase);

    const handleBack = () => {
        if (phase === 'why') onBack();
        else setPhase(PHASES[currentIdx - 1].id);
    };

    const advance = (next: Phase) => setPhase(next);

    const generateCode = async (id: string, description: string) => {
        if (llamaAvailable === false) {
            setError('Llama 3 is not running. Please start Ollama with: ollama serve');
            return;
        }

        setSelId(id);
        setGenerating(true);
        setError(null);
        setGenerated(null);

        try {
            const response = await apiService.generateAutomationCode(description);
            setGenerated(response);
            setPhase('results');
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
            setSelId(null);
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => {
        setGenerated(null);
        setError(null);
        setSelId(null);
        setPhase('generate');
    };

    return (
        <div style={{ padding: '1.5rem 1.25rem' }}>
        <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <button
                onClick={handleBack}
                className="text-purple-300 hover:text-white mb-6 flex items-center space-x-2 transition-colors"
            >
                <ChevronRight className="w-4 h-4 transform rotate-180" />
                <span>{phase === 'why' ? 'Back to levels' : 'Back'}</span>
            </button>

            <div className="flex items-end justify-between mb-6">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Level 1</p>
                    <h1 className="text-3xl font-light text-white tracking-tight">
                        Introduction to Test Automation
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Learn why it matters, explore the tools, and see Selenium in action.
                    </p>
                </div>

                {/* Llama status — only visible on the generate/results phase */}
                {(phase === 'generate' || phase === 'results') && (
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
                )}
            </div>

            {/* Stepper */}
            <Stepper current={phase} />

            {/* Llama offline warning — generate phase only */}
            {phase === 'generate' && llamaAvailable === false && (
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

            {/* Phase content */}
            {phase === 'why' && (
                <WhyAutomation onContinue={() => advance('tools')} />
            )}

            {phase === 'tools' && (
                <ToolLandscape onContinue={() => advance('what-not')} />
            )}

            {phase === 'what-not' && (
                <WhatNotToAutomate onContinue={() => advance('generate')} />
            )}

            {phase === 'generate' && (
                <ScenarioPicker
                    onSelect={generateCode}
                    isGenerating={isGenerating}
                    selectedId={selectedScenarioId}
                    error={error}
                    isLlamaAvailable={llamaAvailable !== false}
                />
            )}

            {phase === 'results' && generatedCode && (
                <CodeDisplay code={generatedCode} onReset={handleReset} />
            )}
        </div>
        </div>
    );
};

export default Level1;
