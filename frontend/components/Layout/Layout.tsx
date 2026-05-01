import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import SettingsSidebar from './SettingsSidebar';

const SIDEBAR_WIDTH = 48;
const EDGE_GAP      = 4;
const FULL_WIDTH_EDGE_GAP = 8;

interface LayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    user?: any;
    onOpenBeginnerMode?: () => void;
    fullWidth?: boolean;
    padding?: string;
    onLogoClick?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, user, onOpenBeginnerMode, fullWidth, padding, onLogoClick }) => {
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
            <Navbar onLogout={onLogout} user={user} onLogoClick={onLogoClick} />
            <div
                className={fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pr-16'}
                style={fullWidth ? { padding: fullWidthPadding } : undefined}
            >
                {children}
            </div>
            <SettingsSidebar onOpenBeginnerMode={handleBeginnerMode} onSideChange={setSidebarSide} />
        </div>
    );
};

export default Layout;