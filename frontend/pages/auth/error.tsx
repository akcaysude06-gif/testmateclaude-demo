import { useRouter } from 'next/router';
import { AlertCircle } from 'lucide-react';

export default function AuthError() {
    const router = useRouter();
    const { message } = router.query;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-red-500/30 max-w-md w-full">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Authentication Failed</h1>
                    <p className="text-red-300 mb-6">
                        {message || 'An error occurred during authentication'}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}