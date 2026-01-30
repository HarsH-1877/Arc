'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

function OAuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setToken } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const errorParam = searchParams.get('error');

            console.log('========== CALLBACK PAGE ==========');
            console.log('Token from URL:', token ? token.substring(0, 50) + '...' : 'null');
            console.log('Error param:', errorParam);

            if (errorParam) {
                setError(`Authentication failed: ${errorParam}`);
                setTimeout(() => router.push('/login'), 3000);
                return;
            }

            if (token) {
                // Store token IMMEDIATELY - multiple times to ensure it sticks
                console.log('Storing token in localStorage...');
                localStorage.setItem('arc_token', token);

                // Verify storage immediately
                const stored = localStorage.getItem('arc_token');
                console.log('Token stored. Verification:', stored ? 'SUCCESS' : 'FAILED');

                if (!stored) {
                    console.error('CRITICAL: Token failed to store in localStorage!');
                    // Try again
                    localStorage.setItem('arc_token', token);
                }

                // Also store in sessionStorage as backup
                sessionStorage.setItem('arc_token_backup', token);

                if (setToken) {
                    setToken(token);
                }

                // Decode JWT to get username without making API call
                try {
                    // JWT structure: header.payload.signature
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    );
                    const payload = JSON.parse(jsonPayload);

                    console.log('Decoded payload:', payload);
                    const existingParam = searchParams.get('existing');
                    const query = existingParam ? `?existing=${existingParam}` : '';

                    // Small delay to ensure localStorage write completes
                    setTimeout(() => {
                        // New users (no username) go to setup-account
                        // Existing users go to onboarding
                        if (!payload.username || payload.username.trim() === '') {
                            console.log('Redirecting to setup-account');
                            router.push(`/setup-account${query}`);
                        } else {
                            console.log('Redirecting to onboarding');
                            router.push(`/onboarding${query}`);
                        }
                    }, 100);
                } catch (err) {
                    console.error('Failed to decode token:', err);
                    const existingParam = searchParams.get('existing');
                    const query = existingParam ? `?existing=${existingParam}` : '';
                    setTimeout(() => router.push(`/setup-account${query}`), 100);
                }
            } else {
                console.log('No token in URL, redirecting to login');
                setError('No authentication token received');
                setTimeout(() => router.push('/login'), 3000);
            }
            console.log('===================================');
        };

        handleCallback();
    }, [searchParams, router, setToken]);

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">❌</div>
                    <h2 className="text-xl font-bold text-red-400 mb-2">Authentication Failed</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-gray-100 mb-2">Completing sign in...</h2>
                <p className="text-gray-400">Please wait</p>
            </div>
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-gray-100 mb-2">Loading...</h2>
                    <p className="text-gray-400">Please wait</p>
                </div>
            </div>
        }>
            <OAuthCallbackContent />
        </Suspense>
    );
}
