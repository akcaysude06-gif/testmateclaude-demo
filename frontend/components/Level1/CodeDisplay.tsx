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

const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, onReset }) => {
    const [copied, setCopied]         = useState(false);
    const [hoveredLine, setHovered]   = useState<number | null>(null);
    const [pinnedLine, setPinned]     = useState<number | null>(null);

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

    const lines = code.code.split('\n');
    const explanations = code.line_explanations ?? {};
    const hasExplanations = Object.keys(explanations).length > 0;

    // The active line for the side panel: pinned takes priority, then hover
    const activeLine = pinnedLine ?? hoveredLine;
    const activeExplanation = activeLine !== null ? explanations[String(activeLine)] : null;

    const handleLineClick = (lineNum: number) => {
        if (!explanations[String(lineNum)]) return;
        setPinned(prev => prev === lineNum ? null : lineNum);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — explanation side panel (1/3) */}
            <div className="lg:col-span-1">
                <div className="bg-white/5 rounded-xl border border-white/10 p-5 sticky top-6 flex flex-col gap-4">

                    {/* Model badge */}
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Generated with</p>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                            <span className="text-sm text-white font-medium">{code.model}</span>
                        </div>
                    </div>

                    <div className="border-t border-white/8" />

                    {/* Line explanation panel */}
                    <div className="min-h-[120px]">
                        {activeExplanation ? (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-mono text-slate-500 bg-white/5 border border-white/10
                                                     px-2 py-0.5 rounded">
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
                                        ? 'Hover over a line to see its explanation.\nClick to pin it.'
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

            {/* Right — interactive code block (2/3) */}
            <div className="lg:col-span-2">
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">

                    {/* Code panel header */}
                    <div className="border-b border-white/10 px-5 py-3.5 flex items-center gap-3">
                        <Code className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-white">Generated Selenium Code</span>
                        <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">Python</span>
                        {hasExplanations && (
                            <span className="ml-auto text-xs text-slate-600">hover a line for explanation</span>
                        )}
                    </div>

                    {/* Line-by-line code */}
                    <div className="overflow-x-auto max-h-[560px] overflow-y-auto bg-black/30">
                        <div className="p-2 font-mono text-sm leading-relaxed">
                            {lines.map((line, i) => {
                                const lineNum    = i + 1;
                                const hasExpl    = !!explanations[String(lineNum)];
                                const isActive   = activeLine === lineNum;
                                const isPinned   = pinnedLine === lineNum;

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
                                        {/* Line number */}
                                        <span className={`select-none text-xs w-8 text-right flex-shrink-0 mr-4 pt-px transition-colors
                                            ${isActive && hasExpl ? 'text-purple-400' : 'text-slate-700'}`}>
                                            {lineNum}
                                        </span>

                                        {/* Code text */}
                                        <pre className={`whitespace-pre flex-1 transition-colors
                                            ${isActive && hasExpl ? 'text-white' : 'text-slate-300'}`}>
                                            {line || ' '}
                                        </pre>

                                        {/* Indicator dot for lines with explanation */}
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
    );
};

export default CodeDisplay;
