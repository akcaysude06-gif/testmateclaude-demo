import React from 'react';
import { Check, X, ChevronRight } from 'lucide-react';

const AUTOMATE = [
    'Regression after every deploy',
    'Login / logout flows',
    'Data-driven form submissions',
    'Cross-browser smoke tests',
    'API response checks',
    'Anything run weekly or more',
];

const MANUAL = [
    'Exploratory testing',
    'UX & usability review',
    'One-time edge cases',
    'Frequently changing UI',
    'Features still in design',
    'Judgment-based evaluation',
];

interface WhatNotToAutomateProps {
    onContinue: () => void;
}

const WhatNotToAutomate: React.FC<WhatNotToAutomateProps> = ({ onContinue }) => (
    <div className="max-w-3xl mx-auto">

        <div className="text-center mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Step 3</p>
            <h2 className="text-2xl font-light text-white tracking-tight">Not everything should be automated</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Automate */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <p className="text-xs font-semibold text-white uppercase tracking-widest">Automate</p>
                </div>
                <ul className="space-y-2.5">
                    {AUTOMATE.map((item, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                            <Check className="w-3 h-3 text-green-500/50 flex-shrink-0" />
                            <span className="text-sm text-slate-400">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Manual */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-red-400" />
                    </div>
                    <p className="text-xs font-semibold text-white uppercase tracking-widest">Keep Manual</p>
                </div>
                <ul className="space-y-2.5">
                    {MANUAL.map((item, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                            <X className="w-3 h-3 text-red-500/50 flex-shrink-0" />
                            <span className="text-sm text-slate-400">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Rule of thumb — single line */}
        <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-5 py-3 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
            <p className="text-sm text-slate-400">
                <span className="text-white font-medium">Rule: </span>
                if it runs often and the result is predictable — automate it.
            </p>
        </div>

        <div className="flex justify-end">
            <button
                onClick={onContinue}
                className="flex items-center gap-2 py-2.5 px-6 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
                Next: See It Live
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    </div>
);

export default WhatNotToAutomate;
