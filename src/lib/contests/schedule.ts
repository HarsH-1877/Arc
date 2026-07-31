import { getCFContests } from '@/lib/fetchers/codeforces';
import type { ContestCalendarEvent, UpcomingContest, UserContestHistoryItem } from '@/lib/contests/types';

const LC_WEEKLY_QUERY = `
  query upcomingContests {
    upcomingContests {
      title
      titleSlug
      startTime
      duration
    }
  }
`;

interface LCUpcomingRaw {
  title: string;
  titleSlug: string;
  startTime: number;
  duration: number;
}

async function fetchLCUpcomingContests(): Promise<LCUpcomingRaw[]> {
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
        'User-Agent': 'ProjectArc/1.0',
      },
      body: JSON.stringify({ query: LC_WEEKLY_QUERY }),
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const body = (await res.json()) as { data?: { upcomingContests?: LCUpcomingRaw[] } };
      const contests = body.data?.upcomingContests ?? [];
      if (contests.length) return contests;
    }
  } catch {
    // Continue to LeetCode's public contest feed below.
  }

  // LeetCode's GraphQL schedule endpoint occasionally returns an empty list.
  // Their contest feed keeps the upcoming rounds available as a stable fallback.
  const fallback = await fetch('https://leetcode.com/contest/api/list/', {
    headers: { Referer: 'https://leetcode.com', 'User-Agent': 'ProjectArc/1.0' },
    next: { revalidate: 300 },
  });
  if (!fallback.ok) return [];
  const body = await fallback.json() as {
    contest?: Array<{ title: string; title_slug: string; start_time: number; duration: number }>;
  };
  return (body.contest ?? []).map((contest) => ({
    title: contest.title,
    titleSlug: contest.title_slug,
    startTime: contest.start_time,
    duration: contest.duration,
  }));
}

function formatContestTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function cfContestHref(contestId: number) {
  return `https://codeforces.com/contest/${contestId}`;
}

function cfContestRegistrationHref(contestId: number) {
  return `https://codeforces.com/contestRegistration/${contestId}`;
}

function lcContestHref(slug: string) {
  return `https://leetcode.com/contest/${slug}`;
}

