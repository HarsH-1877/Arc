// User types
export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
}

export interface UserPublicProfile {
    id: number;
    username: string;
    created_at: Date;
    handles: PlatformHandle[];
}

// Platform types
export type Platform = 'codeforces' | 'leetcode';

export interface PlatformHandle {
    id: number;
    user_id: number;
    platform: Platform;
    handle: string;
    is_verified: boolean;
    verification_token?: string;
    current_rating: number | null;
    created_at: Date;
    updated_at: Date;
}

// Snapshot types
export interface Snapshot {
    id: number;
    user_id: number;
    platform: Platform;
    timestamp: Date;
    rating: number;
    total_solved: number;
    topic_breakdown: Record<string, number>;
    created_at: Date;
}

export interface CreateSnapshotDTO {
    user_id: number;
    platform: Platform;
    rating: number;
    total_solved: number;
    topic_breakdown: Record<string, number>;
}

// Friend types
export interface Friend {
    id: number;
    user_id: number;
    friend_id: number;
    created_at: Date;
}

export interface FriendRequest {
    id: number;
    sender_id: number;
    receiver_id: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: Date;
    updated_at: Date;
}

// Analytics types
export interface GrowthMetrics {
    rating_change_30d: number;
    rating_change_90d: number;
    problems_solved_30d: number;
    problems_solved_90d: number;
    current_rating: number;
}

export interface PeerComparison {
    user_metrics: GrowthMetrics;
    friend_median: GrowthMetrics;
    percentile_30d: number; // 0-100
    percentile_90d: number;
}

export interface TopicStrength {
    topic: string;
    user_count: number;
    friend_avg_count: number;
    relative_strength: 'strong' | 'neutral' | 'weak';
}

export interface HeadToHeadComparison {
    user1: {
        id: number;
        username: string;
        current_rating: number;
        growth_30d: number;
        growth_90d: number;
        topics: Record<string, number>;
    };
    user2: {
        id: number;
        username: string;
        current_rating: number;
        growth_30d: number;
        growth_90d: number;
        topics: Record<string, number>;
    };
    summary: string;
    topic_comparison: {
        topic: string;
        user1_count: number;
        user2_count: number;
        leader: 'user1' | 'user2' | 'tie';
    }[];
}

// Dashboard types
export interface DashboardData {
    progress_summary: {
        current_rating: number;
        rating_change_30d: number;
        total_solved: number;
        platform: Platform | 'overall';
    };
    growth_insight: string | null; // null when no friends
    topic_breakdown: Record<string, number>;
    rating_history: {
        timestamp: Date;
        rating: number;
    }[];
    friends_data?: {
        // Only present when user has friends
        mode: 'all_friends' | 'friends_avg';
        selected_friends?: number[]; // IDs of selected friends (max 4)
        friend_ratings: {
            friend_id: number;
            username: string;
            ratings: {
                timestamp: Date;
                rating: number;
            }[];
        }[];
        friends_avg?: {
            timestamp: Date;
            avg_rating: number;
        }[];
    };
    friends_cohort?: {
        friend_id: number;
        username: string;
        current_rating: number;
        rank: number;
    }[];
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Auth types
export interface AuthTokenPayload {
    userId: number;
    email: string;
    username?: string | null;
    emailVerified?: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    username: string;
    email: string;
    password: string;
}
