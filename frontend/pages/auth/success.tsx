import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authUtils } from '../../utils/auth';
import { apiService } from '../../services/api';

export default function AuthSuccess() {
    const router = useRouter();
    const { token } = router.query;

    useEffect(() => {
        const handleAuthSuccess = async () => {
            if (token && typeof token === 'string') {
                try {
                    // Save token
                    authUtils.setToken(token);

                    // Verify token and get user info
                    const user = await apiService.verifyToken(token);
                    authUtils.setUser(user);

                    // Redirect to main app
                    router.push('/');
                } catch (error) {
                    console.error('Auth verification failed:', error);
                    router.push('/auth/error?message=Authentication failed');
                }
            }
        };

        handleAuthSuccess();
    }, [token, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="text-white text-center">
                <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl">Authentication successful!</p>
                <p className="text-purple-300 mt-2">Redirecting to TestMate...</p>
            </div>
        </div>
    );
}