'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Users, ChevronDown, ArrowUp, ArrowDown, Search, Flame, Trophy } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler,
    Title,
    Tooltip,
    Legend
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Friend {
    id: number;
    username: string;
    email: string;
}

interface Snapshot {
    platform: string;
    timestamp: string;
    rating: number;
    total_solved: number;
}

interface UserData {
    id: number;
    username: string;
    current_ratings: { [key: string]: number };
    rating_changes: { [key: string]: number };
    problems_solved: number;
    snapshots: Snapshot[];
}

interface OverviewData {
    you: UserData;
    friend: UserData;
}

interface TopicData {
    you: {
        username: string;
        topics: Array<{ topic_name: string; count: number }>;
    };
    friend: {
        username: string;
        topics: Array<{ topic_name: string; count: number }>;
    };
}

interface ConsistencyData {
    you: {
        username: string;
        daily_activity: Array<{ date: string; count: number }>;
        current_streak: number;
        longest_streak: number;
        active_days: number;
        active_days_percentage: number;
        avg_gap_days: number;
    };
    friend: {
        username: string;
        daily_activity: Array<{ date: string; count: number }>;
        current_streak: number;
        longest_streak: number;
        active_days: number;
        active_days_percentage: number;
        avg_gap_days: number;
    };
}

