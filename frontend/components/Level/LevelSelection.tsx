import React from 'react';
import { ChevronRight } from 'lucide-react';
import { LevelType } from '../../types';

interface LevelSelectionProps {
    onSelectLevel: (level: LevelType) => void;
    onBack: () => void;
}

const LevelSelection: React.FC<LevelSelectionProps> = ({ onSelectLevel, onBack }) => {
    return (
        <>
            <button
                onClick={onBack}
                className="text-purple-300 hover:text-white mb-8 flex items-center space-x-2"
            >
                <ChevronRight className="w-4 h-4 transform rotate-180" />
                <span>Back to modes</span>
            </button>

            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">Select Your Level</h2>
                <p className="text-purple-200 text-lg">Start where you feel most comfortable</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div
                    onClick={() => onSelectLevel(0)}
                    className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer transform hover:scale-105"
                >
                    <div className="text-3xl font-bold text-blue-400 mb-2">Level 0</div>
                    <h3 className="text-xl font-semibold text-white mb-3">Complete Beginner</h3>
                    <p className="text-purple-200 mb-4">
                        No testing experience? No problem! Learn the fundamentals of software testing from scratch.
                    </p>
                    <div className="text-sm text-purple-300">
                        Topics: What is testing, Manual vs Automation, Why Selenium
                    </div>
                </div>

                <div
                    onClick={() => onSelectLevel(1)}
                    className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all cursor-pointer transform hover:scale-105"
                >
                    <div className="text-3xl font-bold text-purple-400 mb-2">Level 1</div>
                    <h3 className="text-xl font-semibold text-white mb-3">Manual Tester</h3>
                    <p className="text-purple-200 mb-4">
                        Know manual testing but new to automation? Learn to generate Selenium tests from test cases.
                    </p>
                    <div className="text-sm text-purple-300">
                        Topics: Selenium basics, Cucumber BDD, Test automation
                    </div>
                </div>
            </div>
        </>
    );
};

export default LevelSelection;