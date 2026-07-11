'use client';

import { Card } from '@/components/shared/Card';
import { getInitials } from '@/lib/utils';
import { Edit2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MOCK_PROFILE } from '@/lib/mock/data';

export function UserProfileMini() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) return MOCK_PROFILE;
      return res.json();
    },
  });

  const name = profile?.displayName ?? profile?.username ?? 'User';
  const initials = getInitials(name);

  return (
    <Card variant="base" className="items-center" padding="20px">
      <div 
        className="relative flex items-center justify-center rounded-full shrink-0"
        style={{
          width: '52px',
          height: '52px',
          background: 'var(--bg-raised)',
          border: '2px solid var(--border-blue)',
          boxShadow: '0 0 16px var(--blue-glow)',
        }}
      >
        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--blue-bright)' }}>
          {initials}
        </span>
      </div>

      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: '12px' }}>
        Welcome back,
      </span>
      <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-1)', marginTop: '2px' }}>
        {name}
      </span>

      <button
        className="absolute interactive-transition"
        style={{
          top: '20px',
          right: '20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
      >
        <Edit2 size={14} style={{ color: 'inherit', transition: 'color 180ms ease' }} color="var(--text-3)" />
      </button>
    </Card>
  );
}
