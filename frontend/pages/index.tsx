import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import LoginScreen from '../components/Auth/LoginScreen';
import AccountConfirmScreen from '../components/Auth/AccountConfirmScreen';
import JiraSetupStep from '../components/Auth/JiraSetupStep';
import Layout from '../components/Layout/Layout';
import ModeSelection from '../components/Mode/ModeSelection';
import LevelSelection from '../components/Level/LevelSelection';
import Level0 from '../components/Level0/Level0';
import Level1 from '../components/Level1/Level1';
import { ModeType, LevelType } from '../types';
import { authUtils } from '../utils/auth';
import { apiService } from '../services/api';
import Production from '../components/Production/Production';


export default function Home() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showAccountConfirm, setShowAccountConfirm] = useState(false);
    const [showJiraSetup, setShowJiraSetup] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMode, setCurrentMode] = useState<ModeType>(null);
    const [currentLevel, setCurrentLevel] = useState<LevelType>(null);
    const [user, setUser] = useState<any>(null);
    const [jiraStatus, setJiraStatus] = useState<{ connected: boolean; email?: string; instance_url?: string } | null>(null);

    // Global AI chat
    const [aiChatOpen, setAiChatOpen]                       = useState(false);
    const [aiChatInjectedMessage, setAiChatInjectedMessage] = useState<string | null>(null);

    const getPageKey = (): string => {
        if (currentMode === 'production') return 'production';
        if (currentMode === 'guided' && currentLevel === 0) return 'level0';
        if (currentMode === 'guided' && currentLevel === 1) return 'level1';
        if (currentMode === 'guided') return 'level-selection';
        return 'home';
    };

    const handleAIFeedback = (feedback: string) => {
        setAiChatInjectedMessage(feedback);
        setAiChatOpen(true);
    };

    const getAiContext = (): string => {
        if (currentMode === 'production')
            return `CURRENT PAGE: Production Mode.
Visible navigation: a back arrow (top-left) that returns to the Home / Mode Selection screen.
The user is working through: Connect Repository → Select Scope → Jira & Dashboard.
To leave Production Mode and go elsewhere, the user clicks that back arrow.`;

        if (currentMode === 'guided') {
            if (currentLevel === 0)
                return `CURRENT PAGE: Level 0 — Manual Testing & Automation Fundamentals.
Visible navigation: a "Back" button (top-left) that returns to the Level Selection screen.
The user sees a list of scenarios; clicking one opens a 3-step flow (Manual Test → Why Automate? → First Automation). Inside a scenario there is a "Back to scenarios" button.
To reach a different mode the user must first click "Back" to reach Level Selection, then "Back to modes" to reach the Home screen.`;

            if (currentLevel === 1)
                return `CURRENT PAGE: Level 1 — Introduction to Test Automation.
Visible navigation: a back button (top-left) that steps back through phases; on the first phase ("Why Automation") it returns to the Level Selection screen.
Phases in order: Why Automation → The Tools → What Not to Automate → See It Live → Review & Practice.
To reach a different mode the user must first navigate back to the Level Selection screen, then click "Back to modes".`;

            return `CURRENT PAGE: Level Selection screen (inside Guided Learning mode).
Visible navigation: a "Back to modes" button (top-left) that returns to the Home / Mode Selection screen.
Two level cards are shown: Level 0 (Manual Testing Fundamentals) and Level 1 (Introduction to Test Automation).
To switch to Production Mode: click "Back to modes" (top-left), then click the "Production Mode" card on the Home screen.`;
        }

        return `CURRENT PAGE: Home / Mode Selection screen.
No back button — this is the top level of the app. The TestMate logo in the navbar also stays on this screen.
Two mode cards are shown: "Guided Learning" (click to go to Level Selection) and "Production Mode" (click to enter Production Mode directly).`;
    };

    const refreshJiraStatus = useCallback(async () => {
        try {
            const status = await apiService.getJiraStatus();
            setJiraStatus(status);
            return status;
        } catch {
            return null;
        }
    }, []);

    // Re-fetch Jira status whenever the tab becomes visible (e.g. returning from account page)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && authUtils.getToken()) {
                refreshJiraStatus();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [refreshJiraStatus]);

    // Check if user is already authenticated on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = authUtils.getToken();

            if (token) {
                try {
                    const userData = await apiService.getCurrentUser();
                    setUser(userData);
                    setIsAuthenticated(true);

                    // Show account confirmation screen after a fresh GitHub OAuth login
                    if (sessionStorage.getItem('account_confirm_pending') === '1') {
                        sessionStorage.removeItem('account_confirm_pending');
                        setShowAccountConfirm(true);
                    } else if (sessionStorage.getItem('jira_setup_pending') === '1') {
                        sessionStorage.removeItem('jira_setup_pending');
                        setShowJiraSetup(true);
                    } else if (new URLSearchParams(window.location.search).get('connect_jira') === '1') {
                        window.history.replaceState({}, '', '/');
                        setShowJiraSetup(true);
                    }

                    try {
                        const prefs = JSON.parse(localStorage.getItem('testmate_user_preferences') || '{}');
                        if (prefs.alwaysOpenProduction && !window.location.hash) {
                            setCurrentMode('production');
                            window.location.hash = 'production';
                        }
                    } catch {
                        // ignore malformed prefs
                    }

                    await refreshJiraStatus();
                } catch (error) {
                    console.error('Token verification failed:', error);
                }
            }

            setIsLoading(false);
        };

        // 5 saniye sonra zorla loading'i kapat (backend cevap vermezse)
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 5000);

        checkAuth().finally(() => {
            clearTimeout(timeout);
            setIsLoading(false);
        });
    }, []);

    // Sync state with URL hash
    useEffect(() => {
        const hash = window.location.hash;

        if (hash === '#guided') {
            setCurrentMode('guided');
            setCurrentLevel(null);
        } else if (hash === '#guided/level0') {
            setCurrentMode('guided');
            setCurrentLevel(0);
        } else if (hash === '#guided/level1') {
            setCurrentMode('guided');
            setCurrentLevel(1);
        } else if (hash === '#production' || hash.startsWith('#production?')) {
            setCurrentMode('production');
            setCurrentLevel(null);
        } else {
            setCurrentMode(null);
            setCurrentLevel(null);
        }
    }, []);

    // Listen to hash changes (back button)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;

            if (hash === '#guided') {
                setCurrentMode('guided');
                setCurrentLevel(null);
            } else if (hash === '#guided/level0') {
                setCurrentMode('guided');
                setCurrentLevel(0);
            } else if (hash === '#guided/level1') {
                setCurrentMode('guided');
                setCurrentLevel(1);
            } else if (hash === '#production' || hash.startsWith('#production?')) {
                setCurrentMode('production');
                setCurrentLevel(null);
            } else {
                setCurrentMode(null);
                setCurrentLevel(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLoginWithToken = async () => {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        const status = await refreshJiraStatus();
        if (!status?.connected) {
            setShowJiraSetup(true);
        }
    };

    const handleLogout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }

        authUtils.removeToken();
        setIsAuthenticated(false);
        setShowJiraSetup(false);
        setCurrentMode(null);
        setCurrentLevel(null);
        setUser(null);
        window.location.hash = '';
    };

    const handleSelectMode = (mode: ModeType) => {
        setCurrentMode(mode);
        setCurrentLevel(null);
        window.location.hash = mode || '';
    };

    const handleSelectLevel = (level: LevelType) => {
        setCurrentLevel(level);
        window.location.hash = `guided/level${level}`;
    };

    const handleBackToModes = () => {
        setCurrentMode(null);
        setCurrentLevel(null);
        window.location.hash = '';
    };

    const handleBackToLevels = () => {
        setCurrentLevel(null);
        window.location.hash = 'guided';
    };

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading TestMate...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show login
    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} onLoginWithToken={handleLoginWithToken} />;
    }

    // Just completed OAuth — confirm which account was used
    if (showAccountConfirm && user) {
        return (
            <AccountConfirmScreen
                user={user}
                onContinue={() => {
                    setShowAccountConfirm(false);
                    if (sessionStorage.getItem('jira_setup_pending') === '1') {
                        sessionStorage.removeItem('jira_setup_pending');
                        setShowJiraSetup(true);
                    }
                }}
                onSwitchAccount={() => {
                    setShowAccountConfirm(false);
                    setIsAuthenticated(false);
                    setUser(null);
                }}
            />
        );
    }

    // Authenticated but Jira setup not yet completed
    if (showJiraSetup) {
        return <JiraSetupStep onComplete={() => { setShowJiraSetup(false); refreshJiraStatus(); }} />;
    }

    // Authenticated - show main app
    return (
        <Layout
            onLogout={handleLogout}
            user={user}
            fullWidth={currentMode === 'production' || currentMode === 'guided'}
            padding={currentMode === 'guided' ? '0' : undefined}
            onLogoClick={handleBackToModes}
            onSettings={() => router.push('/account')}
            jiraStatus={jiraStatus}
            onConnectJira={() => setShowJiraSetup(true)}
            showAIChat
            aiChatOpen={aiChatOpen}
            onAIChatToggle={setAiChatOpen}
            aiChatContext={getAiContext()}
            aiChatPageKey={getPageKey()}
            aiChatInjectedMessage={aiChatInjectedMessage}
            onAIChatInjectedHandled={() => setAiChatInjectedMessage(null)}
        >
            {!currentMode && (
                <ModeSelection onSelectMode={handleSelectMode} />
            )}

            {currentMode === 'guided' && currentLevel === null && (
                <LevelSelection
                    onSelectLevel={handleSelectLevel}
                    onBack={handleBackToModes}
                />
            )}

            {currentMode === 'guided' && currentLevel === 0 && (
                <Level0 onBack={handleBackToLevels} onAIFeedback={handleAIFeedback} />
            )}

            {currentMode === 'guided' && currentLevel === 1 && (
                <Level1 onBack={handleBackToLevels} />
            )}

            {currentMode === 'production' && (
                <Production
                    onBack={handleBackToModes}
                    jiraConnected={jiraStatus?.connected === true}
                    onConnectJira={() => setShowJiraSetup(true)}
                    onJiraConnected={refreshJiraStatus}
                />
            )}
        </Layout>
    );
}