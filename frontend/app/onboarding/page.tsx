'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token } = useAuth();
    const [codeforcesHandle, setCodeforcesHandle] = useState('');
    const [leetcodeHandle, setLeetcodeHandle] = useState('');
    const [linkedPlatforms, setLinkedPlatforms] = useState<{
        codeforces?: boolean;
        leetcode?: boolean;
    }>({});
    const [loading, setLoading] = useState<{
        codeforces?: boolean;
        leetcode?: boolean;
    }>({});
    const [errors, setErrors] = useState<{
        codeforces?: string;
        leetcode?: string;
    }>({});

    // Check if any platforms are already linked
    useEffect(() => {
        const checkLinkedPlatforms = async () => {
            try {
                const response = await fetch(`${API_URL}/api/handles/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const linked: any = {};
                    data.data.handles.forEach((handle: any) => {
                        linked[handle.platform] = true;
                    });
                    setLinkedPlatforms(linked);
                }
            } catch (error) {
                console.error('Error checking linked platforms:', error);
            }
        };

        if (token) {
            checkLinkedPlatforms();
        }
    }, [token]);

    useEffect(() => {
        if (searchParams.get('existing') === 'true') {
            toast.info("Welcome back! You have been logged in to your existing account.");
        }
    }, [searchParams]);

    const handleLinkPlatform = async (platform: 'codeforces' | 'leetcode') => {
        const handle = platform === 'codeforces' ? codeforcesHandle : leetcodeHandle;

        if (!handle.trim()) {
            setErrors(prev => ({ ...prev, [platform]: 'Please enter a handle' }));
            return;
        }

        setErrors(prev => ({ ...prev, [platform]: '' }));
        setLoading(prev => ({ ...prev, [platform]: true }));

        try {
            const response = await fetch(`${API_URL}/api/handles/link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ platform, handle: handle.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to link account');
            }

            // Successfully linked
            setLinkedPlatforms(prev => ({ ...prev, [platform]: true }));
        } catch (err: any) {
            setErrors(prev => ({ ...prev, [platform]: err.message }));
        } finally {
            setLoading(prev => ({ ...prev, [platform]: false }));
        }
    };

    const handleContinue = () => {
        router.push('/dashboard');
    };

    const hasLinkedPlatform = linkedPlatforms.codeforces || linkedPlatforms.leetcode;

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0f1419] px-4">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white">Welcome to Arc</h1>
                    <p className="mt-4 text-lg text-gray-400">
                        Connect your competitive programming accounts to get started
                    </p>
                </div>

                {/* Platform Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Codeforces Card */}
                    <div className={`rounded-2xl border-2 p-6 transition-all ${linkedPlatforms.codeforces
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 bg-[#1a1f2e]'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <img src="/cf-logo.webp" alt="" className="w-5 h-5" />
                                Codeforces
                            </h3>
                            {linkedPlatforms.codeforces && (
                                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                    <Check className="w-5 h-5" />
                                    <span>Connected</span>
                                </div>
                            )}
                        </div>

                        {!linkedPlatforms.codeforces ? (
                            <>
                                <p className="text-sm text-gray-400 mb-4">
                                    Track your Codeforces rating and progress
                                </p>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={codeforcesHandle}
                                        onChange={(e) => setCodeforcesHandle(e.target.value)}
                                        placeholder="Enter your handle"
                                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                        disabled={loading.codeforces}
                                    />

                                    {errors.codeforces && (
                                        <p className="text-sm text-red-400">{errors.codeforces}</p>
                                    )}

                                    <button
                                        onClick={() => handleLinkPlatform('codeforces')}
                                        disabled={loading.codeforces || !codeforcesHandle.trim()}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading.codeforces ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Linking...
                                            </>
                                        ) : (
                                            'Link Account'
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Check className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                <p className="text-gray-300">Your Codeforces account is linked!</p>
                            </div>
                        )}
                    </div>

                    {/* LeetCode Card */}
                    <div className={`rounded-2xl border-2 p-6 transition-all ${linkedPlatforms.leetcode
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 bg-[#1a1f2e]'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <img src="/lc-logo.png" alt="" className="w-5 h-5" />
                                LeetCode
                            </h3>
                            {linkedPlatforms.leetcode && (
                                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                    <Check className="w-5 h-5" />
                                    <span>Connected</span>
                                </div>
                            )}
                        </div>

                        {!linkedPlatforms.leetcode ? (
                            <>
                                <p className="text-sm text-gray-400 mb-4">
                                    Track your LeetCode rating and progress
                                </p>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={leetcodeHandle}
                                        onChange={(e) => setLeetcodeHandle(e.target.value)}
                                        placeholder="Enter your username"
                                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                        disabled={loading.leetcode}
                                    />

                                    {errors.leetcode && (
                                        <p className="text-sm text-red-400">{errors.leetcode}</p>
                                    )}

                                    <button
                                        onClick={() => handleLinkPlatform('leetcode')}
                                        disabled={loading.leetcode || !leetcodeHandle.trim()}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading.leetcode ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Linking...
                                            </>
                                        ) : (
                                            'Link Account'
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Check className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                <p className="text-gray-300">Your LeetCode account is linked!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-4">
                    <button
                        onClick={handleContinue}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Skip for now
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!hasLinkedPlatform}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-white font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Continue to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#0f1419] px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-white mb-2">Loading...</h2>
                    <p className="text-gray-400">Please wait</p>
                </div>
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}
