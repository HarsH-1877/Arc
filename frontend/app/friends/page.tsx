'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Users, Clock, Check, X, Search, Loader2, UserMinus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Friend {
    id: number;
    username: string;
    email: string;
    friend_since: string;
}

interface FriendRequest {
    request_id: number;
    sender_id: number;
    username: string;
    email: string;
    created_at: string;
}

interface SearchResult {
    id: number;
    username: string;
    email: string;
    relation_status: 'friend' | 'request_sent' | 'request_received' | 'none';
}

export default function FriendsPage() {
    const router = useRouter();
    const { isAuthenticated, loading, token } = useAuth();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    const [friendsLoading, setFriendsLoading] = useState(true);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [friendSearchQuery, setFriendSearchQuery] = useState('');
    const [processingAction, setProcessingAction] = useState<number | null>(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (token) {
            fetchFriends();
            fetchPendingRequests();
        }
    }, [token]);

    const fetchFriends = async () => {
        setFriendsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/friends`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFriends(data.data.friends || []);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setFriendsLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        setRequestsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/friends/requests/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data.data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setRequestsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/friends/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.data.users || []);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const sendFriendRequest = async (receiverId: number) => {
        setProcessingAction(receiverId);
        try {
            const response = await fetch(`${API_URL}/api/friends/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ receiverId })
            });

            if (response.ok) {
                // Update search results to show request sent
                setSearchResults(prev =>
                    prev.map(user =>
                        user.id === receiverId ? { ...user, relation_status: 'request_sent' } : user
                    )
                );
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert('Failed to send friend request');
        } finally {
            setProcessingAction(null);
        }
    };

    const acceptRequest = async (requestId: number) => {
        setProcessingAction(requestId);
        try {
            const response = await fetch(`${API_URL}/api/friends/request/${requestId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchFriends();
                await fetchPendingRequests();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to accept request');
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('Failed to accept request');
        } finally {
            setProcessingAction(null);
        }
    };

    const rejectRequest = async (requestId: number) => {
        setProcessingAction(requestId);
        try {
            const response = await fetch(`${API_URL}/api/friends/request/${requestId}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setPendingRequests(prev => prev.filter(req => req.request_id !== requestId));
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject request');
        } finally {
            setProcessingAction(null);
        }
    };

    const removeFriend = async (friendId: number) => {
        if (!confirm('Are you sure you want to remove this friend?')) return;

        setProcessingAction(friendId);
        try {
            const response = await fetch(`${API_URL}/api/friends/${friendId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setFriends(prev => prev.filter(friend => friend.id !== friendId));
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to remove friend');
            }
        } catch (error) {
            console.error('Error removing friend:', error);
            alert('Failed to remove friend');
        } finally {
            setProcessingAction(null);
        }
    };

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(friendSearchQuery.toLowerCase())
    );

    if (loading || !isAuthenticated) {
        return null;
    }

    return (
        <div className="h-screen bg-[#0f1419] p-6 overflow-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
                    <p className="text-gray-400">Manage your connections and compare progress</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Friends List (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Friends List */}
                        <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-xl font-semibold text-white">
                                        My Friends ({friends.length})
                                    </h2>
                                </div>

                                {/* Search Friends */}
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={friendSearchQuery}
                                        onChange={(e) => setFriendSearchQuery(e.target.value)}
                                        placeholder="Search friends..."
                                        className="w-full rounded-lg border border-gray-700 bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {friendsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">
                                        {friendSearchQuery ? 'No friends found' : 'No friends yet'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {!friendSearchQuery && 'Add friends to compare your progress'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                    {filteredFriends.map((friend) => (
                                        <div
                                            key={friend.id}
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                                    <span className="text-white font-semibold text-sm">
                                                        {friend.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{friend.username}</p>
                                                    <p className="text-xs text-gray-400">
                                                        Friends since {new Date(friend.friend_since).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFriend(friend.id)}
                                                disabled={processingAction === friend.id}
                                                className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            >
                                                {processingAction === friend.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <UserMinus className="w-3.5 h-3.5" />
                                                )}
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Pending Requests & Add Friend (1/3 width) */}
                    <div className="space-y-6">
                        {/* Pending Requests */}
                        <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-orange-400" />
                                <h2 className="text-lg font-semibold text-white">
                                    Pending Requests
                                </h2>
                            </div>

                            {requestsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                </div>
                            ) : pendingRequests.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-8">
                                    No pending requests
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {pendingRequests.map((request) => (
                                        <div
                                            key={request.request_id}
                                            className="p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                                    <span className="text-white font-semibold text-xs">
                                                        {request.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm truncate">
                                                        {request.username}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {request.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => acceptRequest(request.request_id)}
                                                    disabled={processingAction === request.request_id}
                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 text-xs font-medium hover:bg-green-600/30 disabled:opacity-50 transition-colors"
                                                >
                                                    {processingAction === request.request_id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Check className="w-3 h-3" />
                                                    )}
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => rejectRequest(request.request_id)}
                                                    disabled={processingAction === request.request_id}
                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Friend */}
                        <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <UserPlus className="w-5 h-5 text-green-400" />
                                <h2 className="text-lg font-semibold text-white">Add Friend</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by username..."
                                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={searchLoading}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {searchLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Search className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white font-semibold text-xs">
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-medium text-sm truncate">
                                                            {user.username}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                {user.relation_status === 'friend' ? (
                                                    <span className="px-2 py-1 rounded-lg bg-green-600/20 text-green-400 text-xs font-medium">
                                                        Friends
                                                    </span>
                                                ) : user.relation_status === 'request_sent' ? (
                                                    <span className="px-2 py-1 rounded-lg bg-orange-600/20 text-orange-400 text-xs font-medium">
                                                        Pending
                                                    </span>
                                                ) : user.relation_status === 'request_received' ? (
                                                    <span className="px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium">
                                                        Received
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => sendFriendRequest(user.id)}
                                                        disabled={processingAction === user.id}
                                                        className="px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1 flex-shrink-0"
                                                    >
                                                        {processingAction === user.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <UserPlus className="w-3 h-3" />
                                                        )}
                                                        Add
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
