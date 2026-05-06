import React, { useState } from 'react';
import { Download, Copy, Check, Code, RotateCcw, MousePointerClick } from 'lucide-react';

interface CodeDisplayProps {
    code: {
        code: string;
        explanation: string;
        steps: string[];
        line_explanations: Record<string, string>;
        language: string;
        model: string;
    };
    onReset: () => void;
}

// ── Mini quiz ──────────────────────────────────────────────────────────────────
const QUIZ: { q: string; options: string[]; correct: number; hint: string }[] = [
    {
        q: 'What does WebDriverWait do in this script?',
        options: [
            'Pauses the test for a fixed number of seconds',
            'Waits until a specific condition is met before the test continues',
            'Checks whether the browser window is currently visible',
        ],
        correct: 1,
        hint: 'It polls until a condition is true (e.g. element appears) — faster and more reliable than a fixed sleep.',
    },
    {
        q: 'Why is driver.quit() placed inside a finally block?',
        options: [
            'To restart the browser for the next test run',
            'To save the test output to a log file',
            'To ensure the browser closes even if the test fails midway',
        ],
        correct: 2,
        hint: 'finally always runs — even on failure — so the browser closes cleanly instead of staying open.',
    },
];

const MiniQuiz: React.FC = () => {
    const [answers, setAnswers]   = useState<(number | null)[]>([null, null]);
    const [revealed, setRevealed] = useState<boolean[]>([false, false]);

    const handleAnswer = (qi: number, oi: number) => {
        if (revealed[qi]) return;
        setAnswers(prev  => { const a = [...prev];  a[qi] = oi;   return a; });
        setRevealed(prev => { const r = [...prev];  r[qi] = true; return r; });
    };

    const allDone = revealed.every(Boolean);
    const score   = QUIZ.filter((q, i) => answers[i] === q.correct).length;

    return (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Step 5 · Quick Check</p>
                    <h3 className="text-sm font-semibold text-white">Test your understanding</h3>
                </div>
                {allDone && (
                    <span className={`text-xs px-3 py-1.5 rounded-full border ${
                        score === QUIZ.length
                            ? 'text-green-300 border-green-500/30 bg-green-500/10'
                            : 'text-slate-300 border-white/20 bg-white/5'
                    }`}>
                        {score} / {QUIZ.length} correct
                    </span>
                )}
            </div>

            <div className="space-y-7">
                {QUIZ.map((q, qi) => (
                    <div key={qi}>
                        <p className="text-sm text-slate-200 mb-3">{q.q}</p>
                        <div className="space-y-2">
                            {q.options.map((opt, oi) => {
                                const chosen    = answers[qi] === oi;
                                const isCorrect = oi === q.correct;
                                const show      = revealed[qi];

                                let cls = 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/8 cursor-pointer';
                                if (show) {
                                    if (isCorrect)     cls = 'border-green-500/40 bg-green-500/10 text-green-300 cursor-default';
                                    else if (chosen)   cls = 'border-red-500/40 bg-red-500/10 text-red-300 cursor-default';
                                    else               cls = 'border-white/5 bg-white/2 text-slate-600 cursor-default opacity-50';
                                }

                                return (
                                    <button
                                        key={oi}
                                        onClick={() => handleAnswer(qi, oi)}
                                        disabled={show}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${cls}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {revealed[qi] && (
                            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed pl-1">
                                <span className="text-slate-400">Why: </span>{q.hint}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────────
const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, onReset }) => {
    const [copied, setCopied]       = useState(false);
    const [hoveredLine, setHovered] = useState<number | null>(null);
    const [pinnedLine, setPinned]   = useState<number | null>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(code.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([code.code], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'selenium_test.py';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const lines            = code.code.split('\n');
    const explanations     = code.line_explanations ?? {};
    const hasExplanations  = Object.keys(explanations).length > 0;
    const activeLine       = pinnedLine ?? hoveredLine;
    const activeExplanation = activeLine !== null ? explanations[String(activeLine)] : null;

    const handleLineClick = (lineNum: number) => {
        if (!explanations[String(lineNum)]) return;
        setPinned(prev => prev === lineNum ? null : lineNum);
    };

    const hasSteps       = Array.isArray(code.steps) && code.steps.length > 0;
    const hasExplanation = !!code.explanation;

    return (
        <div>
            {/* ── Summary strip ─────────────────────────────────────────────── */}
            {(hasExplanation || hasSteps) && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-5 mb-6">
                    <div className={`grid gap-6 ${hasExplanation && hasSteps ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {hasExplanation && (
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                                    What this script does
                                </p>
                                <p className="text-sm text-slate-400 leading-relaxed">{code.explanation}</p>
                            </div>
                        )}
                        {hasSteps && (
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                                    Step breakdown
                                </p>
                                <ol className="space-y-1.5">
                                    {code.steps.map((step, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                                            <span className="flex-shrink-0 text-xs font-mono text-slate-600 mt-0.5 w-4">
                                                {i + 1}.
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Code + line explanation grid ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left — line explanation + actions */}
                <div className="lg:col-span-1">
                    <div className="bg-white/5 rounded-xl border border-white/10 p-5 sticky top-6 flex flex-col gap-4">

                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
                                Generated with
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                                <span className="text-sm text-white font-medium">{code.model}</span>
                            </div>
                        </div>

                        <div className="border-t border-white/8" />

                        {/* Line explanation */}
                        <div className="min-h-[100px]">
                            {activeExplanation ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-mono text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                                            line {activeLine}
                                        </span>
                                        {pinnedLine === activeLine && (
                                            <span className="text-xs text-purple-400">pinned</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-200 leading-relaxed">{activeExplanation}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-start gap-2 text-slate-600">
                                    <MousePointerClick className="w-4 h-4" />
                                    <p className="text-xs leading-relaxed">
                                        {hasExplanations
                                            ? 'Hover over a line to see its explanation. Click to pin it.'
                                            : 'No line explanations available for this code.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-white/8" />

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleCopy}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                                           bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-colors"
                            >
                                {copied
                                    ? <><Check className="w-4 h-4 text-green-400" /> Copied!</>
                                    : <><Copy className="w-4 h-4" /> Copy Code</>}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                                           bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-colors"
                            >
                                <Download className="w-4 h-4" /> Download .py
                            </button>
                            <button
                                onClick={onReset}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                                           bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20
                                           text-sm text-purple-300 transition-colors mt-1"
                            >
                                <RotateCcw className="w-4 h-4" /> Generate New Code
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right — interactive code block */}
                <div className="lg:col-span-2">
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <div className="border-b border-white/10 px-5 py-3.5 flex items-center gap-3">
                            <Code className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-white">Generated Selenium Code</span>
                            <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                                Python
                            </span>
                            {hasExplanations && (
                                <span className="ml-auto text-xs text-slate-600">hover a line for explanation</span>
                            )}
                        </div>

                        <div className="overflow-x-auto max-h-[560px] overflow-y-auto bg-black/30">
                            <div className="p-2 font-mono text-sm leading-relaxed">
                                {lines.map((line, i) => {
                                    const lineNum  = i + 1;
                                    const hasExpl  = !!explanations[String(lineNum)];
                                    const isActive = activeLine === lineNum;
                                    const isPinned = pinnedLine === lineNum;

                                    return (
                                        <div
                                            key={i}
                                            onMouseEnter={() => setHovered(lineNum)}
                                            onMouseLeave={() => setHovered(null)}
                                            onClick={() => handleLineClick(lineNum)}
                                            className={`flex items-start rounded px-2 py-[2px] transition-colors group
                                                ${hasExpl ? 'cursor-pointer' : 'cursor-default'}
                                                ${isPinned
                                                    ? 'bg-purple-500/15'
                                                    : isActive && hasExpl
                                                        ? 'bg-white/6'
                                                        : 'hover:bg-white/4'
                                                }`}
                                        >
                                            <span className={`select-none text-xs w-8 text-right flex-shrink-0 mr-4 pt-px transition-colors
                                                ${isActive && hasExpl ? 'text-purple-400' : 'text-slate-700'}`}>
                                                {lineNum}
                                            </span>
                                            <pre className={`whitespace-pre flex-1 transition-colors
                                                ${isActive && hasExpl ? 'text-white' : 'text-slate-300'}`}>
                                                {line || ' '}
                                            </pre>
                                            <span className={`flex-shrink-0 w-1 h-1 rounded-full mt-2 ml-2 transition-opacity
                                                ${hasExpl
                                                    ? isActive ? 'bg-purple-400 opacity-100' : 'bg-slate-600 opacity-40 group-hover:opacity-80'
                                                    : 'opacity-0'}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Mini quiz ─────────────────────────────────────────────────── */}
            <MiniQuiz />
        </div>
    );
};

export default CodeDisplay;
