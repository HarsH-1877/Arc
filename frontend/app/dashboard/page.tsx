'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, ChevronDown, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PlatformHandle {
    id: number;
    platform: 'codeforces' | 'leetcode';
    handle: string;
    is_verified: boolean;
    current_rating: number | null;
    created_at: string;
}

type PlatformFilter = 'overall' | 'codeforces' | 'leetcode';

interface TopicData {
    topic_name: string;
    question_count: number;
}

interface GrowthStats {
    current_ratings: any[];
    rating_change: number;
    percentile: number;
    friends_count: number;
}

interface LeaderboardEntry {
    id: number;
    username: string;
    platform: string;
    current_rating: number;
    rating_change: number;
    profile_picture_url?: string | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, loading, user, token } = useAuth();
    const [handles, setHandles] = useState<PlatformHandle[]>([]);
    const [loadingHandles, setLoadingHandles] = useState(true);
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('codeforces');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

    // Analytics data
    const [topicData, setTopicData] = useState<TopicData[]>([]);
    const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [ratingHistory, setRatingHistory] = useState<any[]>([]);

    // Chart controls
    const [chartMode, setChartMode] = useState<'friends-avg' | 'friends'>('friends');
    const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState<number[]>([999, 998, 997, 996]); // Top 4 friend IDs
    const [availableFriends, setAvailableFriends] = useState<any[]>([]);

    // Refresh controls
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    // Auto-clear refresh error after 3 seconds
    useEffect(() => {
        if (refreshError) {
            const timer = setTimeout(() => {
                setRefreshError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [refreshError]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchHandles();

            // Check for cached data (< 5 minutes old)
            // Include user ID in cache key to prevent showing stale data when switching accounts
            const cacheKey = `dashboard_cache_${user?.id}_${selectedPlatform}_${chartMode}`;
            const cachedData = sessionStorage.getItem(cacheKey);
            const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);

            if (cachedData && cacheTimestamp) {
                const age = Date.now() - parseInt(cacheTimestamp);
                const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

                if (age < CACHE_DURATION) {
                    // Use cached data
                    console.log('📦 Using cached dashboard data (age:', Math.round(age / 1000), 'seconds)');
                    const parsed = JSON.parse(cachedData);
                    setGrowthStats(parsed.growthStats);
                    setRatingHistory(parsed.ratingHistory);
                    setLeaderboard(parsed.leaderboard);
                    setTopicData(parsed.topicData || []);
                    setAvailableFriends(parsed.availableFriends || []);
                    return; // Skip fetching
                }
            }

            // Cache miss or expired - fetch fresh data
            console.log('🔄 Cache miss - fetching fresh data');
            fetchAnalytics();
        }
    }, [isAuthenticated, token]);

    // Refetch analytics when platform filter changes
    useEffect(() => {
        if (isAuthenticated && token && handles.length > 0) {
            // Clear cache and fetch fresh data for new platform
            const cacheKey = `dashboard_cache_${user?.id}_${selectedPlatform}_${chartMode}`;
            sessionStorage.removeItem(cacheKey);
            sessionStorage.removeItem(`${cacheKey}_timestamp`);
            fetchAnalytics();
        }
    }, [selectedPlatform]);

    // Refetch analytics when chart mode changes
    useEffect(() => {
        if (isAuthenticated && token && handles.length > 0) {
            // Clear cache and fetch fresh data for new chart mode
            const cacheKey = `dashboard_cache_${user?.id}_${selectedPlatform}_${chartMode}`;
            sessionStorage.removeItem(cacheKey);
            sessionStorage.removeItem(`${cacheKey}_timestamp`);
            fetchAnalytics();
        }
    }, [chartMode]);

    const fetchHandles = async () => {
        try {
            const response = await fetch(`${API_URL}/api/handles/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setHandles(data.data.handles || []);
            }
        } catch (error) {
            console.error('Error fetching handles:', error);
        } finally {
            setLoadingHandles(false);
        }
    };

    // Validate selected platform against available handles
    useEffect(() => {
        if (loadingHandles) return;

        if (selectedPlatform !== 'overall') {
            const hasPlatform = handles.some(h => h.platform === selectedPlatform);
            if (!hasPlatform) {
                setSelectedPlatform('overall');
            }
        }
    }, [handles, loadingHandles, selectedPlatform]);

    const fetchAnalytics = async () => {
        try {
            const platformParam = selectedPlatform !== 'overall' ? `?platform=${selectedPlatform}` : '';

            let fetchedTopics: any[] = [];
            let fetchedGrowthStats: any = null;
            let fetchedLeaderboard: any[] = [];
            let fetchedRatingHistory: any[] = [];
            let fetchedFriends: any[] = [];

            // Fetch topic breakdown
            const topicsResponse = await fetch(`${API_URL}/api/analytics/topic-breakdown${platformParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (topicsResponse.ok) {
                const data = await topicsResponse.json();
                fetchedTopics = data.data.topics || [];
                setTopicData(fetchedTopics);
            }

            // Fetch growth stats
            const growthResponse = await fetch(`${API_URL}/api/analytics/growth-stats${platformParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (growthResponse.ok) {
                const data = await growthResponse.json();
                fetchedGrowthStats = data.data;
                setGrowthStats(fetchedGrowthStats);
            }

            // Fetch leaderboard
            const leaderboardResponse = await fetch(`${API_URL}/api/analytics/friends-leaderboard${platformParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (leaderboardResponse.ok) {
                const data = await leaderboardResponse.json();
                fetchedLeaderboard = data.data.leaderboard || [];
                setLeaderboard(fetchedLeaderboard);
            }

            // Fetch rating history with proper query string construction
            const params = new URLSearchParams();
            if (selectedPlatform !== 'overall') {
                params.append('platform', selectedPlatform);
            }
            if (chartMode) {
                params.append('mode', chartMode);
            }
            const queryString = params.toString() ? `?${params.toString()}` : '';
            const historyResponse = await fetch(`${API_URL}/api/analytics/rating-history${queryString}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (historyResponse.ok) {
                const data = await historyResponse.json();
                console.log('🔍 Rating History Data:', {
                    platform: selectedPlatform,
                    mode: chartMode,
                    sampleData: data.data.history?.slice(0, 2),
                    friendsData: data.data.friends,
                    friendsAvg: data.data.friends_avg?.slice(0, 2)
                });

                // Save available friends if returned
                if (data.data.friends) {
                    fetchedFriends = data.data.friends;
                    setAvailableFriends(fetchedFriends);
                    console.log('📊 Updated availableFriends:', fetchedFriends.map(f => ({ id: f.id, name: f.name, historyLength: f.history?.length })));
                } else {
                    console.log('⚠️ No friends data in API response');
                }

                // Format chart data
                const historyArray = Array.isArray(data.data.history) ? data.data.history : [];
                const formattedData = historyArray
                    .filter((item: any) => item.rating !== null) // Filter out null ratings to avoid spike
                    .map((item: any, index: number) => {
                        const dataPoint: any = {
                            date: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            yourRating: item.rating,  // Normalized 0-100 in Overall, actual rating in platform mode
                        };

                        if (chartMode === 'friends-avg') {
                            // Friends Average mode - show aggregated average
                            const friendAvg = data.data.friends_avg?.find((f: any) =>
                                new Date(f.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === dataPoint.date
                            );
                            dataPoint.friendsAvg = friendAvg?.rating || null;
                        } else if (chartMode === 'friends' && data.data.friends) {
                            // Friends mode - show individual friend lines (top 4)
                            data.data.friends.slice(0, 4).forEach((friend: any) => {
                                const friendPoint = friend.history?.find((h: any) =>
                                    new Date(h.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === dataPoint.date
                                );
                                dataPoint[`friend_${friend.id}`] = friendPoint?.rating || null;
                            });
                        }

                        return dataPoint;
                    });

                console.log('📊 Formatted Chart Data Sample:', formattedData.slice(0, 2));
                console.log('📊 Keys in first dataPoint:', Object.keys(formattedData[0] || {}));
                fetchedRatingHistory = formattedData;
                setRatingHistory(formattedData);
            }

            // Cache all the fetched data
            const cacheKey = `dashboard_cache_${user?.id}_${selectedPlatform}_${chartMode}`;
            const cacheData = {
                topicData: fetchedTopics,
                growthStats: fetchedGrowthStats,
                leaderboard: fetchedLeaderboard,
                ratingHistory: fetchedRatingHistory,
                availableFriends: fetchedFriends
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
            sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
            console.log('💾 Cached dashboard data for', selectedPlatform, chartMode);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    if (loading || loadingHandles) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0f1419]">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // No handles linked - show onboarding prompt
    if (handles.length === 0) {
        return (
            <div className="h-screen bg-[#0f1419] p-6 overflow-hidden">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <p className="mt-2 text-gray-400">Welcome back, {user?.username}!</p>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6">
                            <h2 className="text-xl font-semibold mb-3 text-white">Getting Started</h2>
                            <p className="text-gray-400 mb-4 text-sm">
                                Connect your <span className="inline-flex items-center gap-1"><img src="/cf-logo.webp" alt="" className="w-4 h-4 inline" />Codeforces</span> or <span className="inline-flex items-center gap-1"><img src="/lc-logo.png" alt="" className="w-4 h-4 inline" />LeetCode</span> account to start tracking your progress.
                            </p>
                            <button
                                onClick={() => router.push('/onboarding')}
                                className="rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors"
                            >
                                Link Account
                            </button>
                        </div>

                        <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6">
                            <h2 className="text-xl font-semibold mb-3 text-white">About Arc</h2>
                            <p className="text-gray-400 text-sm">
                                Arc is a peer-relative competitive programming analytics platform. Track your growth
                                and compare progress with friends over time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Get data based on selected platform
    const getDisplayData = () => {
        if (selectedPlatform === 'overall') {
            return handles;
        }
        return handles.filter(h => h.platform === selectedPlatform);
    };

    const displayHandles = getDisplayData();
    const primaryHandle = displayHandles[0];
    const currentRating = primaryHandle?.current_rating || 0;
    const ratingChange = growthStats?.rating_change || 0;
    const percentile = growthStats?.percentile || 50;

    return (
        <div className="h-screen bg-[#0f1419] p-6 overflow-hidden">
            <div className="h-full max-w-[1600px] mx-auto flex flex-col">
                {/* Header with Dropdown */}
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>

                        {/* Platform Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1f2e] border border-gray-700 text-gray-300 text-sm hover:border-gray-600 transition-colors"
                            >
                                {selectedPlatform === 'codeforces' && <img src="/cf-logo.webp" alt="" className="w-4 h-4" />}
                                {selectedPlatform === 'leetcode' && <img src="/lc-logo.png" alt="" className="w-4 h-4" />}
                                <span className="capitalize">{selectedPlatform}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute top-full mt-2 left-0 w-40 rounded-lg bg-[#1a1f2e] border border-gray-700 shadow-xl z-10 overflow-hidden">
                                    <button
                                        onClick={() => { setSelectedPlatform('overall'); setDropdownOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-t-lg transition-colors"
                                    >
                                        Overall
                                    </button>
                                    {handles.some(h => h.platform === 'codeforces') && (
                                        <button
                                            onClick={() => { setSelectedPlatform('codeforces'); setDropdownOpen(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <img src="/cf-logo.webp" alt="" className="w-4 h-4" />
                                                Codeforces
                                            </span>
                                        </button>
                                    )}
                                    {handles.some(h => h.platform === 'leetcode') && (
                                        <button
                                            onClick={() => { setSelectedPlatform('leetcode'); setDropdownOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs ${selectedPlatform === 'leetcode'
                                                ? 'text-green-400 bg-gray-800'
                                                : 'text-gray-300 hover:bg-gray-800'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <img src="/lc-logo.png" alt="" className="w-4 h-4" />
                                                LeetCode
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Refresh Data Icon Button */}
                    <button
                        onClick={async () => {
                            if (refreshing) return;
                            setRefreshing(true);
                            setRefreshError(null);

                            try {
                                const response = await fetch(`${API_URL}/api/handles/refresh`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ platform: selectedPlatform === 'overall' ? 'codeforces' : selectedPlatform })
                                });

                                const data = await response.json();

                                if (response.ok) {
                                    // Refresh analytics data
                                    await fetchAnalytics();
                                    await fetchHandles();
                                } else if (response.status === 429) {
                                    // Cooldown error - show temporary popup
                                    setRefreshError(data.error || 'Please wait before refreshing again');
                                } else {
                                    setRefreshError(data.error || 'Failed to refresh data');
                                }
                            } catch (error) {
                                setRefreshError('Network error. Please try again.');
                            } finally {
                                setRefreshing(false);
                            }
                        }}
                        disabled={refreshing}
                        className={`p-2.5 rounded-lg transition-all ${refreshing
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-300 hover:text-white hover:scale-110 hover:rotate-180'
                            }`}
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Refresh Error Popup - Temporary */}
                {refreshError && (
                    <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg bg-red-500/90 backdrop-blur-sm border border-red-400 text-white text-sm shadow-lg animate-fade-in">
                        {refreshError}
                    </div>
                )}

                {/* Main Content Grid - Optimized for no scroll */}
                <div className="flex-1 grid grid-cols-3 gap-5 min-h-0">
                    {/* Left Column - 2/3 width */}
                    <div className="col-span-2 flex flex-col gap-5 min-h-0">
                        {/* Progress Summary & Growth Insight Row */}
                        <div className="grid grid-cols-3 gap-5">
                            {/* Progress Summary - 2 columns */}
                            <div className="col-span-2 rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6 transition-colors hover:border-white">
                                <h3 className="text-lg font-semibold text-white mb-4">Progress Summary</h3>

                                {selectedPlatform === 'overall' && growthStats ? (
                                    // Show all platforms side-by-side
                                    <div className="flex gap-8">
                                        {handles.map((handle, index) => (
                                            <div key={index} className="flex-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                                                    <img
                                                        src={handle.platform === 'codeforces' ? '/cf-logo.webp' : '/lc-logo.png'}
                                                        alt=""
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="capitalize">{handle.platform}</span>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-bold text-white">{handle.current_rating || 'N/A'}</span>
                                                    <div className="flex items-center text-green-400 text-xs font-medium">
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        +{ratingChange}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Show single platform
                                    <>
                                        <div className="mb-3">
                                            <span className="text-xs text-gray-500">Current Rating</span>
                                        </div>
                                        <div className="flex items-end gap-3 mb-3">
                                            <span className="text-5xl font-bold text-white">{currentRating}</span>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center text-green-400 text-sm font-medium">
                                                    <TrendingUp className="w-4 h-4 mr-1" />
                                                    +{ratingChange}
                                                </div>
                                                <span className="text-xs text-gray-500">Last 30 Days</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-xs">
                                            Improving faster than {percentile}% of your friends.
                                        </p>
                                    </>
                                )}
                            </div>


                            {/* Growth Insight - 1 column */}
                            <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6 flex flex-col transition-colors hover:border-white">
                                <h3 className="text-lg font-semibold text-white mb-4">Growth Insight</h3>
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        // Determine growth status based on rating change and percentile
                                        const isPositiveGrowth = ratingChange > 0;
                                        const isHighPercentile = percentile >= 60;
                                        const isLowPercentile = percentile < 40;

                                        let icon, bgColor, textColor, message;

                                        if (isPositiveGrowth && isHighPercentile) {
                                            // Excellent growth
                                            icon = TrendingUp;
                                            bgColor = 'bg-green-500/20';
                                            textColor = 'text-green-400';
                                            message = `Your growth rate is above ${percentile}% of your peers this month!`;
                                        } else if (isPositiveGrowth) {
                                            // Positive but moderate growth
                                            icon = TrendingUp;
                                            bgColor = 'bg-green-500/20';
                                            textColor = 'text-green-400';
                                            message = 'You\'re making steady progress. Keep it up!';
                                        } else if (ratingChange < 0 && isLowPercentile) {
                                            // Negative growth with low percentile
                                            icon = TrendingDown;
                                            bgColor = 'bg-red-500/20';
                                            textColor = 'text-red-400';
                                            message = 'Your progress has slowed. Time to step up your game!';
                                        } else if (ratingChange < 0) {
                                            // Negative growth but decent percentile
                                            icon = TrendingDown;
                                            bgColor = 'bg-orange-500/20';
                                            textColor = 'text-orange-400';
                                            message = 'Small setback this month, but you\'re still competitive!';
                                        } else {
                                            // No change
                                            icon = null;
                                            bgColor = 'bg-gray-500/20';
                                            textColor = 'text-gray-400';
                                            message = 'Your rating is stable. Challenge yourself with harder problems!';
                                        }

                                        const Icon = icon;

                                        return (
                                            <>
                                                <div className={`p-2.5 rounded-full ${bgColor} flex-shrink-0`}>
                                                    {Icon ? <Icon className={`w-5 h-5 ${textColor}`} /> : (
                                                        <div className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold">−</div>
                                                    )}
                                                </div>
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                    {message}
                                                </p>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Rating Progress Chart - Takes remaining space */}
                        <div className="flex-1 rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6 min-h-0 transition-colors hover:border-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    {selectedPlatform === 'overall' ? 'Overall Progress' : 'Rating Progress'}
                                </h3>

                                {/* Legend in top right with dropdown */}
                                <div className="flex items-center gap-4 text-xs">
                                    {/* You legend item */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-0.5 bg-green-400"></div>
                                        <span className="text-gray-400">You</span>
                                    </div>

                                    {/* Friends legend with integrated dropdown */}
                                    <div className="relative flex items-center gap-2">
                                        {chartMode === 'friends-avg' ? (
                                            // Single line for Friends Avg
                                            <div className="w-3 h-0.5 bg-gray-500"></div>
                                        ) : (
                                            // Multiple colored lines for individual friends
                                            <div className="flex gap-0.5">
                                                {availableFriends.slice(0, 4).map((friend: any, idx: number) => {
                                                    const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
                                                    return (
                                                        <div
                                                            key={idx}
                                                            style={{ backgroundColor: colors[idx] }}
                                                            className="w-2 h-0.5"
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setChartDropdownOpen(!chartDropdownOpen)}
                                            className="flex items-center gap-0.5 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <span>{chartMode === 'friends-avg' ? 'Friends Avg' : 'Top 4 Friends'}</span>
                                            <ChevronDown className="w-3 h-3" />
                                        </button>

                                        {chartDropdownOpen && (
                                            <div className="absolute top-full right-0 mt-1 w-40 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-lg z-20">
                                                <button
                                                    onClick={() => {
                                                        setChartMode('friends-avg');
                                                        setChartDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs rounded-t-lg ${chartMode === 'friends-avg'
                                                        ? 'text-green-400 bg-gray-800'
                                                        : 'text-gray-300 hover:bg-gray-800'
                                                        }`}
                                                >
                                                    Friends Avg
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setChartMode('friends');
                                                        setChartDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs rounded-b-lg ${chartMode === 'friends'
                                                        ? 'text-green-400 bg-gray-800'
                                                        : 'text-gray-300 hover:bg-gray-800'
                                                        }`}
                                                >
                                                    Top 4 Friends
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Rating Chart */}
                            <div className="h-full min-h-0">
                                {ratingHistory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={ratingHistory} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#9CA3AF"
                                                style={{ fontSize: '12px' }}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis
                                                stroke="#9CA3AF"
                                                style={{ fontSize: '12px' }}
                                                domain={selectedPlatform === 'overall' ? [0, 100] : ['dataMin - 100', 'dataMax + 100']}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1a1f2e',
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px',
                                                    color: '#fff'
                                                }}
                                            />

                                            {/* Your rating line - always shown */}
                                            <Line
                                                type="monotone"
                                                dataKey="yourRating"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                dot={false}
                                                name="You"
                                                connectNulls={true}
                                            />

                                            {/* Conditional friend lines based on mode */}
                                            {chartMode === 'friends-avg' ? (
                                                <Line
                                                    type="monotone"
                                                    dataKey="friendsAvg"
                                                    stroke="#6B7280"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="Friends Avg"
                                                    connectNulls={true}
                                                />
                                            ) : (
                                                <>
                                                    {(() => {
                                                        console.log('🎨 Rendering friend lines. availableFriends count:', availableFriends?.length);
                                                        console.log('🎨 Friend IDs:', availableFriends?.slice(0, 4).map(f => f.id));
                                                        return availableFriends.slice(0, 4).map((friend: any, idx: number) => {
                                                            const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
                                                            console.log(`🎨 Creating Line for ${friend.name} with dataKey: friend_${friend.id}`);
                                                            return (
                                                                <Line
                                                                    key={friend.id}
                                                                    type="monotone"
                                                                    dataKey={`friend_${friend.id}`}
                                                                    stroke={colors[idx]}
                                                                    strokeWidth={2}
                                                                    dot={false}
                                                                    name={friend.name}
                                                                    connectNulls={true}
                                                                />
                                                            );
                                                        });
                                                    })()}
                                                </>
                                            )}
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-gray-500 text-sm">Loading chart data...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - 1/3 width */}
                    <div className="flex flex-col gap-5 min-h-0">
                        {/* Topic-wise Questions Solved */}
                        <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-5 h-[280px] flex flex-col transition-colors hover:border-white">
                            <h3 className="text-lg font-semibold text-white mb-4">Topic-wise Questions</h3>
                            {/* Scrollable container */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="flex flex-wrap gap-2">
                                    {topicData.map((topic, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-700/50 text-sm w-fit"
                                        >
                                            <span className="text-gray-300 text-xs">{topic.topic_name}</span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white font-medium text-xs">
                                                {topic.question_count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Friends Leaderboard - Takes remaining space */}
                        <div
                            className="flex-1 rounded-2xl bg-[#1a2338] border-2 border-blue-500/50 p-5 min-h-0 overflow-auto leaderboard-autohide-scroll transition-colors hover:border-blue-400 cursor-pointer"
                            onClick={() => setShowLeaderboardModal(true)}
                            title="Click to expand"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">Friends Leaderboard</h3>
                            <div className="space-y-0 divide-y divide-gray-700/50">
                                {leaderboard.length === 0 ? (
                                    <p className="text-gray-500 text-xs text-center py-4">
                                        No friends yet. Add friends to see leaderboard!
                                    </p>
                                ) : (
                                    leaderboard.map((entry, index) => {
                                        const isYou = entry.id === user?.id;
                                        const getTrendIcon = () => {
                                            if (entry.rating_change > 0) return { icon: TrendingUp, color: 'text-green-400' };
                                            if (entry.rating_change < 0) return { icon: TrendingDown, color: 'text-red-400' };
                                            return { icon: null, color: 'text-gray-400' };
                                        };
                                        const { icon: TrendIcon, color } = getTrendIcon();

                                        // Medal emojis for top 3
                                        const getMedal = (rank: number) => {
                                            if (rank === 0) return '🥇';
                                            if (rank === 1) return '🥈';
                                            if (rank === 2) return '🥉';
                                            return `${rank + 1}.`;
                                        };

                                        return (
                                            <div key={entry.id} className="flex items-center justify-between py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-300 w-6 text-base">{getMedal(index)}</span>
                                                    <span className="text-white text-sm font-medium">
                                                        {isYou ? 'You' : entry.username}
                                                    </span>
                                                </div>
                                                <div className={`flex items-center gap-1 ${color}`}>
                                                    {TrendIcon && <TrendIcon className="w-3 h-3" />}
                                                    <span className="font-medium text-xs">
                                                        {entry.rating_change === 0 && '→ '}
                                                        {entry.current_rating || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Leaderboard Modal */}
            {showLeaderboardModal && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                    onClick={() => setShowLeaderboardModal(false)}
                >
                    <div
                        className="bg-[#1F2937] rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Friends Leaderboard</h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Rankings based on {selectedPlatform === 'overall' ? 'overall performance across platforms' : selectedPlatform + ' performance'}.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowLeaderboardModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content - Scrollable with custom scrollbar */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 leaderboard-modal-scroll">
                            {leaderboard.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    No friends yet. Add friends to see leaderboard!
                                </p>
                            ) : (
                                leaderboard.map((entry, index) => {
                                    const isYou = entry.id === user?.id;
                                    const isFirstPlace = index === 0;
                                    const getTrendIcon = () => {
                                        if (entry.rating_change > 0) return { icon: TrendingUp, color: 'text-green-400' };
                                        if (entry.rating_change < 0) return { icon: TrendingDown, color: 'text-red-400' };
                                        return { icon: null, color: 'text-gray-400' };
                                    };
                                    const { icon: TrendIcon, color } = getTrendIcon();

                                    const getMedalIcon = (rank: number) => {
                                        if (rank === 0) return '🥇';
                                        if (rank === 1) return '🥈';
                                        if (rank === 2) return '🥉';
                                        return null; // No medal for rank 4+
                                    };

                                    // Generate avatar background color based on username
                                    const getAvatarColor = (name: string) => {
                                        const colors = [
                                            'bg-green-400', 'bg-blue-400', 'bg-purple-400',
                                            'bg-pink-400', 'bg-yellow-400', 'bg-red-400'
                                        ];
                                        const index = name.charCodeAt(0) % colors.length;
                                        return colors[index];
                                    };

                                    const medal = getMedalIcon(index);

                                    // First place has special larger layout
                                    if (isFirstPlace) {
                                        return (
                                            <div
                                                key={entry.id}
                                                className="relative rounded-2xl p-6 bg-gradient-to-br from-yellow-500/10 via-gray-800/70 to-orange-500/10 border-2 border-yellow-500/60 shadow-lg shadow-yellow-500/20"
                                            >
                                                {/* Glow effect */}
                                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-500/5 to-orange-500/5 blur-xl -z-10"></div>

                                                <div className="flex items-center justify-between">
                                                    {/* Left: Avatar + Name */}
                                                    <div className="flex items-center gap-4">
                                                        {/* Avatar */}
                                                        <div className={`w-20 h-20 rounded-full ${!entry.profile_picture_url ? getAvatarColor(entry.username) : ''} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                                                            {entry.profile_picture_url ? (
                                                                <img
                                                                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${entry.profile_picture_url}`}
                                                                    alt={entry.username}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <svg className="w-11 h-11 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* Name */}
                                                        <div className="text-white font-semibold text-xl">
                                                            {isYou ? 'You' : entry.username}
                                                        </div>
                                                    </div>

                                                    {/* Right: Medal + Rating */}
                                                    <div className="flex items-center gap-8">
                                                        {/* Medal */}
                                                        <div className="text-5xl">
                                                            {medal}
                                                        </div>

                                                        {/* Rating & Change */}
                                                        <div className="text-right">
                                                            <div className="text-gray-400 text-sm mb-1">Rating</div>
                                                            <div className="text-white font-bold text-3xl">
                                                                {entry.current_rating || 'N/A'}
                                                            </div>
                                                            {entry.rating_change !== 0 && (
                                                                <div className={`flex items-center gap-1 justify-end ${color} font-semibold text-base mt-1`}>
                                                                    {TrendIcon && <TrendIcon className="w-4 h-4" />}
                                                                    <span>
                                                                        {entry.rating_change > 0 && '+'}
                                                                        {entry.rating_change}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Ranks 2-4+
                                    return (
                                        <div
                                            key={entry.id}
                                            className="rounded-xl p-4 bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                {/* Left: Rank Badge + Avatar + Name */}
                                                <div className="flex items-center gap-3">
                                                    {/* Rank Badge */}
                                                    <div className="text-gray-500 text-base font-semibold w-8">
                                                        #{index + 1}
                                                    </div>
                                                    {/* Avatar */}
                                                    <div className={`w-12 h-12 rounded-full ${!entry.profile_picture_url ? getAvatarColor(entry.username) : ''} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                                                        {entry.profile_picture_url ? (
                                                            <img
                                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${entry.profile_picture_url}`}
                                                                alt={entry.username}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Name */}
                                                    <div className="text-white font-semibold text-base">
                                                        {isYou ? 'You' : entry.username}
                                                    </div>
                                                </div>

                                                {/* Right: Medal + Rating */}
                                                <div className="flex items-center gap-6">
                                                    {/* Medal Icon */}
                                                    <div className="text-4xl">
                                                        {medal}
                                                    </div>

                                                    {/* Rating & Change */}
                                                    <div className="text-right">
                                                        <div className="text-gray-400 text-xs mb-1">Rating</div>
                                                        <div className="text-white font-bold text-xl">
                                                            {entry.current_rating || 'N/A'}
                                                        </div>
                                                        {entry.rating_change !== 0 && (
                                                            <div className={`flex items-center gap-1 justify-end ${color} font-semibold text-sm mt-0.5`}>
                                                                {TrendIcon && <TrendIcon className="w-3.5 h-3.5" />}
                                                                <span>
                                                                    {entry.rating_change > 0 && '+'}
                                                                    {entry.rating_change}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {entry.rating_change === 0 && (
                                                            <div className="flex items-center gap-1 justify-end text-gray-500 font-medium text-sm mt-0.5">
                                                                <span>→</span>
                                                                <span>─</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-hide scrollbar styles */}
            <style jsx>{`
                .leaderboard-autohide-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: transparent transparent;
                    transition: scrollbar-color 0.3s;
                }

                .leaderboard-autohide-scroll:hover,
                .leaderboard-autohide-scroll:focus-within {
                    scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
                }

                .leaderboard-autohide-scroll::-webkit-scrollbar {
                    width: 6px;
                }

                .leaderboard-autohide-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }

                .leaderboard-autohide-scroll::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 3px;
                    transition: background-color 0.3s;
                }

                .leaderboard-autohide-scroll:hover::-webkit-scrollbar-thumb,
                .leaderboard-autohide-scroll:focus-within::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.5);
                }

                .leaderboard-autohide-scroll:hover::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(107, 114, 128, 0.7);
                }

                /* Modal scrollbar - always visible but styled */
                .leaderboard-modal-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
                }

                .leaderboard-modal-scroll::-webkit-scrollbar {
                    width: 8px;
                }

                .leaderboard-modal-scroll::-webkit-scrollbar-track {
                    background: rgba(31, 41, 55, 0.3);
                    border-radius: 4px;
                }

                .leaderboard-modal-scroll::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, rgba(75, 85, 99, 0.6), rgba(107, 114, 128, 0.6));
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .leaderboard-modal-scroll::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, rgba(107, 114, 128, 0.8), rgba(156, 163, 175, 0.8));
                }
            `}</style>
        </div>
    );
}
