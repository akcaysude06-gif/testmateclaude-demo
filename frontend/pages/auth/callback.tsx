import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // This page is just a placeholder
        // The actual callback is handled by success.tsx
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="text-white text-center">
                <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Processing GitHub authentication...</p>
            </div>
        </div>
    );
}