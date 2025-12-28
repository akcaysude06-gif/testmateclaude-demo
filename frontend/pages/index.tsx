import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LoginScreen from '../components/Auth/LoginScreen';
import Layout from '../components/Layout/Layout';
import ModeSelection from '../components/Mode/ModeSelection';
import LevelSelection from '../components/Level/LevelSelection';
import Level0 from '../components/Level0/Level0';
import Level1 from '../components/Level1/Level1';
import { ModeType, LevelType } from '../types';
import { authUtils } from '../utils/auth';
import { apiService } from '../services/api';

export default function Home() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMode, setCurrentMode] = useState<ModeType>(null);
    const [currentLevel, setCurrentLevel] = useState<LevelType>(null);
    const [user, setUser] = useState<any>(null);

    // Check if user is already authenticated on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = authUtils.getToken();

            if (token) {
                try {
                    // Verify token is still valid
                    const userData = await apiService.getCurrentUser();
                    setUser(userData);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    authUtils.removeToken();
                }
            }

            setIsLoading(false);
        };

        checkAuth();
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
        } else if (hash === '#production') {
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
            } else if (hash === '#production') {
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
        // This is called after successful OAuth
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }

        setIsAuthenticated(false);
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
        return <LoginScreen onLogin={handleLogin} />;
    }

    // Authenticated - show main app
    return (
        <Layout onLogout={handleLogout} user={user}>
            {/* No mode selected - show mode selection */}
            {!currentMode && (
                <ModeSelection onSelectMode={handleSelectMode} />
            )}

            {/* Guided mode - no level selected - show level selection */}
            {currentMode === 'guided' && currentLevel === null && (
                <LevelSelection
                    onSelectLevel={handleSelectLevel}
                    onBack={handleBackToModes}
                />
            )}

            {/* Guided mode - Level 0 selected */}
            {currentMode === 'guided' && currentLevel === 0 && (
                <Level0 onBack={handleBackToLevels} />
            )}

            {/* Guided mode - Level 1 selected */}
            {currentMode === 'guided' && currentLevel === 1 && (
            <Level1 onBack={handleBackToLevels} />
        )}

            {/* Production mode */}
            {currentMode === 'production' && (
                <div className="text-white text-center">
                    <h2 className="text-3xl mb-4">Production Mode - Coming Soon</h2>
                    <button
                        onClick={handleBackToModes}
                        className="text-purple-300 hover:text-white"
                    >
                        ← Back to modes
                    </button>
                </div>
            )}
        </Layout>
    );
}