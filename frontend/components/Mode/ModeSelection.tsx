import React, { useState, useEffect } from 'react';
import { BookOpen, Zap, ChevronRight } from 'lucide-react';
import { ModeType } from '../../types';

interface ModeSelectionProps {
    onSelectMode: (mode: ModeType) => void;
}

const PREFS_KEY = 'testmate_user_preferences';

type DefaultMode = 'production' | 'guided' | null;

function getPrefs(): { defaultMode: DefaultMode } {
    try {
        const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
        // migrate legacy alwaysOpenProduction flag
        if (raw.alwaysOpenProduction && !raw.defaultMode) {
            return { defaultMode: 'production' };
        }
        return { defaultMode: raw.defaultMode ?? null };
    } catch {
        return { defaultMode: null };
    }
}

function saveDefaultMode(mode: DefaultMode) {
    try {
        const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
        localStorage.setItem(PREFS_KEY, JSON.stringify({ ...raw, defaultMode: mode, alwaysOpenProduction: mode === 'production' }));
    } catch {
        // ignore
    }
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
    const [defaultMode, setDefaultMode] = useState<DefaultMode>(null);

    useEffect(() => {
        setDefaultMode(getPrefs().defaultMode);
    }, []);

    const handleCheckbox = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleDefaultModeChange = (mode: 'production' | 'guided') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const next: DefaultMode = e.target.checked ? mode : null;
        setDefaultMode(next);
        saveDefaultMode(next);
    };

    return (
        <>
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">Choose Your Path</h2>
                <p className="text-purple-200 text-lg">Select the mode that fits your experience level</p>
            </div>

            <div className="flex gap-8 max-w-5xl mx-auto items-stretch">
                {/* Production Mode — primary, left, large */}
                <div
                    onClick={() => onSelectMode('production')}
                    className="flex-[3] bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-pink-400/50 transition-all cursor-pointer transform hover:scale-105"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-purple-500 rounded-2xl">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex flex-col gap-2">
                            {/* GitHub */}
                            <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg">
                                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                </svg>
                            </div>
                            {/* Jira */}
                            <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.004-1.005z" fill="#2684FF"/>
                                    <path d="M6.026 6.258H17.59a5.218 5.218 0 00-5.232-5.215h-2.13V-.014A5.215 5.215 0 005.022 5.253v1.005z" fill="#2684FF"/>
                                    <path d="M6.031 6.263H17.59a5.218 5.218 0 015.215 5.215H11.24a5.218 5.218 0 01-5.209-5.215z" fill="url(#jira-gradient)"/>
                                    <defs>
                                        <linearGradient id="jira-gradient" x1="17.273" y1="6.315" x2="11.875" y2="11.676" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#0052CC"/>
                                            <stop offset="100%" stopColor="#2684FF"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Production Mode</h3>
                    <p className="text-purple-200 mb-6">
                        For experienced testers. Connect your GitHub repo and Jira projects to automatically detect test coverage gaps and get AI-powered test generation.
                    </p>
                    <div className="space-y-2 text-sm text-purple-200">
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="w-4 h-4" />
                            <span>GitHub & Jira Integration</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="w-4 h-4" />
                            <span>Gap Analysis & Coverage Tracking</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="w-4 h-4" />
                            <span>AI Test Generation & Verification</span>
                        </div>
                    </div>
                    <label
                        className="flex items-center space-x-2 mt-5 cursor-pointer w-fit"
                        onClick={handleCheckbox}
                    >
                        <input
                            type="checkbox"
                            checked={defaultMode === 'production'}
                            onChange={handleDefaultModeChange('production')}
                            className="w-3.5 h-3.5 rounded accent-purple-400 cursor-pointer"
                        />
                        <span className="text-xs text-purple-300/70 select-none">Always open Production Mode</span>
                    </label>
                </div>

                {/* Guided Mode — secondary, right, smaller */}
                <div className="flex-[2] flex flex-col gap-3">
                    <div className="text-center px-2">
                        <p className="text-purple-300 text-sm font-medium leading-snug">
                            For beginners and manual testers —<br />
                            <span className="text-purple-400/70 text-xs">interactive learning with hands-on practice</span>
                        </p>
                    </div>
                    <div
                        onClick={() => onSelectMode('guided')}
                        className="flex-1 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-2xl p-5 border border-white/10 hover:border-purple-400/40 transition-all cursor-pointer transform hover:scale-105"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/80 rounded-xl">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            {/* Jira */}
                            <div className="flex items-center justify-center w-7 h-7 bg-white/10 rounded-lg">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.004-1.005z" fill="#2684FF"/>
                                    <path d="M6.026 6.258H17.59a5.218 5.218 0 00-5.232-5.215h-2.13V-.014A5.215 5.215 0 005.022 5.253v1.005z" fill="#2684FF"/>
                                    <path d="M6.031 6.263H17.59a5.218 5.218 0 015.215 5.215H11.24a5.218 5.218 0 01-5.209-5.215z" fill="url(#jira-gradient-guided)"/>
                                    <defs>
                                        <linearGradient id="jira-gradient-guided" x1="17.273" y1="6.315" x2="11.875" y2="11.676" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#0052CC"/>
                                            <stop offset="100%" stopColor="#2684FF"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Guided Mode</h3>
                        <p className="text-purple-200/80 text-sm mb-4">
                            Perfect for beginners and manual testers. Learn testing fundamentals and automation basics with step-by-step AI-powered guidance.
                        </p>
                        <div className="space-y-1.5 text-xs text-purple-300/70">
                            <div className="flex items-center space-x-2">
                                <ChevronRight className="w-3 h-3" />
                                <span>Learn manual testing basics</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <ChevronRight className="w-3 h-3" />
                                <span>Learn automation basics</span>
                            </div>
                        </div>
                        <label
                            className="flex items-center space-x-2 mt-5 cursor-pointer w-fit"
                            onClick={handleCheckbox}
                        >
                            <input
                                type="checkbox"
                                checked={defaultMode === 'guided'}
                                onChange={handleDefaultModeChange('guided')}
                                className="w-3.5 h-3.5 rounded accent-purple-400 cursor-pointer"
                            />
                            <span className="text-xs text-purple-300/70 select-none">Always open Guided Mode</span>
                        </label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ModeSelection;
