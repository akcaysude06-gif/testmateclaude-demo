import React, { useState } from 'react';
import { Sparkles, GitBranch } from 'lucide-react';
import { apiService } from '../../services/api';

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGithubLogin = async () => {
        setIsLoading(true);
        try {
            // Get GitHub OAuth URL from backend
            const { auth_url } = await apiService.getGithubAuthUrl();

            // Redirect to GitHub OAuth page
            window.location.href = auth_url;
        } catch (error) {
            console.error('Failed to initiate GitHub login:', error);
            alert('Failed to start GitHub login. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2">TestMate</h1>
                        <p className="text-purple-200">AI-Powered Testing Assistant</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleGithubLogin}
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <GitBranch className="w-5 h-5" />
                                    <span>Continue with GitHub</span>
                                </>
                            )}
                        </button>

                        <p className="text-purple-200 text-sm text-center">
                            Secure OAuth authentication • Your code stays private
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-purple-200 text-sm">
                    <p>Learn • Automate • Optimize</p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;