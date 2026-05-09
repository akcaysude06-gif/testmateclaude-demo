import React from 'react';
import { ChevronRight, ClipboardList, Bot } from 'lucide-react';
import { LevelType } from '../../types';

interface LevelSelectionProps {
    onSelectLevel: (level: LevelType) => void;
    onBack: () => void;
}

const LevelSelection: React.FC<LevelSelectionProps> = ({ onSelectLevel, onBack }) => {
    return (
        <>
            <div className="max-w-4xl mx-auto pt-10">
                <button
                    onClick={onBack}
                    className="text-purple-300 hover:text-white mb-8 flex items-center space-x-2 transition-colors"
                >
                    <ChevronRight className="w-4 h-4 transform rotate-180" />
                    <span>Back to modes</span>
                </button>
            </div>

            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">Select Your Level</h2>
                <p className="text-purple-200 text-lg">Start where you feel most comfortable</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Manual Testing */}
                <div
                    onClick={() => onSelectLevel(0)}
                    className="group relative bg-gradient-to-br from-blue-500/15 to-cyan-500/10 backdrop-blur-lg rounded-3xl p-7 border border-white/10 hover:border-blue-400/50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
                >
                    <div className="flex items-center gap-4 mb-5">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-500/80 rounded-2xl shadow-md shadow-blue-500/30">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/80 mb-0.5">Start here</p>
                            <h3 className="text-xl font-bold text-white leading-tight">Learn Manual Testing Basics</h3>
                        </div>
                    </div>
                    <p className="text-purple-200/80 text-sm leading-relaxed mb-5">
                        No testing experience? No problem. Learn the fundamentals of software testing from scratch with real-world scenarios.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {['What is testing', 'Manual vs Automation', 'Why Selenium'].map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/20 text-xs text-blue-300">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="absolute bottom-5 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-blue-400" />
                    </div>
                </div>

                {/* Automation */}
                <div
                    onClick={() => onSelectLevel(1)}
                    className="group relative bg-gradient-to-br from-purple-500/15 to-pink-500/10 backdrop-blur-lg rounded-3xl p-7 border border-white/10 hover:border-purple-400/50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
                >
                    <div className="flex items-center gap-4 mb-5">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-500/80 rounded-2xl shadow-md shadow-purple-500/30">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/80 mb-0.5">Next step</p>
                            <h3 className="text-xl font-bold text-white leading-tight">Learn Automation Basics</h3>
                        </div>
                    </div>
                    <p className="text-purple-200/80 text-sm leading-relaxed mb-5">
                        Know manual testing but new to automation? Learn to generate Selenium tests from test cases with AI assistance.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {['Selenium basics', 'Cucumber BDD', 'Test automation'].map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/20 text-xs text-purple-300">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="absolute bottom-5 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-purple-400" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default LevelSelection;
