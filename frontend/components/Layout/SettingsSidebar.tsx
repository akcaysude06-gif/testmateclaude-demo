import React, { useState, useEffect } from 'react';
import { Menu, X, Palette, Shield, BookOpen, Check, PanelLeft, PanelRight } from 'lucide-react';

const THEMES = [
    { id: 'lavender',    label: 'Lavender',    from: '#2e2440', via: '#4a3060', accent: '#c4b5fd' },
    { id: 'butter',      label: 'Butter',      from: '#4a4520', via: '#7a6e30', accent: '#fde68a' },
    { id: 'pink',        label: 'Pink',        from: '#2e1a28', via: '#5c3050', accent: '#fbc8e0' },
    { id: 'periwinkle',  label: 'Periwinkle',  from: '#1a2235', via: '#1e3050', accent: '#a5b4fc' },
];

const THEME_KEY    = 'testmate_color_theme';
const POSITION_KEY = 'testmate_sidebar_position';

function applyTheme(themeId: string) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    document.documentElement.style.setProperty('--theme-from',   theme.from);
    document.documentElement.style.setProperty('--theme-via',    theme.via);
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
    document.body.setAttribute('data-theme', themeId);
}

interface SettingsSidebarProps {
    onOpenBeginnerMode: () => void;
    onSideChange?: (side: 'left' | 'right') => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ onOpenBeginnerMode, onSideChange }) => {
    const [open, setOpen]             = useState(false);
    const [activeTheme, setActiveTheme] = useState<string>('lavender');
    const [side, setSide]             = useState<'left' | 'right'>('right');

    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'lavender';
        setActiveTheme(savedTheme);
        applyTheme(savedTheme);

        const savedSide = (localStorage.getItem(POSITION_KEY) || 'right') as 'left' | 'right';
        setSide(savedSide);
        onSideChange?.(savedSide);
    }, []);

    const handleTheme = (id: string) => {
        setActiveTheme(id);
        localStorage.setItem(THEME_KEY, id);
        applyTheme(id);
    };

    const handleToggleSide = () => {
        const next = side === 'right' ? 'left' : 'right';
        setSide(next);
        localStorage.setItem(POSITION_KEY, next);
        onSideChange?.(next);
        setOpen(false);
    };

    const handlePrivacy = () => {
        window.open('/account', '_blank');
    };

    const positionClass = side === 'right' ? 'right-0' : 'left-0';
    const borderClass   = side === 'right' ? 'border-l' : 'border-r';

    return (
        <>
            {/* Floating toggle button — only visible when closed */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className={`fixed top-1 ${positionClass} z-50 m-2 w-11 h-11 flex items-center justify-center
                                text-white/60 hover:text-white transition-colors rounded-md
                                bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 shadow-lg`}
                    aria-label="Open settings"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            {/* Sidebar panel — only rendered when open */}
            {open && (
            <div
                style={{ width: 260 }}
                className={`fixed top-0 ${positionClass} h-screen z-50 flex flex-col
                            bg-black/40 backdrop-blur-xl ${borderClass} border-white/10
                            overflow-hidden`}
            >
                {/* Toggle button */}
                <div className="flex items-center justify-center h-16 flex-shrink-0 border-b border-white/10">
                    <button
                        onClick={() => setOpen(false)}
                        className="w-8 h-8 flex items-center justify-center
                                   text-white/60 hover:text-white transition-colors rounded-md
                                   hover:bg-white/10"
                        aria-label="Close settings"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div
                    className="flex flex-col flex-1 overflow-y-auto px-4 py-5 gap-6 min-w-[212px]"
                >
                    {/* Color Theme */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Palette className="w-4 h-4 text-white/50" />
                            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                                Color Theme
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {THEMES.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleTheme(theme.id)}
                                    className="relative flex items-center gap-2 px-3 py-2 rounded-lg
                                               border transition-all text-sm font-medium"
                                    style={{
                                        background: `linear-gradient(135deg, ${theme.from}, ${theme.via})`,
                                        borderColor: activeTheme === theme.id
                                            ? theme.accent
                                            : 'rgba(255,255,255,0.08)',
                                        color: activeTheme === theme.id ? theme.accent : 'rgba(255,255,255,0.6)',
                                        boxShadow: activeTheme === theme.id
                                            ? `0 0 10px ${theme.accent}55`
                                            : 'none',
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
                    </section>

                    <div className="border-t border-white/10" />

                    {/* Privacy */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4 text-white/50" />
                            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                                Privacy
                            </span>
                        </div>
                        <button
                            onClick={handlePrivacy}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                       bg-white/5 border border-white/10 hover:bg-white/10
                                       hover:border-white/20 transition-all text-white/70
                                       hover:text-white text-sm"
                        >
                            <Shield className="w-4 h-4 flex-shrink-0" />
                            <span>Account & Privacy</span>
                        </button>
                        <p className="mt-1.5 text-white/30 text-xs leading-snug px-1">
                            Manage your account, disconnect GitHub, or delete your data.
                        </p>
                    </section>

                    <div className="border-t border-white/10" />

                    {/* Beginner Mode */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-white/50" />
                            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                                Mode
                            </span>
                        </div>
                        <button
                            onClick={() => { onOpenBeginnerMode(); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                       bg-purple-500/10 border border-purple-500/30
                                       hover:bg-purple-500/20 hover:border-purple-500/50
                                       transition-all text-purple-300 hover:text-purple-200 text-sm"
                        >
                            <BookOpen className="w-4 h-4 flex-shrink-0" />
                            <span>Open Beginner Mode</span>
                        </button>
                    </section>

                    <div className="border-t border-white/10" />

                    {/* Position toggle */}
                    <section>
                        <button
                            onClick={handleToggleSide}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                       bg-white/5 border border-white/10 hover:bg-white/10
                                       hover:border-white/20 transition-all text-white/60
                                       hover:text-white text-sm"
                        >
                            {side === 'right'
                                ? <><PanelLeft  className="w-4 h-4 flex-shrink-0" /><span>Move sidebar to left</span></>
                                : <><PanelRight className="w-4 h-4 flex-shrink-0" /><span>Move sidebar to right</span></>
                            }
                        </button>
                    </section>
                </div>
            </div>
            )}

            {/* Overlay to close */}
            {open && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                />
            )}
        </>
    );
};

export default SettingsSidebar;
