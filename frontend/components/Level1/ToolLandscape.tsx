import React from 'react';
import { ChevronRight } from 'lucide-react';

const TOOLS = [
    {
        name: 'Selenium',
        badge: 'Most Widely Used',
        highlight: true,
        tagline: 'The industry standard — any browser, any language.',
        langs: ['Python', 'Java', 'JS', 'C#'],
        usedFor: ['Enterprise', 'Legacy codebases', 'Cross-browser suites'],
        adoption: '15+ years · Most job listings',
    },
    {
        name: 'Cypress',
        badge: 'Easiest to Start',
        highlight: false,
        tagline: 'Fast setup, friendly errors, built for JS teams.',
        langs: ['JavaScript', 'TypeScript'],
        usedFor: ['React / Vue / Angular apps', 'Startups', 'Dev-owned testing'],
        adoption: 'Fast growing · Best for frontend',
    },
    {
        name: 'Playwright',
        badge: 'Most Capable',
        highlight: false,
        tagline: 'Built by Microsoft — full cross-browser control.',
        langs: ['Python', 'JS', 'Java', 'C#'],
        usedFor: ['Cross-browser coverage', 'Modern product teams', 'CI/CD pipelines'],
        adoption: 'Rapidly growing · Selenium replacement',
    },
];

interface ToolLandscapeProps {
    onContinue: () => void;
}

const ToolLandscape: React.FC<ToolLandscapeProps> = ({ onContinue }) => (
    <div className="max-w-4xl mx-auto">

        <div className="text-center mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Step 2</p>
            <h2 className="text-2xl font-light text-white tracking-tight">The tools teams use</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {TOOLS.map(tool => (
                <div
                    key={tool.name}
                    className={`rounded-xl border p-5 flex flex-col gap-4 ${
                        tool.highlight ? 'bg-purple-500/8 border-purple-500/25' : 'bg-white/5 border-white/10'
                    }`}
                >
                    {/* Name + badge */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                            tool.highlight
                                ? 'text-purple-300 border-purple-500/30 bg-purple-500/15'
                                : 'text-slate-400 border-white/10 bg-white/5'
                        }`}>
                            {tool.badge}
                        </span>
                    </div>

                    {/* Tagline */}
                    <p className="text-xs text-slate-400 leading-snug">{tool.tagline}</p>

                    <div className="border-t border-white/8" />

                    {/* Languages */}
                    <div>
                        <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-2">Languages</p>
                        <div className="flex flex-wrap gap-1.5">
                            {tool.langs.map(l => (
                                <span key={l} className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                                    {l}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Used for */}
                    <div>
                        <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-2">Used in</p>
                        <div className="flex flex-wrap gap-1.5">
                            {tool.usedFor.map(u => (
                                <span key={u} className={`text-xs px-2 py-0.5 rounded border ${
                                    tool.highlight
                                        ? 'text-purple-300/70 border-purple-500/20 bg-purple-500/8'
                                        : 'text-slate-400 border-white/8 bg-white/3'
                                }`}>
                                    {u}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${tool.highlight ? 'bg-purple-500' : 'bg-slate-700'}`} />
                        <span className={`text-xs ${tool.highlight ? 'text-purple-400/60' : 'text-slate-600'}`}>
                            {tool.adoption}
                        </span>
                    </div>
                </div>
            ))}
        </div>

        {/* Selenium callout */}
        <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl px-5 py-3.5 mb-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
            <p className="text-sm text-slate-300">
                <span className="text-white font-medium">We'll use Selenium in Level 1</span>
                {' — '}it's the most established tool and the one you'll encounter in most real teams and job listings.
            </p>
        </div>

        <div className="flex justify-end">
            <button
                onClick={onContinue}
                className="flex items-center gap-2 py-2.5 px-6 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
                Next: What to Automate
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    </div>
);

export default ToolLandscape;