// Activity Heatmap Component
interface ActivityHeatmapProps {
    data: Array<{ date: string; count: number }>;
    colorScheme: 'blue' | 'green';
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, colorScheme }) => {
    const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

    // Create a map of date => count
    const activityMap = new Map(data.map(d => [d.date, d.count]));

    // Generate last 6 months of dates
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    // Get color based on activity count and scheme
    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-800';

        if (colorScheme === 'blue') {
            if (count <= 2) return 'bg-blue-900/40';
            if (count <= 5) return 'bg-blue-700/60';
            return 'bg-blue-500';
        } else {
            if (count <= 2) return 'bg-green-900/40';
            if (count <= 5) return 'bg-green-700/60';
            return 'bg-green-500';
        }
    };

    // Build calendar grid (7 rows for days of week, columns for weeks)
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    const startDate = new Date(sixMonthsAgo);
    // Start from the first day of the week containing sixMonthsAgo
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const endDate = new Date(today);

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        currentWeek.push(new Date(currentDate));

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add remaining days
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        weeks.push(currentWeek);
    }

    // Transpose to get days in rows
    const dayRows: Date[][] = [];
    for (let day = 0; day < 7; day++) {
        const row: Date[] = [];
        for (let week of weeks) {
            row.push(week[day]);
        }
        dayRows.push(row);
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Calculate month labels
    const monthLabels: Array<{ month: string; startCol: number; span: number }> = [];
    let currentMonth = -1;
    let monthStartCol = 0;

    weeks.forEach((week, weekIdx) => {
        const weekMonth = week[0].getMonth();
        if (weekMonth !== currentMonth) {
            if (currentMonth !== -1) {
                monthLabels.push({
                    month: new Date(0, currentMonth).toLocaleString('default', { month: 'short' }),
                    startCol: monthStartCol,
                    span: weekIdx - monthStartCol
                });
            }
            currentMonth = weekMonth;
            monthStartCol = weekIdx;
        }
    });

    // Add the last month
    if (currentMonth !== -1) {
        monthLabels.push({
            month: new Date(0, currentMonth).toLocaleString('default', { month: 'short' }),
            startCol: monthStartCol,
            span: weeks.length - monthStartCol
        });
    }

    const handleMouseEnter = (e: React.MouseEvent, date: string, count: number) => {
        setHoveredCell({
            date,
            count,
            x: e.clientX,
            y: e.clientY
        });
    };

    return (
        <div className="relative">
            <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 pr-2 pt-5">
                    {dayLabels.map((label, i) => (
                        <div key={i} className="h-3 flex items-center text-[10px] text-gray-500">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Calendar grid with month labels */}
                <div className="flex-1 overflow-x-auto">
                    {/* Month labels */}
                    <div className="flex gap-1 mb-1 h-4">
                        {monthLabels.map((label, idx) => (
                            <div
                                key={idx}
                                className="text-[10px] text-gray-500"
                                style={{
                                    width: `${label.span * 16}px`,
                                    minWidth: `${label.span * 16}px`
                                }}
                            >
                                {label.month}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="flex flex-col gap-1">
                        {dayRows.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex gap-1">
                                {row.map((date, colIdx) => {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const count = activityMap.get(dateStr) || 0;
                                    const isInRange = date >= sixMonthsAgo && date <= today;

                                    // Check if this is the last day of a month (add spacing after it)
                                    const isLastDayOfMonth = colIdx < row.length - 1 &&
                                        date.getMonth() !== row[colIdx + 1].getMonth();

                                    return (
                                        <div
                                            key={colIdx}
                                            className={`w-3 h-3 rounded-sm ${isInRange ? getColor(count) : 'bg-transparent'} cursor-pointer transition-all hover:ring-1 hover:ring-gray-400 ${isLastDayOfMonth ? 'mr-3' : ''}`}
                                            onMouseEnter={(e) => isInRange && handleMouseEnter(e, dateStr, count)}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-gray-800" />
                    <div className={`w-3 h-3 rounded-sm ${colorScheme === 'blue' ? 'bg-blue-900/40' : 'bg-green-900/40'}`} />
                    <div className={`w-3 h-3 rounded-sm ${colorScheme === 'blue' ? 'bg-blue-700/60' : 'bg-green-700/60'}`} />
                    <div className={`w-3 h-3 rounded-sm ${colorScheme === 'blue' ? 'bg-blue-500' : 'bg-green-500'}`} />
                </div>
                <span>More</span>
            </div>

            {/* Tooltip - positioned near cursor */}
            {hoveredCell && (
                <div
                    className="fixed bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-700 pointer-events-none z-50"
                    style={{
                        left: `${hoveredCell.x + 10}px`,
                        top: `${hoveredCell.y + 10}px`
                    }}
                >
                    {new Date(hoveredCell.date).toLocaleDateString()}: {hoveredCell.count} {hoveredCell.count === 1 ? 'submission' : 'submissions'}
                </div>
            )}
        </div>
    );
};

export default function ComparePage() {
    const router = useRouter();
    const { isAuthenticated, loading, token } = useAuth();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [friendSearchQuery, setFriendSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'consistency'>('overview');
    const [platformFilter, setPlatformFilter] = useState<'overall' | 'codeforces' | 'leetcode'>('overall');
    const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

    const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
    const [topicData, setTopicData] = useState<TopicData | null>(null);
    const [consistencyData, setConsistencyData] = useState<ConsistencyData | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [availableTopics, setAvailableTopics] = useState<Array<{ name: string, total: number }>>([]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated) {
            // Clear any cached comparison data to ensure fresh data
            sessionStorage.removeItem('comparison_cache');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (token) {
            fetchFriends();
        }
    }, [token]);

    useEffect(() => {
        if (selectedFriend && token) {
            if (activeTab === 'overview') {
                fetchOverviewData();
            } else if (activeTab === 'topics') {
                fetchTopicData();
            } else if (activeTab === 'consistency') {
                fetchConsistencyData();
            }
        }
    }, [selectedFriend, activeTab, platformFilter, token]);

    const fetchFriends = async () => {
        try {
            const response = await fetch(`${API_URL}/api/friends`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const friendsList = data.data.friends || [];
                setFriends(friendsList);
                if (friendsList.length > 0) {
                    setSelectedFriend(friendsList[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const fetchOverviewData = async () => {
        if (!selectedFriend) return;

        setLoadingData(true);
        try {
            const response = await fetch(`${API_URL}/api/compare/${selectedFriend.id}/overview?platform=${platformFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOverviewData(data.data);
            }
        } catch (error) {
            console.error('Error fetching overview:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchTopicData = async () => {
        if (!selectedFriend) return;

        setLoadingData(true);
        try {
            const response = await fetch(`${API_URL}/api/compare/${selectedFriend.id}/topics?platform=${platformFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTopicData(data.data);

                // Calculate available topics sorted by total count
                const topicMap = new Map<string, number>();
                data.data.you.topics.forEach((t: any) => {
                    topicMap.set(t.topic_name, (topicMap.get(t.topic_name) || 0) + t.count);
                });
                data.data.friend.topics.forEach((t: any) => {
                    topicMap.set(t.topic_name, (topicMap.get(t.topic_name) || 0) + t.count);
                });

                const sortedTopics = Array.from(topicMap.entries())
                    .map(([name, total]) => ({ name, total }))
                    .sort((a, b) => b.total - a.total);

                setAvailableTopics(sortedTopics);

                // Set default selected topics to top 6 (or less if not enough)
                const defaultTopics = sortedTopics.slice(0, Math.min(6, sortedTopics.length)).map(t => t.name);
                setSelectedTopics(defaultTopics);
            }
        } catch (error) {
            console.error('Error fetching topics:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchConsistencyData = async () => {
        if (!selectedFriend) return;

        setLoadingData(true);
        try {
            const response = await fetch(`${API_URL}/api/compare/${selectedFriend.id}/consistency?platform=${platformFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setConsistencyData(data.data);
            }
        } catch (error) {
            console.error('Error fetching consistency:', error);
        } finally {
            setLoadingData(false);
        }
    };

    // Fetch data when friend or platform changes
    useEffect(() => {
        if (selectedFriend && token) {
            fetchOverviewData();
        }
    }, [selectedFriend, platformFilter, token]);

    if (loading || !isAuthenticated) {
        return null;
    }

    if (friends.length === 0) {
        return (
            <div className="h-screen bg-[#0f1419] p-6 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">Compare</h1>
                    <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-12 text-center">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No friends to compare with</p>
                        <p className="text-sm text-gray-500 mt-2">Add friends to start comparing your progress</p>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare chart data for Overview tab
    const getLineChartData = () => {
        if (!overviewData) return null;

        const userSnapshots = overviewData.you.snapshots;
        const friendSnapshots = overviewData.friend.snapshots;

        if (platformFilter === 'overall') {
            // Multi-platform mode: show 4 lines (You CF, You LC, Friend CF, Friend LC)
            // Get all unique timestamps from BOTH users (union, not intersection)
            const allTimestamps = [...new Set([
                ...userSnapshots.map(s => new Date(s.timestamp).toISOString().split('T')[0]),
                ...friendSnapshots.map(s => new Date(s.timestamp).toISOString().split('T')[0])
            ])].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

            // DEBUG
            console.log('📊 COMPARISON CHART DEBUG (Frontend):');
            console.log(`  User snapshots: ${userSnapshots.length}`);
            console.log(`  Friend snapshots: ${friendSnapshots.length}`);
            console.log(`  All timestamps (${allTimestamps.length}):`, allTimestamps.slice(0, 10), '...', allTimestamps.slice(-5));
            console.log('  Your CF snapshots:', userSnapshots.filter(s => s.platform === 'codeforces').map(s => ({
                date: new Date(s.timestamp).toLocaleDateString(),
                rating: s.rating
            })));

            return {
                labels: allTimestamps,
                datasets: [
                    {
                        label: 'You (Codeforces)',
                        data: allTimestamps.map(date => {
                            const snapshot = userSnapshots.find(s =>
                                s.platform === 'codeforces' && new Date(s.timestamp).toISOString().split('T')[0] === date
                            );
                            return snapshot ? snapshot.rating : null;
                        }),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        borderWidth: 2.5,
                        pointRadius: 2,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: '#3b82f6',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                    },
                    {
                        label: 'You (LeetCode)',
                        data: allTimestamps.map(date => {
                            const snapshot = userSnapshots.find(s =>
                                s.platform === 'leetcode' && new Date(s.timestamp).toISOString().split('T')[0] === date
                            );
                            return snapshot ? snapshot.rating : null;
                        }),
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168, 85, 247, 0.05)',
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: '#a855f7',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                    },
                    {
                        label: `${overviewData.friend.username} (Codeforces)`,
                        data: allTimestamps.map(date => {
                            const snapshot = friendSnapshots.find(s =>
                                s.platform === 'codeforces' && new Date(s.timestamp).toISOString().split('T')[0] === date
                            );
                            return snapshot ? snapshot.rating : null;
                        }),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: '#10b981',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                    },
                    {
                        label: `${overviewData.friend.username} (LeetCode)`,
                        data: allTimestamps.map(date => {
                            const snapshot = friendSnapshots.find(s =>
                                s.platform === 'leetcode' && new Date(s.timestamp).toISOString().split('T')[0] === date
                            );
                            return snapshot ? snapshot.rating : null;
                        }),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: '#f59e0b',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                    }
                ]
            };
        } else {
            // Single platform mode: show 2 lines (You, Friend)
            const platformSnapshots = {
                you: userSnapshots.filter(s => s.platform === platformFilter),
                friend: friendSnapshots.filter(s => s.platform === platformFilter)
            };

            const allTimestamps = [...new Set([
                ...platformSnapshots.you.map(s => new Date(s.timestamp).toISOString().split('T')[0]),
                ...platformSnapshots.friend.map(s => new Date(s.timestamp).toISOString().split('T')[0])
            ])].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

            return {
                labels: allTimestamps,
                datasets: [
                    {
                        label: 'You',
                        data: allTimestamps.map(date => {
                            const snapshot = platformSnapshots.you.find(s =>
                                new Date(s.timestamp).toISOString().split('T')[0] === date
                            );
                            return snapshot ? snapshot.rating : null;
                        }),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                    },
                    {
                        label: overviewData.friend.username,
                        data: allTimestamps.map(date => {
                            const snapshot = platformSnapshots.friend.find(s =>
                                new Date(s.timestamp).toISOString().split('T')[0] === date
                            );
                            return snapshot ? snapshot.rating : null;
                        }),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                    }
                ]
            };
        }
    };

    // Prepare radar chart data for Topics tab
    const getRadarChartData = () => {
        if (!topicData || selectedTopics.length < 3) return null;

        // Use selected topics
        const youData = selectedTopics.map(topic => {
            const found = topicData.you.topics.find(t => t.topic_name === topic);
            return found ? found.count : 0;
        });

        const friendData = selectedTopics.map(topic => {
            const found = topicData.friend.topics.find(t => t.topic_name === topic);
            return found ? found.count : 0;
        });

        return {
            labels: selectedTopics,
            datasets: [
                {
                    label: 'You',
                    data: youData,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                },
                {
                    label: topicData.friend.username,
                    data: friendData,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                }
            ]
        };
    };

    const toggleTopicSelection = (topicName: string) => {
        setSelectedTopics(prev => {
            if (prev.includes(topicName)) {
                // Don't allow deselecting if we'd go below 3
                if (prev.length <= 3) return prev;
                return prev.filter(t => t !== topicName);
            } else {
                // Don't allow selecting more than 6
                if (prev.length >= 6) return prev;
                return [...prev, topicName];
            }
        });
    };

    // Helper functions to get platform-specific values
    const getCurrentRating = (userData: UserData) => {
        if (platformFilter === 'overall') {
            // Return sum or average of all platforms
            const ratings = Object.values(userData.current_ratings);
            return ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
        }
        return userData.current_ratings[platformFilter] || 0;
    };

    const getRatingChange = (userData: UserData) => {
        if (platformFilter === 'overall') {
            // Return sum of all platform changes
            const changes = Object.values(userData.rating_changes);
            return changes.length > 0 ? changes.reduce((a, b) => a + b, 0) : 0;
        }
        return userData.rating_changes[platformFilter] || 0;
    };

    const lineChartData = getLineChartData();
    const radarChartData = getRadarChartData();

    return (
        <div className="h-screen bg-[#0f1419] p-6 overflow-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                {/* Header with Friend Selector */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-white">Comparison</h1>

                        {/* Friend Selector Dropdown with Search */}
                        <div className="relative w-80">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#1a1f2e] border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                                <span className="text-white font-medium">
                                    {selectedFriend?.username || 'Select Friend'}
                                </span>
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            </button>

                            {showDropdown && (
                                <div className="absolute top-full mt-2 w-full rounded-xl bg-[#1a1f2e] border border-gray-700 overflow-hidden z-10 shadow-xl">
                                    {/* Search Input */}
                                    <div className="p-3 border-b border-gray-700">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search friends..."
                                                value={friendSearchQuery}
                                                onChange={(e) => setFriendSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>

                                    {/* Friends List */}
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {friends
                                            .filter(friend =>
                                                friend.username.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
                                                friend.email.toLowerCase().includes(friendSearchQuery.toLowerCase())
                                            )
                                            .map((friend) => (
                                                <button
                                                    key={friend.id}
                                                    onClick={() => {
                                                        setSelectedFriend(friend);
                                                        setShowDropdown(false);
                                                        setFriendSearchQuery('');
                                                    }}
                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors ${selectedFriend?.id === friend.id ? 'bg-gray-800/50' : ''
                                                        }`}
                                                >
                                                    <p className="text-white font-medium">{friend.username}</p>
                                                    <p className="text-xs text-gray-400">{friend.email}</p>
                                                </button>
                                            ))}
                                        {friends.filter(friend =>
                                            friend.username.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
                                            friend.email.toLowerCase().includes(friendSearchQuery.toLowerCase())
                                        ).length === 0 && (
                                                <p className="text-gray-400 text-sm text-center py-4">No friends found</p>
                                            )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {selectedFriend && (
                    <>
                        {/* User vs Friend Header with Stats */}
                        <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6 mb-6">
                            <div className="grid grid-cols-3 gap-8 items-center">
                                {/* You Stats */}
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center mb-3">
                                        <span className="text-white font-bold text-2xl">
                                            {overviewData?.you.username?.charAt(0).toUpperCase() || 'Y'}
                                        </span>
                                    </div>
                                    <p className="text-white font-semibold mb-3">You</p>

                                    {overviewData && (
                                        <div className="flex items-center gap-3 w-full justify-center">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-400 text-sm">Questions: <span className="text-white font-medium">{overviewData.you.problems_solved}</span></span>
                                                {overviewData.you.problems_solved > overviewData.friend.problems_solved && (
                                                    <ArrowUp className="w-3.5 h-3.5 text-green-400" />
                                                )}
                                                {overviewData.you.problems_solved < overviewData.friend.problems_solved && (
                                                    <ArrowDown className="w-3.5 h-3.5 text-red-400" />
                                                )}
                                            </div>
                                            <span className="text-gray-400">|</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-400 text-sm">Rating: <span className="text-white font-medium">{getCurrentRating(overviewData.you)}</span></span>
                                                {getCurrentRating(overviewData.you) > getCurrentRating(overviewData.friend) && (
                                                    <ArrowUp className="w-3.5 h-3.5 text-green-400" />
                                                )}
                                                {getCurrentRating(overviewData.you) < getCurrentRating(overviewData.friend) && (
                                                    <ArrowDown className="w-3.5 h-3.5 text-red-400" />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* VS with Platform Filter */}
                                <div className="flex flex-col items-center">
                                    {/* Platform Filter Dropdown */}
                                    <div className="relative mb-3">
                                        <button
                                            onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                                            className="px-3 py-1.5 pr-8 bg-gray-800 text-white text-xs rounded-lg border border-gray-600 hover:border-gray-500 focus:outline-none cursor-pointer min-w-[120px] flex items-center justify-center capitalize relative"
                                        >
                                            {platformFilter === 'overall' ? 'Overall' : (
                                                <span className="flex items-center gap-1.5">
                                                    <img
                                                        src={platformFilter === 'codeforces' ? '/cf-logo.webp' : '/lc-logo.png'}
                                                        alt=""
                                                        className="w-3.5 h-3.5"
                                                    />
                                                    {platformFilter}
                                                </span>
                                            )}
                                            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" />
                                        </button>
                                        {showPlatformDropdown && (
                                            <div className="absolute top-full mt-1 left-0 w-full rounded-lg bg-[#1a1f2e] border border-gray-700 shadow-xl z-10 overflow-hidden">
                                                <button
                                                    onClick={() => { setPlatformFilter('overall'); setShowPlatformDropdown(false); }}
                                                    className="w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 transition-colors flex items-center justify-center"
                                                >
                                                    Overall
                                                </button>
                                                <button
                                                    onClick={() => { setPlatformFilter('codeforces'); setShowPlatformDropdown(false); }}
                                                    className="w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 transition-colors flex items-center justify-center"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <img src="/cf-logo.webp" alt="" className="w-3.5 h-3.5" />
                                                        Codeforces
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => { setPlatformFilter('leetcode'); setShowPlatformDropdown(false); }}
                                                    className="w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 transition-colors flex items-center justify-center"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <img src="/lc-logo.png" alt="" className="w-3.5 h-3.5" />
                                                        LeetCode
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-2xl font-bold text-gray-600 mb-2">VS</div>
                                    {overviewData && (
                                        <p className="text-center text-gray-400 text-xs">
                                            {getRatingChange(overviewData.you) > getRatingChange(overviewData.friend)
                                                ? "You're improving faster!"
                                                : getRatingChange(overviewData.you) < getRatingChange(overviewData.friend)
                                                    ? `${selectedFriend.username} is improving faster`
                                                    : "Both improving equally"}
                                        </p>
                                    )}
                                </div>

                                {/* Friend Stats */}
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center mb-3">
                                        <span className="text-white font-bold text-2xl">
                                            {selectedFriend.username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-white font-semibold mb-3">{selectedFriend.username}</p>

                                    {overviewData && (
                                        <div className="flex items-center gap-2 w-full justify-center">
                                            <span className="text-gray-400 text-sm">Questions: <span className="text-white font-medium">{overviewData.friend.problems_solved}</span></span>
                                            <span className="text-gray-400">|</span>
                                            <span className="text-gray-400 text-sm">Rating: <span className="text-white font-medium">{getCurrentRating(overviewData.friend)}</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 mb-6 border-b border-gray-800">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'overview'
                                    ? 'text-blue-400 border-blue-400'
                                    : 'text-gray-400 border-transparent hover:text-gray-300'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('topics')}
                                className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'topics'
                                    ? 'text-blue-400 border-blue-400'
                                    : 'text-gray-400 border-transparent hover:text-gray-300'
                                    }`}
                            >
                                Topic Analysis
                            </button>
                            <button
                                onClick={() => setActiveTab('consistency')}
                                className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'consistency'
                                    ? 'text-blue-400 border-blue-400'
                                    : 'text-gray-400 border-transparent hover:text-gray-300'
                                    }`}
                            >
                                Consistency
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Rating Progress Chart */}
                                <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6">
                                    <h3 className="text-lg font-semibold text-white mb-6">
                                        Rating Progress (Last 180 Days)
                                    </h3>
                                    {lineChartData && (
                                        <div className="h-80">
                                            <Line
                                                data={lineChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    interaction: {
                                                        mode: 'index',
                                                        intersect: false,
                                                    },
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                            align: 'end',
                                                            labels: {
                                                                color: '#e5e7eb',
                                                                font: {
                                                                    size: 12,
                                                                    weight: 500
                                                                },
                                                                padding: 16,
                                                                usePointStyle: true,
                                                                pointStyle: 'circle',
                                                                boxWidth: 8,
                                                                boxHeight: 8,
                                                            }
                                                        },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                                            titleColor: '#f3f4f6',
                                                            bodyColor: '#e5e7eb',
                                                            borderColor: '#374151',
                                                            borderWidth: 1,
                                                            padding: 12,
                                                            displayColors: true,
                                                            boxPadding: 6,
                                                            usePointStyle: true,
                                                            callbacks: {
                                                                title: (context) => {
                                                                    return context[0].label || '';
                                                                },
                                                                label: (context) => {
                                                                    const label = context.dataset.label || '';
                                                                    const value = context.parsed.y;
                                                                    return value !== null ? ` ${label}: ${Math.round(value)}` : '';
                                                                }
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        x: {
                                                            grid: {
                                                                color: 'rgba(55, 65, 81, 0.3)',
                                                                lineWidth: 1,
                                                            },
                                                            ticks: {
                                                                color: '#9ca3af',
                                                                font: { size: 11 },
                                                                maxRotation: 45,
                                                                minRotation: 45,
                                                            }
                                                        },
                                                        y: {
                                                            beginAtZero: false,
                                                            grid: {
                                                                color: 'rgba(55, 65, 81, 0.3)',
                                                                lineWidth: 1,
                                                            },
                                                            ticks: {
                                                                color: '#9ca3af',
                                                                font: { size: 11 },
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'topics' && (
                            <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-8">
                                <h3 className="text-lg font-semibold text-white mb-6">
                                    Topic Strengths Comparison
                                </h3>

                                {/* 2-Column Grid Layout */}
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Left Column - Radar Chart (2/3 width) */}
                                    <div className="col-span-2">
                                        {radarChartData && (
                                            <div className="h-[500px] flex items-center justify-center">
                                                <div className="w-full h-full">
                                                    <Radar
                                                        data={radarChartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    position: 'top',
                                                                    labels: {
                                                                        color: '#9ca3af',
                                                                        font: { size: 14 },
                                                                        padding: 20,
                                                                        usePointStyle: true,
                                                                    }
                                                                }
                                                            },
                                                            scales: {
                                                                r: {
                                                                    beginAtZero: true,
                                                                    grid: {
                                                                        color: '#374151',
                                                                        lineWidth: 1
                                                                    },
                                                                    angleLines: {
                                                                        color: '#374151',
                                                                        lineWidth: 1
                                                                    },
                                                                    pointLabels: {
                                                                        color: '#9ca3af',
                                                                        font: {
                                                                            size: 14,
                                                                            weight: 500
                                                                        },
                                                                        padding: 15
                                                                    },
                                                                    ticks: {
                                                                        color: '#6b7280',
                                                                        backdropColor: 'transparent',
                                                                        font: { size: 12 },
                                                                        stepSize: 10
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column - Topic Selector Box (1/3 width) */}
                                    <div className="col-span-1">
                                        {availableTopics.length > 0 && (
                                            <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-4 h-[500px] flex flex-col">
                                                <h4 className="text-sm font-semibold text-white mb-2">
                                                    Select Topics
                                                </h4>
                                                <p className="text-xs text-gray-400 mb-3">
                                                    Choose 3-6 topics ({selectedTopics.length}/6)
                                                </p>

                                                {/* Scrollable Topic List */}
                                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                                    {availableTopics.map((topic) => (
                                                        <button
                                                            key={topic.name}
                                                            onClick={() => toggleTopicSelection(topic.name)}
                                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTopics.includes(topic.name)
                                                                ? 'bg-blue-600 text-white font-medium'
                                                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                                                                }`}
                                                            disabled={!selectedTopics.includes(topic.name) && selectedTopics.length >= 6}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="truncate">{topic.name}</span>
                                                                <span className="text-xs opacity-75 ml-2 flex-shrink-0">
                                                                    {topic.total}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {selectedTopics.length < 3 && (
                                                    <p className="text-xs text-red-400 mt-3">
                                                        Select at least 3 topics
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'consistency' && consistencyData && (
                            <div className="space-y-6">
                                {/* Stats Cards Row */}
                                <div className="grid grid-cols-4 gap-4">
                                    {/* Current Streak */}
                                    <div className="rounded-xl bg-[#1a1f2e] border border-gray-800 p-4">
                                        <p className="text-xs text-gray-400 mb-1">Current Streak</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Flame className="w-6 h-6 text-orange-500" />
                                                <span className="text-xl font-bold text-blue-400">{consistencyData.you.current_streak}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">vs</p>
                                                <span className="text-lg font-semibold text-green-400">{consistencyData.friend.current_streak}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Longest Streak */}
                                    <div className="rounded-xl bg-[#1a1f2e] border border-gray-800 p-4">
                                        <p className="text-xs text-gray-400 mb-1">Longest Streak</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-6 h-6 text-yellow-500" />
                                                <span className="text-xl font-bold text-blue-400">{consistencyData.you.longest_streak}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">vs</p>
                                                <span className="text-lg font-semibold text-green-400">{consistencyData.friend.longest_streak}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Days */}
                                    <div className="rounded-xl bg-[#1a1f2e] border border-gray-800 p-4">
                                        <p className="text-xs text-gray-400 mb-1">Active Days (6mo)</p>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-xl font-bold text-blue-400">{consistencyData.you.active_days_percentage}%</span>
                                                <p className="text-xs text-gray-500">{consistencyData.you.active_days}/180</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">vs</p>
                                                <span className="text-lg font-semibold text-green-400">{consistencyData.friend.active_days_percentage}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Average Gap */}
                                    <div className="rounded-xl bg-[#1a1f2e] border border-gray-800 p-4">
                                        <p className="text-xs text-gray-400 mb-1">Avg Gap</p>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-xl font-bold text-blue-400">{consistencyData.you.avg_gap_days}</span>
                                                <p className="text-xs text-gray-500">days</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">vs</p>
                                                <span className="text-lg font-semibold text-green-400">{consistencyData.friend.avg_gap_days}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Side-by-side Heatmaps */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Your Heatmap - Blue */}
                                    <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6">
                                        <ActivityHeatmap
                                            data={consistencyData.you.daily_activity}
                                            colorScheme="blue"
                                        />
                                    </div>

                                    {/* Friend Heatmap - Green */}
                                    <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6">
                                        <ActivityHeatmap
                                            data={consistencyData.friend.daily_activity}
                                            colorScheme="green"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
