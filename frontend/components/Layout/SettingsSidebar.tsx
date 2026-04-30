import React, { useState, useEffect } from 'react';
import { Menu, X, Palette, Shield, BookOpen, Check, PanelLeft, PanelRight } from 'lucide-react';

const THEMES = [
    { id: 'purple', label: 'Purple', from: '#1e1b4b', via: '#581c87', accent: '#a855f7' },
    { id: 'ocean',  label: 'Ocean',  from: '#0c1a2e', via: '#1e3a5f', accent: '#38bdf8' },
    { id: 'forest', label: 'Forest', from: '#0d1f12', via: '#14532d', accent: '#4ade80' },
    { id: 'rose',   label: 'Rose',   from: '#1c0a0a', via: '#7f1d1d', accent: '#fb7185' },
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
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ onOpenBeginnerMode }) => {
    const [open, setOpen]             = useState(false);
    const [activeTheme, setActiveTheme] = useState<string>('purple');
    const [side, setSide]             = useState<'left' | 'right'>('right');

    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'purple';
        setActiveTheme(savedTheme);
        applyTheme(savedTheme);

        const savedSide = (localStorage.getItem(POSITION_KEY) || 'right') as 'left' | 'right';
        setSide(savedSide);
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
    };

    const handlePrivacy = () => {
        window.open('/account', '_blank');
    };

    const positionClass = side === 'right' ? 'right-0' : 'left-0';
    const borderClass   = side === 'right' ? 'border-l' : 'border-r';

    return (
        <>
            {/* Sidebar panel */}
            <div
                style={{ width: open ? 260 : 48, transition: 'width 0.25s ease' }}
                className={`fixed top-0 ${positionClass} h-screen z-50 flex flex-col
                            bg-black/40 backdrop-blur-xl ${borderClass} border-white/10
                            overflow-hidden`}
            >
                {/* Toggle button */}
                <div className="flex items-center justify-center h-16 flex-shrink-0 border-b border-white/10">
                    <button
                        onClick={() => setOpen(o => !o)}
                        className="w-8 h-8 flex items-center justify-center
                                   text-white/60 hover:text-white transition-colors rounded-md
                                   hover:bg-white/10"
                        aria-label="Toggle settings"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Content */}
                <div
                    style={{ opacity: open ? 1 : 0, transition: 'opacity 0.15s ease', pointerEvents: open ? 'auto' : 'none' }}
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
