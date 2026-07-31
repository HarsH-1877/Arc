'use client';

import { Card } from '@/components/shared/Card';
import { ArcDialog } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function DangerSettingsPage() {
  const [confirmText, setConfirmText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmText === 'delete my account';

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/profile', { method: 'DELETE' });
      if (!response.ok) throw new Error('Account deletion failed');
      await signOut(auth);
      toast.success('Account deleted');
      setDialogOpen(false);
      window.location.replace('/');
    } catch {
      toast.error('Could not complete deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card padding="22px" className="gap-6" variant="base">
        <div className="absolute inset-0 rounded-[var(--r-lg)]" style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)', pointerEvents: 'none' }} />
        <div className="relative z-10">
          <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Delete account</h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <div className="max-w-md space-y-4">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "delete my account" to enable'
              className="h-10 w-full rounded-md px-3 text-sm outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              disabled={!canDelete}
              onClick={() => setDialogOpen(true)}
              className="flex h-10 items-center gap-2 rounded-md px-6 text-sm font-semibold disabled:opacity-50"
              style={{ color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', cursor: canDelete ? 'pointer' : 'not-allowed' }}
            >
              <AlertTriangle size={16} />
              Delete account
            </button>
          </div>
        </div>
      </Card>

      <ArcDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Delete your account?" description="All platform data, friends, and streaks will be removed permanently.">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setDialogOpen(false)} className="h-9 rounded-md px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--danger)', color: '#fff' }}>
            {isDeleting ? 'Deleting...' : 'Confirm delete'}
          </button>
        </div>
      </ArcDialog>
    </div>
  );
}
