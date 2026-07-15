'use client';

import type { FriendRequest } from '@/hooks/useFriends';
import { Check, X, Clock } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';

interface RequestCardProps {
  request: FriendRequest;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  isProcessing?: boolean;
}

export function RequestCard({ request, onAccept, onDecline, isProcessing }: RequestCardProps) {
  const isIncoming = request.type === 'INCOMING';
  const name = request.user.displayName ?? request.user.username;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-3" style={{ background: 'rgba(95, 178, 255, 0.06)', border: '1px solid rgba(0, 0, 0, 0.16)' }}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-purple))', color: '#fff', fontWeight: 700, fontSize: '12px' }}>
          {getInitials(name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
          <p className="truncate text-xs font-mono-data" style={{ color: 'var(--text-muted)' }}>@{request.user.username} · {formatRelativeTime(request.createdAt)}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isIncoming ? (
          <>
            <button onClick={() => onAccept?.(request.id)} disabled={isProcessing} className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold disabled:opacity-50" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)', color: 'var(--accent-green)' }}>
              <Check size={14} />
            </button>
            <button onClick={() => onDecline?.(request.id)} disabled={isProcessing} className="flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-50" style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.22)', color: 'var(--accent-rose)' }} aria-label="Decline request">
              <X size={14} />
            </button>
          </>
        ) : (
          <button onClick={() => onDecline?.(request.id)} disabled={isProcessing} className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold disabled:opacity-50" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.22)', color: 'var(--accent-amber)' }}>
            <Clock size={13} /> Pending
          </button>
        )}
      </div>
    </div>
  );
}
