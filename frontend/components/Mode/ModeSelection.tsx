import React from 'react';
import { BookOpen, Zap, ChevronRight } from 'lucide-react';
import { ModeType } from '../../types';

interface ModeSelectionProps {
    onSelectMode: (mode: ModeType) => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
    return (
        <>
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">Choose Your Path</h2>
                <p className="text-purple-200 text-lg">Select the mode that fits your experience level</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div
                    onClick={() => onSelectMode('guided')}
                    className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-purple-400/50 transition-all cursor-pointer transform hover:scale-105"
                >
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-6">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Guided Mode</h3>
                    <p className="text-purple-200 mb-6">
                        Perfect for beginners and those learning automation testing. Step-by-step guidance with AI explanations.
                    </p>
                    <div className="space-y-2 text-sm text-purple-200">
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="w-4 h-4" />
                            <span>Level 0: Testing Fundamentals</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="w-4 h-4" />
                            <span>Level 1: Selenium Automation</span>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => onSelectMode('production')}
                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-pink-400/50 transition-all cursor-pointer transform hover:scale-105"
                >
                    <div className="flex items-center justify-center w-16 h-16 bg-purple-500 rounded-2xl mb-6">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Production Mode</h3>
                    <p className="text-purple-200 mb-6">
                        For experienced testers. Analyze and optimize your existing automation code with AI assistance.
                    </p>
                    <div className="space-y-2 text-sm text-purple-200">
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="w-4 h-4" />
                            <span>Code Analysis & Optimization</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="w-4 h-4" />
                            <span>Repository Integration</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ModeSelection;