/** Global contest schedule from Codeforces and LeetCode (cached ~5 min via fetch revalidate). */
export async function fetchContestSchedule(): Promise<UpcomingContest[]> {
  const now = Math.floor(Date.now() / 1000);
  const twoWeeksAgo = now - 14 * 86400;
  const contests: UpcomingContest[] = [];

  try {
    const cfContests = await getCFContests();
    for (const contest of cfContests) {
      if (contest.startTimeSeconds < twoWeeksAgo) continue;
      if (contest.phase === 'BEFORE' && contest.startTimeSeconds > now) {
        const registrationOpen = contest.startTimeSeconds - now <= 24 * 60 * 60;
        contests.push({
          id: `cf-${contest.id}`,
          name: contest.name,
          platform: 'CODEFORCES',
          startTime: new Date(contest.startTimeSeconds * 1000).toISOString(),
          durationSeconds: contest.durationSeconds,
          href: registrationOpen ? cfContestRegistrationHref(contest.id) : cfContestHref(contest.id),
          registrationOpen,
        });
        continue;
      }

      if (['CODED', 'PENDING_SYSTEM_TEST', 'SYSTEM_TEST'].includes(contest.phase)) {
        contests.push({
          id: `cf-${contest.id}`,
          name: contest.name,
          platform: 'CODEFORCES',
          startTime: new Date(contest.startTimeSeconds * 1000).toISOString(),
          durationSeconds: contest.durationSeconds,
          href: cfContestHref(contest.id),
          registrationOpen: false,
        });
      }

      if (contest.phase === 'FINISHED') {
        contests.push({
          id: `cf-${contest.id}`,
          name: contest.name,
          platform: 'CODEFORCES',
          startTime: new Date(contest.startTimeSeconds * 1000).toISOString(),
          durationSeconds: contest.durationSeconds,
          href: cfContestHref(contest.id),
          registrationOpen: false,
        });
      }
    }
  } catch {
    // CF schedule is best-effort for calendar display
  }

  try {
    const lcContests = await fetchLCUpcomingContests();
    for (const contest of lcContests) {
      if (contest.startTime < twoWeeksAgo) continue;
      contests.push({
        id: `lc-${contest.titleSlug}`,
        name: contest.title,
        platform: 'LEETCODE',
        startTime: new Date(contest.startTime * 1000).toISOString(),
        durationSeconds: contest.duration,
        href: lcContestHref(contest.titleSlug),
      });
    }
  } catch {
    // LC schedule is best-effort
  }

  return contests.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/** @deprecated alias */
export async function fetchUpcomingContests(): Promise<UpcomingContest[]> {
  const now = Date.now();
  return (await fetchContestSchedule()).filter((contest) => new Date(contest.startTime).getTime() >= now);
}

export function buildContestCalendarEvents(
  history: UserContestHistoryItem[],
  schedule: UpcomingContest[],
  attendedContestKeys: Set<string>,
): ContestCalendarEvent[] {
  const events: ContestCalendarEvent[] = [];
  const now = Date.now();

  for (const contest of history.slice(0, 12)) {
    events.push({
      date: contest.date,
      label: contest.name,
      platform: contest.platform,
      type: 'given',
      delta: contest.ratingChange,
      contestId: contest.id,
      href: contest.href,
    });
  }

  for (const contest of schedule) {
    const startMs = new Date(contest.startTime).getTime();
    const date = contest.startTime.slice(0, 10);
    const key = `${contest.platform}:${date}:${contest.name}`;
    const alreadyListed = events.some(
      (event) => event.date === date && event.label === contest.name && event.platform === contest.platform,
    );
    if (alreadyListed || attendedContestKeys.has(key)) continue;

    if (startMs >= now) {
      events.push({
        date,
        label: contest.name,
        platform: contest.platform,
        type: 'upcoming',
        href: contest.href,
      });
      continue;
    }

    const endedMs = startMs + contest.durationSeconds * 1000;
    if (endedMs >= now - 14 * 86400000) {
      events.push({
        date,
        label: contest.name,
        platform: contest.platform,
        type: 'missed',
        href: contest.href,
      });
    }
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function contestResultsToHistory(
  rows: Array<{
    id: string;
    platform: 'CODEFORCES' | 'LEETCODE';
    contestId: string;
    contestName: string;
    rank: number | null;
    ratingChange: number | null;
    newRating: number | null;
    timestamp: Date;
    metadata?: { solved?: number; total?: number; oldRating?: number } | null;
  }>,
): UserContestHistoryItem[] {
  return rows
    .map((row) => {
      const ratingChange = row.ratingChange ?? 0;
      const after = row.newRating ?? 0;
      const before = row.metadata?.oldRating ?? after - ratingChange;
      const dateIso = row.timestamp.toISOString();
      return {
        id: row.id,
        name: row.contestName,
        platform: row.platform,
        date: dateIso.slice(0, 10),
        time: formatContestTime(dateIso),
        before,
        after,
        ratingChange,
        rank: row.rank,
        solved: row.metadata?.solved ?? 0,
        total: row.metadata?.total ?? (row.platform === 'LEETCODE' ? 4 : 7),
        href:
          row.platform === 'CODEFORCES'
            ? `https://codeforces.com/contest/${row.contestId}`
            : lcContestHref(row.contestId.replace(/^\d+-/, '').replace(/-+/g, '-').toLowerCase()),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function mergeRatingChartData(
  cfHistory: Array<{ date: string; rating: number; contestId?: number }>,
  lcHistory: Array<{ date: string; rating: number }>,
) {
  const byDate = new Map<string, { date: string; cfRating?: number; lcRating?: number }>();

  for (const point of cfHistory) {
    const day = point.date.slice(0, 10);
    const existing = byDate.get(day) ?? { date: point.date };
    existing.cfRating = point.rating;
    byDate.set(day, existing);
  }

  for (const point of lcHistory) {
    const day = point.date.slice(0, 10);
    const existing = byDate.get(day) ?? { date: point.date };
    existing.lcRating = point.rating;
    if (!existing.date) existing.date = point.date;
    byDate.set(day, existing);
  }

  return Array.from(byDate.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
