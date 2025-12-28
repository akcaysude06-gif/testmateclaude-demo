import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    user?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Navbar onLogout={onLogout} user={user} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {children}
            </div>
        </div>
    );
};

export default Layout;