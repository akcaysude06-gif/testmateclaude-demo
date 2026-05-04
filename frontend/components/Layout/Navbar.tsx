import React, { useState } from 'react';
import { LogOut, Sparkles, User } from 'lucide-react';

interface NavbarProps {
    onLogout: () => void;
    user?: any;
    onLogoClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, user, onLogoClick }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleLogoutClick = () => setShowConfirm(true);
    const handleConfirm = () => { setShowConfirm(false); onLogout(); };
    const handleCancel = () => setShowConfirm(false);

    return (
        <>
        <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
            <div className="px-16">
                <div className="flex items-center justify-between h-16">
                    <button onClick={onLogoClick} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <Sparkles className="w-8 h-8 text-purple-400" />
                        <span className="text-white font-bold text-xl">TestMate</span>
                    </button>

                    {user && (
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
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
                            </div>

                            <button
                                onClick={handleLogoutClick}
                                className="flex items-center space-x-2 text-purple-200 hover:text-white transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
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
