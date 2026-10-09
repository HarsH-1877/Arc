import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Friend {
  id: string;
  username: string;
  avatarUrl: string | null;
  cfRating: number | null;
  lcRating: number | null;
  ccRating?: number | null;
  friendshipId?: string;
  relationship?: 'NONE' | 'FRIEND' | 'PENDING_INCOMING' | 'PENDING_OUTGOING';
}

export interface FriendRequest {
  id: string;
  user: Friend;
  type: 'INCOMING' | 'OUTGOING';
  createdAt: string;
}

export function useFriends() {
  return useQuery<Friend[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch('/api/friends');
      if (!res.ok) throw new Error('Failed to fetch friends');
      return res.json();
    },
  });
}

export function useFriendRequests() {
  return useQuery<FriendRequest[]>({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const res = await fetch('/api/friends/requests');
      if (!res.ok) throw new Error('Failed to fetch friend requests');
      return res.json();
    },
  });
}

export function useFriendSearch(query: string) {
  return useQuery<Friend[]>({
    queryKey: ['friend-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: query.length >= 2,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friend-search'] });
    },
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'ACCEPT' | 'REJECT' }) => {
      const res = await fetch('/api/friends/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action.toLowerCase()} request`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useUnfriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unfriend');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-search'] });
    },
  });
}
