import React from 'react';
import { Code2, FlaskConical, ChevronRight } from 'lucide-react';
import { Repository, CodeType } from '../Production';

interface CodeTypeStepProps {
    repo:     Repository;
    selected: CodeType | null;
    onSelect: (ct: CodeType) => void;
}

const OPTIONS: {
    id:          CodeType;
    icon:        React.ReactNode;
    label:       string;
    description: string;
    examples:    string[];
    color:       string;
    border:      string;
    iconBg:      string;
}[] = [
    {
        id:          'application-code',
        icon:        <Code2 className="w-8 h-8 text-blue-300" />,
        label:       'Application Code',
        description: 'Source code you want to generate tests for',
        examples:    ['React components', 'FastAPI routes', 'Business logic', 'Utility functions'],
        color:       'from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30',
        border:      'border-blue-500/30 hover:border-blue-400',
        iconBg:      'bg-blue-500/20',
    },
    {
        id:          'test-code',
        icon:        <FlaskConical className="w-8 h-8 text-purple-300" />,
        label:       'Test Code',
        description: 'Existing tests you want to review or improve',
        examples:    ['Selenium tests', 'pytest suites', 'Jest specs', 'Cypress scripts'],
        color:       'from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30',
        border:      'border-purple-500/30 hover:border-purple-400',
        iconBg:      'bg-purple-500/20',
    },
];

const CodeTypeStep: React.FC<CodeTypeStepProps> = ({ repo, onSelect }) => {
    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">What kind of code?</h2>
                <p className="text-slate-400 text-sm">
                    Working in <span className="text-purple-300 font-medium">{repo.full_name}</span> — tell us what you're bringing to the session
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
                {OPTIONS.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`text-left p-7 rounded-2xl border-2 bg-gradient-to-br transition-all duration-200 group ${opt.color} ${opt.border}`}
                    >
                        <div className={`inline-flex p-3 rounded-xl ${opt.iconBg} mb-5`}>
                            {opt.icon}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{opt.label}</h3>
                        <p className="text-slate-400 text-sm mb-5 leading-relaxed">{opt.description}</p>

                        <ul className="space-y-1.5 mb-6">
                            {opt.examples.map(ex => (
                                <li key={ex} className="flex items-center space-x-2 text-xs text-slate-400">
                                    <span className="w-1 h-1 rounded-full bg-slate-500 flex-shrink-0" />
                                    <span>{ex}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex items-center space-x-1 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                            <span>Continue</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CodeTypeStep;
