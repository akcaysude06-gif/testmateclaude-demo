import React from 'react';
import Navbar from './Navbar';
import SettingsSidebar from './SettingsSidebar';

interface LayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    user?: any;
    onOpenBeginnerMode?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, user, onOpenBeginnerMode }) => {
    const handleBeginnerMode = () => {
        window.location.hash = 'guided';
        onOpenBeginnerMode?.();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Navbar onLogout={onLogout} user={user} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pr-16">
                {children}
            </div>
            <SettingsSidebar onOpenBeginnerMode={handleBeginnerMode} />
        </div>
    );
};

export default Layout;