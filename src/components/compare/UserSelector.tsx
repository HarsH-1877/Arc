'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useDismissOnOutsideClick } from '@/hooks/useDismissOnOutsideClick';
import { useFriends } from '@/hooks/useFriends';

type ArcResult = { id: string; username: string; avatarUrl: string | null };

export function UserSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const { selectedPlatform } = useUIStore();
  const platform = selectedPlatform === 'CODECHEF' ? 'CODECHEF' : selectedPlatform === 'LEETCODE' ? 'LEETCODE' : 'CODEFORCES';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArcResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: friends = [] } = useFriends();
  const ref = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(ref, () => setOpen(false), open);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (response.ok) setResults(await response.json());
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const selectedLabel = useMemo(() => params.get('external') ?? [...friends, ...results].find((item) => item.id === params.get('friend'))?.username ?? 'Search Arc or platform user', [params, results, friends]);
  const visibleArcUsers = query.trim().length >= 2 ? results : friends;
  const selectArc = (id: string) => { setOpen(false); setQuery(''); router.push(`/compare?friend=${id}`); };
  const selectExternal = () => { const handle = query.trim(); if (!handle) return; setOpen(false); router.push(`/compare?external=${encodeURIComponent(handle)}&platform=${platform}`); };

  return <div ref={ref} className="relative w-full max-w-sm">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm" style={{ background: 'rgba(20,23,37,0.9)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <span className="truncate">{selectedLabel}</span><ChevronDown size={16} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
    </button>
    <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: .98 }} transition={{ duration: .15 }} className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border p-1.5 shadow-2xl" style={{ background: 'rgba(15,17,27,0.98)', borderColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)' }}>
      <div className="relative border-b p-1.5" style={{ borderColor: 'var(--border-subtle)' }}><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search Arc ID or ${platform === 'CODECHEF' ? 'CodeChef' : platform === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'} handle`} className="h-8 w-full rounded-md border pl-7 pr-2 text-xs outline-none" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} /></div>
      <div className="max-h-60 overflow-y-auto p-1">
        {query.trim().length < 2 && friends.length > 0 && <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Friends</p>}
        {visibleArcUsers.map((user) => <button key={user.id} type="button" onClick={() => selectArc(user.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/[0.05]"><UserAvatar src={user.avatarUrl} name={user.username} size={26} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{user.username}</span><span className="text-[10px] text-[var(--text-muted)]">Arc user</span></button>)}
        {query.trim().length >= 2 && <button type="button" onClick={selectExternal} className="mt-1 flex w-full items-center gap-2 rounded-lg border px-2 py-2.5 text-left" style={{ borderColor: 'rgba(79,142,247,0.26)', background: 'var(--accent-blue-dim)' }}><UserRound size={16} className="text-[var(--accent-blue)]" /><span className="min-w-0 flex-1 text-xs"><strong>Compare {platform === 'CODECHEF' ? 'CodeChef' : platform === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'} handle</strong><br /><span className="text-[var(--text-muted)]">{query.trim()}</span></span></button>}
        {!loading && query.trim().length < 2 && friends.length === 0 && <p className="px-2 py-4 text-center text-xs text-[var(--text-muted)]">Search any Arc ID or enter a platform handle.</p>}
        {loading && <p className="px-2 py-3 text-center text-xs text-[var(--text-muted)]">Searching Arc users...</p>}
      </div>
    </motion.div>}</AnimatePresence>
  </div>;
}
