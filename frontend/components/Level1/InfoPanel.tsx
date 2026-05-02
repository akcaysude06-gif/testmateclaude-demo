import React from 'react';

const STEPS = [
    { n: '01', title: 'Describe Your Test', body: 'Write what you want to test in plain English. Be as detailed as possible.' },
    { n: '02', title: 'Upload Scenarios (Optional)', body: 'Drag & drop or import a test case file for more complex scenarios.' },
    { n: '03', title: 'Generate Code', body: 'The AI generates professional Selenium Python code from your description.' },
    { n: '04', title: 'Review & Use', body: 'Read the generated code and plain-English explanation, then use it in your project.' },
];

const TIPS = [
    'Include specific URLs and element selectors',
    'Mention expected outcomes clearly',
    'Describe the user flow step by step',
    'Use action verbs: click, enter, verify',
];

const InfoPanel: React.FC = () => (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 h-full flex flex-col gap-8">

        {/* How It Works */}
        <section>
            <h2 className="text-base font-semibold text-white mb-5 tracking-tight">How It Works</h2>
            <div className="space-y-5">
                {STEPS.map(s => (
                    <div key={s.n} className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-7 h-7 rounded-md bg-white/8 border border-white/10
                                         flex items-center justify-center text-xs font-mono text-slate-400">
                            {s.n}
                        </span>
                        <div>
                            <p className="text-sm font-medium text-white mb-0.5">{s.title}</p>
                            <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <div className="border-t border-white/8" />

        {/* Tips */}
        <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Tips for Better Results
            </h3>
            <ul className="space-y-2">
                {TIPS.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-slate-600 mt-0.5">–</span>
                        <span>{t}</span>
                    </li>
                ))}
            </ul>
        </section>

        <div className="border-t border-white/8" />

        {/* Example */}
        <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Example Description
            </h3>
            <p className="text-sm text-slate-400 italic leading-relaxed">
                "Navigate to https://example.com/login, enter username 'testuser' in the username field,
                enter password 'password123', click the 'Sign In' button, and verify the dashboard loads."
            </p>
        </section>

        <div className="mt-auto pt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
            <span className="text-xs text-slate-500">Powered by Llama 3</span>
        </div>
    </div>
);

export default InfoPanel;
