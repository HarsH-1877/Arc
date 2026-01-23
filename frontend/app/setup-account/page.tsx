'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SetupAccountPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Get token from localStorage (primary) or context (fallback)
        const authToken = localStorage.getItem('arc_token') || token;

        // if (!authToken) {
        //     router.push('/login');
        //     return;
        // }

        // Get user info to pre-fill username suggestion
        const fetchUserInfo = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserEmail(data.data.user.email);
                    // Suggest username from email
                    if (data.data.user.username) {
                        setUsername(data.data.user.username);
                    } else {
                        const emailUsername = data.data.user.email.split('@')[0];
                        setUsername(emailUsername);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch user info:', err);
            }
        };

        fetchUserInfo();
    }, [token, router]);

    useEffect(() => {
        if (searchParams.get('existing') === 'true') {
            toast.info("Welcome back! Please complete your account setup.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!username || username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        if (password && password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('arc_token');
            const response = await fetch(`${API_URL}/api/auth/setup-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username,
                    password: password || undefined // Optional
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Setup failed');
            }

            // Proceed to onboarding
            router.push('/onboarding');
        } catch (err: any) {
            setError(err.message || 'Account setup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-center text-blue-500">Arc</h1>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
                        Complete Your Profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Set up your username and password
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                                Username *
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="johndoe"
                            />
                            <p className="mt-1 text-xs text-gray-500">Minimum 3 characters</p>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Password (optional)
                            </label>
                            <input
                                id="password"
                                type="password"
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Set a password if you want to login with email/password later
                            </p>
                        </div>

                        {/* Confirm Password */}
                        {password && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required={!!password}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Setting up...' : 'Continue to Onboarding'}
                    </button>

                    <div className="rounded-md bg-gray-800/50 border border-gray-700 p-4">
                        <p className="text-xs text-gray-400">
                            💡 <strong>Tip:</strong> Setting a password is optional. You can always sign in with Google, but having a password gives you a backup login method.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
