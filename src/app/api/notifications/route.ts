import { NextResponse } from 'next/server';
import { USE_MOCK_DATA, MOCK_NOTIFICATIONS } from '@/lib/mock';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { fetchUpcomingContests } from '@/lib/contests/schedule';

export async function GET() {
  if (USE_MOCK_DATA) return NextResponse.json(MOCK_NOTIFICATIONS);

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const [stored, connections, upcoming] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    db.platformConnection.findMany({
      where: { userId: session.id },
      select: { platform: true },
    }),
    fetchUpcomingContests().catch(() => []),
  ]);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const connectedPlatforms = new Set(connections.map((connection) => connection.platform));
  const contestReminders = upcoming
    .filter((contest) => {
      const start = new Date(contest.startTime);
      return connectedPlatforms.has(contest.platform) && start >= today && start < tomorrow;
    })
    .map((contest) => ({
      id: `contest-${contest.id}`,
      type: 'CONTEST_REMINDER',
      title: `${contest.platform === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'} contest today`,
      body: `${contest.name} starts at ${new Date(contest.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`,
      read: false,
      createdAt: contest.startTime,
      metadata: { href: contest.href, contestId: contest.id },
    }));

  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  // Filter out notifications that were read more than 2 hours ago
  const validStored = stored.filter((notification) => {
    if (!notification.read) return true;
    const meta = notification.metadata as Record<string, any> | null;
    const readAtIso = meta?.readAt;
    if (readAtIso) {
      const readAtMs = new Date(readAtIso).getTime();
      return now - readAtMs < twoHoursMs;
    }
    // Fallback if readAt is not set: keep read notifications for up to 2 hours
    return now - notification.createdAt.getTime() < twoHoursMs;
  });

  return NextResponse.json([
    ...contestReminders,
    ...validStored.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      metadata: notification.metadata as Record<string, unknown> | null,
    })),
  ]);
}

export async function PATCH(req: Request) {
  const { id } = await req.json();
  if (USE_MOCK_DATA) {
    const updated = MOCK_NOTIFICATIONS.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    return NextResponse.json(updated);
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!id || String(id).startsWith('contest-')) return NextResponse.json({ ok: true });

  const existing = await db.notification.findFirst({
    where: { id, userId: session.id },
  });

  if (existing) {
    const existingMeta = (existing.metadata as Record<string, any>) || {};
    await db.notification.update({
      where: { id: existing.id },
      data: {
        read: true,
        metadata: { ...existingMeta, readAt: new Date().toISOString() },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
