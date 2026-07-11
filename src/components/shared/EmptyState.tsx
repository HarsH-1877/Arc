import { type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      {/* Icon at 48px */}
      <div
        className="flex items-center justify-center opacity-30"
        style={{ color: 'var(--text-tertiary)', width: 48, height: 48 }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className="mt-4 text-lg font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className="mt-1.5 text-sm max-w-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className={cn(
                'inline-flex items-center justify-center',
                'h-9 px-4 rounded-md text-sm font-medium',
                'transition-opacity hover:opacity-90 active:opacity-75',
              )}
              style={{
                background: 'var(--accent-primary)',
                color: '#ffffff',
              }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className={cn(
                'inline-flex items-center justify-center',
                'h-9 px-4 rounded-md text-sm font-medium',
                'transition-opacity hover:opacity-90 active:opacity-75',
                'cursor-pointer',
              )}
              style={{
                background: 'var(--accent-primary)',
                color: '#ffffff',
              }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
