import React, { useState } from 'react';
import { CheckCircle, GitBranch, ExternalLink, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';

interface AccountConfirmScreenProps {
    user: { username?: string; email?: string; avatar_url?: string };
    onContinue: () => void;
    onSwitchAccount: () => void;
}

const AccountConfirmScreen: React.FC<AccountConfirmScreenProps> = ({ user, onContinue, onSwitchAccount }) => {
    const [step, setStep] = useState<'confirm' | 'switch-guide'>('confirm');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleStartSwitch = () => {
        setStep('switch-guide');
    };

    const handleOpenGithub = () => {
        window.open('https://github.com/login', '_blank', 'noopener,noreferrer');
    };

    const handleConnectNewAccount = async () => {
        setIsConnecting(true);
        authUtils.removeToken();
        authUtils.clearRememberedUser();
        try {
            const { auth_url } = await apiService.getGithubAuthUrl(true);
            window.location.href = auth_url;
        } catch (error) {
            console.error('Failed to initiate GitHub login:', error);
            alert('Failed to start GitHub login. Please try again.');
            onSwitchAccount();
            setIsConnecting(false);
        }
    };

    if (step === 'switch-guide') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/20 rounded-2xl mb-4">
                                <GitBranch className="w-8 h-8 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">Switch GitHub Account</h2>
                            <p className="text-purple-200 text-sm">Follow these steps to log in with a different account</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-start space-x-3 bg-white/5 rounded-xl p-4 border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                                <div>
                                    <p className="text-white text-sm font-medium">Sign out of GitHub</p>
                                    <p className="text-purple-300 text-xs mt-0.5">Open GitHub and sign out of your current account (<span className="text-white font-medium">{user.username}</span>)</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 bg-white/5 rounded-xl p-4 border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                                <div>
                                    <p className="text-white text-sm font-medium">Come back here</p>
                                    <p className="text-purple-300 text-xs mt-0.5">Return to this tab after signing out</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 bg-white/5 rounded-xl p-4 border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                                <div>
                                    <p className="text-white text-sm font-medium">Click "Connect with GitHub"</p>
                                    <p className="text-purple-300 text-xs mt-0.5">You'll be redirected to GitHub to log in with your new account</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleOpenGithub}
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-5 rounded-xl flex items-center justify-center space-x-2 transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Open GitHub to sign out</span>
                            </button>

                            <button
                                onClick={handleConnectNewAccount}
                                disabled={isConnecting}
                                className="w-full bg-purple-500 hover:bg-purple-400 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConnecting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <GitBranch className="w-4 h-4" />
                                        <span>Connect with GitHub</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setStep('confirm')}
                                className="w-full text-purple-300 hover:text-white text-sm py-2 transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500/20 rounded-2xl mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Signed in successfully</h2>
                        <p className="text-purple-200 text-sm">You're logged in with the following account</p>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4 flex items-center space-x-4 mb-6 border border-white/20">
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-14 h-14 rounded-full flex-shrink-0"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-purple-400 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xl font-bold">
                                    {(user.username || '?')[0].toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div>
                            <div className="text-white font-semibold text-lg leading-tight">
                                {user.username}
                            </div>
                            {user.email && (
                                <div className="text-purple-300 text-sm">{user.email}</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={onContinue}
                            className="w-full bg-purple-500 hover:bg-purple-400 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
                        >
                            <span>Continue with this account</span>
                        </button>

                        <button
                            onClick={handleStartSwitch}
                            className="w-full bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all"
                        >
                            <GitBranch className="w-4 h-4" />
                            <span>Login with another account</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountConfirmScreen;
