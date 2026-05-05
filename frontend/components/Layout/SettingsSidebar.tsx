import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, BookOpen, PanelLeft, PanelRight } from 'lucide-react';

const POSITION_KEY = 'testmate_sidebar_position';

interface SettingsSidebarProps {
    onOpenBeginnerMode: () => void;
    onSideChange?: (side: 'left' | 'right') => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ onOpenBeginnerMode, onSideChange }) => {
    const [open, setOpen] = useState(false);
    const [side, setSide] = useState<'left' | 'right'>('right');

    useEffect(() => {
        const savedSide = (localStorage.getItem(POSITION_KEY) || 'right') as 'left' | 'right';
        setSide(savedSide);
        onSideChange?.(savedSide);
    }, []);

    const handleToggleSide = () => {
        const next = side === 'right' ? 'left' : 'right';
        setSide(next);
        localStorage.setItem(POSITION_KEY, next);
        onSideChange?.(next);
        setOpen(false);
    };

    const handlePrivacy = () => {
        window.location.href = '/account';
    };

    const positionClass = side === 'right' ? 'right-0' : 'left-0';
    const borderClass   = side === 'right' ? 'border-l' : 'border-r';

    return (
        <>
            {/* Floating toggle button — only visible when closed */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className={`fixed top-0 ${positionClass} z-50 mt-[10px] mx-2 w-11 h-11 flex items-center justify-center
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
