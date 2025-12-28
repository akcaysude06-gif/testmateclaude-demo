import React from 'react';
import { LogOut, Sparkles, User } from 'lucide-react';

interface NavbarProps {
    onLogout: () => void;
    user?: any;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, user }) => {
    return (
        <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <Sparkles className="w-8 h-8 text-purple-400" />
                        <span className="text-white font-bold text-xl">TestMate</span>
                    </div>

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
                                onClick={onLogout}
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
    );
};

export default Navbar;