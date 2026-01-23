'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Link as LinkIcon, Unlink, RefreshCw, ArrowLeft, Edit2, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PlatformHandle {
    id: number;
    platform: 'codeforces' | 'leetcode';
    handle: string;
    is_verified: boolean;
    current_rating: number | null;
    created_at: string;
}

export default function SettingsPage() {
    const { token, user, logout } = useAuth();
    const router = useRouter();
    const [handles, setHandles] = useState<PlatformHandle[]>([]);
    const [loadingHandles, setLoadingHandles] = useState(true);

    // New platform linking state
    const [showLinkForm, setShowLinkForm] = useState<'codeforces' | 'leetcode' | null>(null);
    const [newHandle, setNewHandle] = useState('');
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkError, setLinkError] = useState('');

    // Unlink state
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState<'codeforces' | 'leetcode' | null>(null);
    const [unlinkLoading, setUnlinkLoading] = useState(false);

    // Refresh state
    const [refreshLoading, setRefreshLoading] = useState<'codeforces' | 'leetcode' | null>(null);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Username editing state
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState(user?.username || '');
    const [usernameError, setUsernameError] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);

    // Account deletion state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Profile picture state
    const [profilePicture, setProfilePicture] = useState<string | null>(user?.profile_picture_url || null);
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [uploadingPicture, setUploadingPicture] = useState(false);

    useEffect(() => {
        if (token) {
            fetchHandles();
        }
    }, [token]);

    // Auto-clear refresh error after 3 seconds
    useEffect(() => {
        if (refreshError) {
            const timer = setTimeout(() => {
                setRefreshError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [refreshError]);

    // Auto-clear success message after 4 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchHandles = async () => {
        try {
            const response = await fetch(`${API_URL}/api/handles/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
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

    const handleLinkPlatform = async () => {
        if (!showLinkForm || !newHandle.trim()) return;

        setLinkError('');
        setLinkLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/handles/link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ platform: showLinkForm, handle: newHandle.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to link account');
            }

            // Refresh handles list
            await fetchHandles();
            setShowLinkForm(null);
            setNewHandle('');

            // Auto-refresh the newly linked platform
            try {
                await fetch(`${API_URL}/api/handles/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ platform: showLinkForm })
                });
                // Refresh handles again to get the updated rating
                await fetchHandles();
            } catch (err) {
                console.error('Error auto-refreshing after link:', err);
            }
        } catch (err: any) {
            setLinkError(err.message);
        } finally {
            setLinkLoading(false);
        }
    };

    const isLinked = (platform: 'codeforces' | 'leetcode') => {
        return handles.some(h => h.platform === platform);
    };

    const getHandle = (platform: 'codeforces' | 'leetcode') => {
        return handles.find(h => h.platform === platform);
    };

    const handleUnlinkPlatform = async (platform: 'codeforces' | 'leetcode') => {
        setUnlinkLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/handles/unlink/${platform}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchHandles();
                setShowUnlinkConfirm(null);

                // Show success message with remaining operations
                // Count links created in last 24 hours to show remaining
                const handlesResponse = await fetch(`${API_URL}/api/handles/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (handlesResponse.ok) {
                    const data = await handlesResponse.json();
                    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const recentLinks = data.data.handles.filter((h: any) =>
                        new Date(h.created_at) >= oneDayAgo
                    ).length;
                    const remaining = Math.max(0, 3 - recentLinks);
                    setSuccessMessage(`Account unlinked! You have ${remaining} link(s) remaining today.`);
                }
            } else {
                const data = await response.json();
                setRefreshError(data.error || 'Failed to unlink account');
            }
        } catch (error) {
            console.error('Error unlinking platform:', error);
            setRefreshError('Failed to unlink account');
        } finally {
            setUnlinkLoading(false);
        }
    };

    const handleRefreshPlatform = async (platform: 'codeforces' | 'leetcode') => {
        setRefreshLoading(platform);
        try {
            const response = await fetch(`${API_URL}/api/handles/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ platform })
            });

            if (response.ok) {
                await fetchHandles();
            } else {
                const data = await response.json();
                setRefreshError(data.error || 'Failed to refresh data');
            }
        } catch (error) {
            console.error('Error refreshing platform:', error);
            setRefreshError('Failed to refresh data');
        } finally {
            setRefreshLoading(null);
        }
    };

    const handleUpdateUsername = async () => {
        if (!newUsername.trim() || newUsername === user?.username) {
            setIsEditingUsername(false);
            return;
        }

        setUsernameError('');
        setUsernameLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/update-username`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username: newUsername.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update username');
            }

            // Update was successful, refresh the page to get updated user data
            window.location.reload();
        } catch (err: any) {
            setUsernameError(err.message);
        } finally {
            setUsernameLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/delete-account`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Logout and redirect to login page
                logout();
                router.push('/login');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }
            setProfilePictureFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadProfilePicture = async () => {
        if (!profilePictureFile) return;

        setUploadingPicture(true);
        try {
            const formData = new FormData();
            formData.append('profilePicture', profilePictureFile);

            const response = await fetch(`${API_URL}/api/auth/profile-picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload profile picture');
            }

            // Update local state
            setProfilePicture(`${API_URL}${data.data.profile_picture_url}`);
            setProfilePictureFile(null);
            setProfilePicturePreview(null);
            alert('Profile picture updated successfully!');
        } catch (error: any) {
            console.error('Profile picture upload error:', error);
            alert(error.message || 'Failed to upload profile picture');
        } finally {
            setUploadingPicture(false);
        }
    };

    if (loadingHandles) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0f1419]">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#0f1419] overflow-auto settings-scrollbar">
            {/* Success Message Popup - Slide down from top */}
            {successMessage && (
                <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
                    <div className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-md border border-green-500/30 text-green-400 text-sm shadow-2xl">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {successMessage}
                        </div>
                    </div>
                </div>
            )}

            {/* Error Popup - Premium subtle styling */}
            {refreshError && (
                <div className="fixed top-6 right-6 z-50 animate-fade-in">
                    <div className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-md border border-orange-400/30 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-sm text-orange-100 font-medium">{refreshError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Back Button - Fixed to top-left */}
            <button
                onClick={() => router.push('/dashboard')}
                className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center transition-colors shadow-lg"
                aria-label="Back to Dashboard"
            >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>

            <div className="max-w-4xl mx-auto p-6 pt-20">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="mt-2 text-gray-400">Manage your account and platform connections</p>
                </div>

                {/* Profile & Account Section - Combined */}
                <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Profile & Account</h2>

                    <div className="flex items-start gap-8">
                        {/* Profile Picture with Upload Button */}
                        <div className="flex-shrink-0 relative group">
                            {(profilePicturePreview || profilePicture) ? (
                                <img
                                    src={profilePicturePreview || profilePicture || ''}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-700"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center border-2 border-gray-700">
                                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}

                            {/* Upload Button Overlay */}
                            <label className="absolute bottom-0 right-0 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={handleProfilePictureChange}
                                    className="hidden"
                                />
                                <div className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-[#1a1f2e] flex items-center justify-center transition-colors shadow-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </label>

                            {/* Upload Preview Actions */}
                            {profilePictureFile && (
                                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-900 rounded-lg p-2 shadow-xl border border-gray-700 whitespace-nowrap">
                                    <button
                                        onClick={handleUploadProfilePicture}
                                        disabled={uploadingPicture}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors flex items-center gap-1"
                                    >
                                        {uploadingPicture ? (
                                            <>
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Uploading
                                            </>
                                        ) : (
                                            'Save'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setProfilePictureFile(null);
                                            setProfilePicturePreview(null);
                                        }}
                                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Account Info */}
                        <div className="flex-1 space-y-6">
                            {/* Username */}
                            <div>
                                <label className="text-sm text-gray-400 mb-0.5 block">Username</label>
                                {isEditingUsername ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                            placeholder="Enter new username"
                                            disabled={usernameLoading}
                                        />
                                        {usernameError && (
                                            <p className="text-sm text-red-400">{usernameError}</p>
                                        )}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setIsEditingUsername(false);
                                                    setNewUsername(user?.username || '');
                                                    setUsernameError('');
                                                }}
                                                disabled={usernameLoading}
                                                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateUsername}
                                                disabled={usernameLoading || !newUsername.trim()}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                            >
                                                {usernameLoading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <p className="text-white font-medium text-lg">{user?.username}</p>
                                        <button
                                            onClick={() => setIsEditingUsername(true)}
                                            className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <p className="text-sm text-gray-400 mb-0.5">Email</p>
                                <p className="text-white font-medium">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Connections Section */}
                <div className="rounded-2xl bg-[#1a1f2e] border border-gray-800 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Platform Connections</h2>

                    <div className="space-y-4">
                        {/* Codeforces */}
                        <div className={`rounded-xl border-4 p-5 transition-all ${isLinked('codeforces')
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'border-gray-700 bg-gray-800/50'
                            } `}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w - 12 h - 12 rounded - full flex items - center justify - center ${isLinked('codeforces') ? 'bg-green-500/20' : 'bg-gray-700'
                                        } `}>
                                        {isLinked('codeforces') ? (
                                            <Check className="w-6 h-6 text-green-400" />
                                        ) : (
                                            <LinkIcon className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        {isLinked('codeforces') ? (
                                            <a
                                                href={`https://codeforces.com/profile/${getHandle('codeforces')?.handle}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-lg font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-2 w-fit"
                                            >
                                                <img src="/cf-logo.webp" alt="" className="w-5 h-5" />
                                                Codeforces
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        ) : (
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <img src="/cf-logo.webp" alt="" className="w-5 h-5" />
                                                Codeforces
                                            </h3>
                                        )}
                                        {isLinked('codeforces') ? (
                                            <>
                                                <p className="text-sm text-gray-400">
                                                    {getHandle('codeforces')?.handle}
                                                </p>
                                                {getHandle('codeforces')?.current_rating && (
                                                    <p className="text-sm text-blue-400 font-medium">
                                                        Rating: {getHandle('codeforces')?.current_rating}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500">Not connected</p>
                                        )}
                                    </div>
                                </div>

                                {isLinked('codeforces') ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRefreshPlatform('codeforces')}
                                            disabled={refreshLoading === 'codeforces'}
                                            className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            title="Refresh rating data"
                                        >
                                            <RefreshCw className={`w - 3.5 h - 3.5 ${refreshLoading === 'codeforces' ? 'animate-spin' : ''} `} />
                                            Refresh
                                        </button>
                                        <button
                                            onClick={() => setShowUnlinkConfirm('codeforces')}
                                            className="px-3 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center gap-1"
                                        >
                                            <Unlink className="w-3.5 h-3.5" />
                                            Unlink
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowLinkForm('codeforces')}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Link Account
                                    </button>
                                )}
                            </div>

                            {/* Unlink Confirmation for Codeforces */}
                            {showUnlinkConfirm === 'codeforces' && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <p className="text-sm text-gray-300 mb-3">Are you sure you want to unlink this account? All associated data will be removed.</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowUnlinkConfirm(null)}
                                            disabled={unlinkLoading}
                                            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleUnlinkPlatform('codeforces')}
                                            disabled={unlinkLoading}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {unlinkLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Unlinking...
                                                </>
                                            ) : (
                                                'Confirm Unlink'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Link Form for Codeforces */}
                            {showLinkForm === 'codeforces' && !isLinked('codeforces') && (
                                <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                                    <input
                                        type="text"
                                        value={newHandle}
                                        onChange={(e) => setNewHandle(e.target.value)}
                                        placeholder="Enter your Codeforces handle"
                                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                        disabled={linkLoading}
                                    />
                                    {linkError && (
                                        <p className="text-sm text-red-400">{linkError}</p>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowLinkForm(null);
                                                setNewHandle('');
                                                setLinkError('');
                                            }}
                                            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleLinkPlatform}
                                            disabled={linkLoading || !newHandle.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {linkLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Linking...
                                                </>
                                            ) : (
                                                'Link Account'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* LeetCode */}
                        <div className={`rounded-xl border-4 p-5 transition-all ${isLinked('leetcode')
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'border-gray-700 bg-gray-800/50'
                            } `}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w - 12 h - 12 rounded - full flex items - center justify - center ${isLinked('leetcode') ? 'bg-green-500/20' : 'bg-gray-700'
                                        } `}>
                                        {isLinked('leetcode') ? (
                                            <Check className="w-6 h-6 text-green-400" />
                                        ) : (
                                            <LinkIcon className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        {isLinked('leetcode') ? (
                                            <a
                                                href={`https://leetcode.com/u/${getHandle('leetcode')?.handle}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-lg font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-2 w-fit"
                                            >
                                                <img src="/lc-logo.png" alt="LeetCode" className="w-5 h-5 object-contain" />
                                                LeetCode
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        ) : (
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <img src="/lc-logo.png" alt="LeetCode" className="w-5 h-5 object-contain" />
                                                LeetCode
                                            </h3>
                                        )}
                                        {isLinked('leetcode') ? (
                                            <>
                                                <p className="text-sm text-gray-400">
                                                    {getHandle('leetcode')?.handle}
                                                </p>
                                                {getHandle('leetcode')?.current_rating && (
                                                    <p className="text-sm text-orange-400 font-medium">
                                                        Contest Rating: {getHandle('leetcode')?.current_rating}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500">Not connected</p>
                                        )}
                                    </div>
                                </div>

                                {isLinked('leetcode') ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRefreshPlatform('leetcode')}
                                            disabled={refreshLoading === 'leetcode'}
                                            className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            title="Refresh contest rating"
                                        >
                                            <RefreshCw className={`w - 3.5 h - 3.5 ${refreshLoading === 'leetcode' ? 'animate-spin' : ''} `} />
                                            Refresh
                                        </button>
                                        <button
                                            onClick={() => setShowUnlinkConfirm('leetcode')}
                                            className="px-3 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center gap-1"
                                        >
                                            <Unlink className="w-3.5 h-3.5" />
                                            Unlink
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowLinkForm('leetcode')}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Link Account
                                    </button>
                                )}
                            </div>

                            {/* Unlink Confirmation for LeetCode */}
                            {showUnlinkConfirm === 'leetcode' && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <p className="text-sm text-gray-300 mb-3">Are you sure you want to unlink this account? All associated data will be removed.</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowUnlinkConfirm(null)}
                                            disabled={unlinkLoading}
                                            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleUnlinkPlatform('leetcode')}
                                            disabled={unlinkLoading}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {unlinkLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Unlinking...
                                                </>
                                            ) : (
                                                'Confirm Unlink'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Link Form for LeetCode */}
                            {showLinkForm === 'leetcode' && !isLinked('leetcode') && (
                                <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                                    <input
                                        type="text"
                                        value={newHandle}
                                        onChange={(e) => setNewHandle(e.target.value)}
                                        placeholder="Enter your LeetCode username"
                                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                        disabled={linkLoading}
                                    />
                                    {linkError && (
                                        <p className="text-sm text-red-400">{linkError}</p>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowLinkForm(null);
                                                setNewHandle('');
                                                setLinkError('');
                                            }}
                                            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleLinkPlatform}
                                            disabled={linkLoading || !newHandle.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {linkLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Linking...
                                                </>
                                            ) : (
                                                'Link Account'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Delete Account Section - Danger Zone */}
                <div className="rounded-2xl bg-[#1a1f2e] border-2 border-red-600/50 p-6">
                    <h2 className="text-xl font-semibold text-white mb-2">Danger Zone</h2>
                    <p className="text-sm text-gray-400 mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>

                    {showDeleteConfirm ? (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-300">Are you absolutely sure? This will delete your account, email, and all platform data.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleteLoading}
                                    className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Permanently Delete Account
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                        </button>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .settings-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .settings-scrollbar::-webkit-scrollbar-track {
                    background: rgba(31, 41, 55, 0.3);
                    border-radius: 4px;
                }

                .settings-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, rgba(75, 85, 99, 0.6), rgba(107, 114, 128, 0.6));
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .settings-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, rgba(107, 114, 128, 0.8), rgba(156, 163, 175, 0.8));
                }

                .settings-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(75, 85, 99, 0.6) transparent;
                }
            `}} />
        </div>
    );
}
