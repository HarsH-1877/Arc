'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { formatRelativeTime } from '@/lib/utils';

type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';

interface SyncStatusDotProps {
  status: SyncStatus;
  errorMessage?: string;
  lastSyncedAt?: Date | string | null;
}

interface DotConfig {
  color: string;
  label: string;
  pulsing: boolean;
}

function getDotConfig(
  status: SyncStatus,
  lastSyncedAt: Date | string | null | undefined,
  errorMessage: string | undefined,
): DotConfig {
  switch (status) {
    case 'SYNCING':
      return {
        color: 'var(--text-secondary)',
        label: 'Syncing…',
        pulsing: true,
      };
    case 'SYNCED':
      return {
        color: 'var(--text-secondary)',
        label: lastSyncedAt
          ? `Last synced ${formatRelativeTime(lastSyncedAt)}`
          : 'Synced',
        pulsing: false,
      };
    case 'ERROR':
      return {
        color: 'var(--text-secondary)',
        label: errorMessage ?? 'Sync error',
        pulsing: false,
      };
    case 'PENDING':
    default:
      return {
        color: 'var(--text-muted)',
        label: 'Sync pending',
        pulsing: false,
      };
  }
}

export function SyncStatusDot({
  status,
  errorMessage,
  lastSyncedAt,
}: SyncStatusDotProps) {
  const { color, label, pulsing } = getDotConfig(status, lastSyncedAt, errorMessage);

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {/* Wrapper captures hover; position:relative needed for pulse ring */}
          <span
            className="relative inline-flex items-center justify-center cursor-default"
            style={{ width: 12, height: 12 }}
            aria-label={label}
          >
            {/* Pulse ring for SYNCING */}
            {pulsing && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: color,
                  opacity: 0,
                  animation: 'sync-pulse 1.6s ease-in-out infinite',
                }}
              />
            )}
            {/* Core dot */}
            <span
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                background: color,
                flexShrink: 0,
              }}
            />
          </span>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className="z-50 max-w-[220px] text-xs leading-snug px-2.5 py-1.5 rounded-md"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            {label}
            <Tooltip.Arrow
              style={{ fill: 'var(--border-default)' }}
            />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      {/* Keyframe injected once — scoped to this component's usage */}
      <style>{`
        @keyframes sync-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          60%  { transform: scale(2.6); opacity: 0;   }
          100% { transform: scale(2.6); opacity: 0;   }
        }
      `}</style>
    </Tooltip.Provider>
  );
}
