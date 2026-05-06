import React from 'react';
import { X, Check, ChevronRight } from 'lucide-react';

const WITHOUT = [
    'Retest manually after every code change',
    'Human errors creep in when fatigued',
    'Blocks releases for hours',
];

const WITH = [
    'Script reruns in seconds, automatically',
    'Same result every single time',
    'Runs in the background while you ship',
];

interface WhyAutomationProps {
    onContinue: () => void;
}

const WhyAutomation: React.FC<WhyAutomationProps> = ({ onContinue }) => (
    <div className="max-w-3xl mx-auto">

        <div className="text-center mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Step 1</p>
            <h2 className="text-2xl font-light text-white tracking-tight">Why automation exists</h2>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Without */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Without it</p>
                <ul className="space-y-3">
                    {WITHOUT.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center mt-0.5">
                                <X className="w-2.5 h-2.5 text-red-400" />
                            </div>
                            <span className="text-sm text-slate-400">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* With */}
            <div className="bg-purple-500/6 rounded-xl border border-purple-500/20 p-5">
                <p className="text-xs font-semibold text-purple-400/70 uppercase tracking-widest mb-4">With it</p>
                <ul className="space-y-3">
                    {WITH.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center mt-0.5">
                                <Check className="w-2.5 h-2.5 text-green-400" />
                            </div>
                            <span className="text-sm text-slate-300">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
            {[
                { value: '10×', label: 'faster than manual re-testing' },
                { value: '24/7', label: 'runs without human involvement' },
                { value: '100%', label: 'consistent, no tired eyes' },
            ].map(stat => (
                <div key={stat.value} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                    <p className="text-2xl font-light text-white mb-1">{stat.value}</p>
                    <p className="text-xs text-slate-500 leading-snug">{stat.label}</p>
                </div>
            ))}
        </div>

        <div className="flex justify-end">
            <button
                onClick={onContinue}
                className="flex items-center gap-2 py-2.5 px-6 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
                Next: The Tools
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    </div>
);

export default WhyAutomation;
