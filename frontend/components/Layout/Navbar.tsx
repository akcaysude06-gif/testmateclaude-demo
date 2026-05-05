import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Sparkles, User, Palette, Check, Settings, LayoutGrid, Link2, CheckCircle2, ChevronDown } from 'lucide-react';

const THEMES = [
    { id: 'lavender',   label: 'Lavender',   from: '#2e2440', via: '#4a3060', accent: '#c4b5fd' },
    { id: 'butter',     label: 'Butter',     from: '#4a4520', via: '#7a6e30', accent: '#fde68a' },
    { id: 'pink',       label: 'Pink',       from: '#2e1a28', via: '#5c3050', accent: '#fbc8e0' },
    { id: 'periwinkle', label: 'Periwinkle', from: '#1a2235', via: '#1e3050', accent: '#a5b4fc' },
];

const THEME_KEY = 'testmate_color_theme';

function applyTheme(themeId: string) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    document.documentElement.style.setProperty('--theme-from',   theme.from);
    document.documentElement.style.setProperty('--theme-via',    theme.via);
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
    document.body.setAttribute('data-theme', themeId);
}

interface NavbarProps {
    onLogout: () => void;
    user?: any;
    onLogoClick?: () => void;
    onSettings?: () => void;
    onBackToModes?: () => void;
    jiraStatus?: { connected: boolean; email?: string; instance_url?: string } | null;
    onConnectJira?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, user, onLogoClick, onSettings, onBackToModes, jiraStatus, onConnectJira }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [activeTheme, setActiveTheme] = useState<string>('lavender');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const handleLogoutClick = () => setShowConfirm(true);
    const handleConfirm = () => { setShowConfirm(false); onLogout(); };
    const handleCancel = () => setShowConfirm(false);

    useEffect(() => {
        const saved = localStorage.getItem(THEME_KEY) || 'lavender';
        setActiveTheme(saved);
        applyTheme(saved);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTheme = (id: string) => {
        setActiveTheme(id);
        localStorage.setItem(THEME_KEY, id);
        applyTheme(id);
        setDropdownOpen(false);
        window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY, newValue: id }));
    };

    const currentTheme = THEMES.find(t => t.id === activeTheme) || THEMES[0];

    return (
        <>
        <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10 relative z-40">
            <div className="px-16">
                <div className="flex items-center justify-between h-16">
                    <button onClick={onLogoClick} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <Sparkles className="w-8 h-8 text-purple-400" />
                        <span className="text-white font-bold text-xl">TestMate</span>
                    </button>

                    {user && (
                        <div className="flex items-center space-x-4">
                            {/* Color Theme dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(v => !v)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                                               bg-white/5 border border-white/10 hover:bg-white/10
                                               hover:border-white/20 transition-all text-white/70
                                               hover:text-white text-sm"
                                >
                                    <Palette className="w-4 h-4" />
                                    <span>Color Theme</span>
                                    <span
                                        className="w-3 h-3 rounded-full ml-1"
                                        style={{ background: currentTheme.accent }}
                                    />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10
                                                    bg-black/70 backdrop-blur-xl shadow-xl z-[9999] p-2 flex flex-col gap-1">
                                        {THEMES.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => handleTheme(theme.id)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                                           transition-all font-medium w-full text-left"
                                                style={{
                                                    background: activeTheme === theme.id
                                                        ? `linear-gradient(135deg, ${theme.from}, ${theme.via})`
                                                        : 'transparent',
                                                    color: activeTheme === theme.id ? theme.accent : 'rgba(255,255,255,0.6)',
                                                    border: `1px solid ${activeTheme === theme.id ? theme.accent : 'transparent'}`,
                                                }}
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ background: theme.accent }}
                                                />
                                                {theme.label}
                                                {activeTheme === theme.id && (
                                                    <Check className="w-3 h-3 ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* User avatar + name → dropdown */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(v => !v)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                                               hover:bg-white/10 transition-all"
                                >
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.username}
                                            className="w-8 h-8 rounded-full border-2 border-purple-400"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <span className="text-purple-200 text-sm">{user.username}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-purple-300 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10
                                                    bg-black/80 backdrop-blur-xl shadow-2xl z-[9999] py-1.5 flex flex-col">
                                        {/* Settings */}
                                        <button
                                            onClick={() => { setUserMenuOpen(false); onSettings?.(); }}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70
                                                       hover:text-white hover:bg-white/8 transition-all text-left"
                                        >
                                            <Settings className="w-4 h-4 flex-shrink-0" />
                                            Settings
                                        </button>

                                        {/* Back to modes */}
                                        <button
                                            onClick={() => { setUserMenuOpen(false); onBackToModes?.(); }}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70
                                                       hover:text-white hover:bg-white/8 transition-all text-left"
                                        >
                                            <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                                            Back to modes
                                        </button>

                                        <div className="mx-3 my-1 border-t border-white/10" />

                                        {/* Jira */}
                                        {jiraStatus?.connected ? (
                                            <div className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-default">
                                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-400" />
                                                <div className="min-w-0">
                                                    <p className="text-green-300 leading-tight">Jira connected</p>
                                                    {jiraStatus.email && (
                                                        <p className="text-white/30 text-xs truncate">{jiraStatus.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setUserMenuOpen(false); onConnectJira?.(); }}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70
                                                           hover:text-white hover:bg-white/8 transition-all text-left"
                                            >
                                                <Link2 className="w-4 h-4 flex-shrink-0" />
                                                Connect Jira account
                                            </button>
                                        )}

                                        <div className="mx-3 my-1 border-t border-white/10" />

                                        {/* Logout */}
                                        <button
                                            onClick={() => { setUserMenuOpen(false); handleLogoutClick(); }}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400
                                                       hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
                                        >
                                            <LogOut className="w-4 h-4 flex-shrink-0" />
                                            Log out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </nav>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-80 shadow-xl">
                        <h2 className="text-white font-semibold text-lg mb-2">Log out?</h2>
                        <p className="text-purple-200 text-sm mb-6">Are you sure you want to log out?</p>
                        <div className="flex space-x-3 justify-end">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm text-purple-200 hover:text-white border border-white/10 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
