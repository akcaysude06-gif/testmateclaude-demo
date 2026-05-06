import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import SettingsSidebar from './SettingsSidebar';
import LearningAIChat from '../LearningAIChat';

const EDGE_GAP            = 4;
const FULL_WIDTH_EDGE_GAP = 8;

interface LayoutProps {
    children:                React.ReactNode;
    onLogout:                () => void;
    user?:                   any;
    onOpenBeginnerMode?:     () => void;
    fullWidth?:              boolean;
    padding?:                string;
    onLogoClick?:            () => void;
    onSettings?:             () => void;
    jiraStatus?:             { connected: boolean; email?: string; instance_url?: string } | null;
    onConnectJira?:          () => void;
    // global AI chat
    showAIChat?:             boolean;
    aiChatOpen?:             boolean;
    onAIChatToggle?:         (open: boolean) => void;
    aiChatContext?:          string;
    aiChatPageKey?:          string;
    aiChatInjectedMessage?:  string | null;
    onAIChatInjectedHandled?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
    children, onLogout, user, onOpenBeginnerMode,
    fullWidth, padding, onLogoClick, onSettings, jiraStatus, onConnectJira,
    showAIChat = false,
    aiChatOpen = false,
    onAIChatToggle,
    aiChatContext = '',
    aiChatPageKey = 'home',
    aiChatInjectedMessage,
    onAIChatInjectedHandled,
}) => {
    const [sidebarSide, setSidebarSide] = useState<'left' | 'right'>('right');

    useEffect(() => {
        const stored = localStorage.getItem('testmate_sidebar_position') as 'left' | 'right' | null;
        if (stored) setSidebarSide(stored);
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'testmate_sidebar_position' && (e.newValue === 'left' || e.newValue === 'right')) {
                setSidebarSide(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleBeginnerMode = () => {
        window.location.hash = 'guided';
        onOpenBeginnerMode?.();
    };

    const fullWidthPadding = padding ?? (
        sidebarSide === 'right'
            ? `${EDGE_GAP}px ${FULL_WIDTH_EDGE_GAP}px ${EDGE_GAP}px ${EDGE_GAP}px`
            : `${EDGE_GAP}px ${EDGE_GAP}px ${EDGE_GAP}px ${FULL_WIDTH_EDGE_GAP}px`
    );

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--theme-from), var(--theme-via), var(--theme-from))' }}>
            <Navbar
                onLogout={onLogout}
                user={user}
                onLogoClick={onLogoClick}
                onSettings={onSettings}
                onBackToModes={onLogoClick}
                jiraStatus={jiraStatus}
                onConnectJira={onConnectJira}
            />

            {showAIChat ? (
                /* ── Full-height flex layout with AI panel ── */
                <div style={{ display: 'flex', height: 'calc(100vh - 4rem)', overflow: 'hidden' }}>
                    <div
                        className={fullWidth
                            ? 'scroll-subtle flex-1 min-w-0 overflow-y-auto'
                            : 'scroll-subtle flex-1 min-w-0 overflow-y-auto max-w-7xl mx-auto px-6 py-8 pr-16'
                        }
                        style={fullWidth ? { padding: fullWidthPadding } : undefined}
                    >
                        {children}
                    </div>
                    <LearningAIChat
                        isOpen={aiChatOpen}
                        onToggle={onAIChatToggle ?? (() => {})}
                        context={aiChatContext}
                        pageKey={aiChatPageKey}
                        injectedMessage={aiChatInjectedMessage}
                        onInjectedHandled={onAIChatInjectedHandled}
                    />
                </div>
            ) : (
                /* ── Standard layout (login / jira-setup pages) ── */
                <div
                    className={fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pr-16'}
                    style={fullWidth ? { padding: fullWidthPadding } : undefined}
                >
                    {children}
                </div>
            )}

            <SettingsSidebar onOpenBeginnerMode={handleBeginnerMode} onSideChange={setSidebarSide} />
        </div>
    );
};

export default Layout;
