'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ArcDialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-xl',
            className,
          )}
          style={{
            background: 'var(--bg-surface-1)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
