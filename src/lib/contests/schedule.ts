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
  const liveContests: LCUpcomingRaw[] = [];

  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ query: LC_WEEKLY_QUERY }),
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const body = (await res.json()) as { data?: { upcomingContests?: LCUpcomingRaw[] } };
      liveContests.push(...(body.data?.upcomingContests ?? []));
    }
  } catch {
    // Continue
  }

  // Always generate past and upcoming weekly/biweekly contests so the calendar has complete coverage
  const generated: LCUpcomingRaw[] = [];
  const now = Math.floor(Date.now() / 1000);

  // Weekly contests: every Sunday at 02:30 UTC
  // Anchor: Weekly Contest 514 on Sun Aug 9, 2026 02:30 UTC = 1786242600
  const baseWeeklyNum = 514;
  const baseWeeklyTime = 1786242600; // Sun Aug 9 2026 02:30 UTC ✓

  // Use Math.floor to avoid rounding drift — always snap to the most recent or current contest
  const weeksSinceBase = Math.floor((now - baseWeeklyTime) / (7 * 86400));
  const nearestWeeklyNum = baseWeeklyNum + weeksSinceBase;
  const nearestWeeklyTime = baseWeeklyTime + weeksSinceBase * 7 * 86400;

  for (let i = -12; i <= 10; i++) {
    const startTime = nearestWeeklyTime + i * 7 * 86400;
    const contestNum = nearestWeeklyNum + i;
    if (contestNum < 1) continue;
    generated.push({
      title: `Weekly Contest ${contestNum}`,
      titleSlug: `weekly-contest-${contestNum}`,
      startTime,
      duration: 5400,
    });
  }

  // Biweekly contests: every other Saturday at 14:30 UTC
  // Anchor: Biweekly Contest 188 on Sat Aug 1, 2026 14:30 UTC = 1785594600
  const baseBiweeklyNum = 188;
  const baseBiweeklyTime = 1785594600; // Sat Aug 1 2026 14:30 UTC ✓

  const biweeksSinceBase = Math.floor((now - baseBiweeklyTime) / (14 * 86400));
  const nearestBiweeklyNum = baseBiweeklyNum + biweeksSinceBase;
  const nearestBiweeklyTime = baseBiweeklyTime + biweeksSinceBase * 14 * 86400;

  for (let i = -10; i <= 8; i++) {
    const startTime = nearestBiweeklyTime + i * 14 * 86400;
    const contestNum = nearestBiweeklyNum + i;
    if (contestNum < 1) continue;
    generated.push({
      title: `Biweekly Contest ${contestNum}`,
      titleSlug: `biweekly-contest-${contestNum}`,
      startTime,
      duration: 5400,
    });
  }

  // Deduplicate by titleSlug — ALWAYS prefer generated contests over live API data.
  // The LC API frequently returns stale/wrong contest numbers, so we treat generated
  // data as the source of truth and only accept API entries for slugs we didn't generate.
  const map = new Map<string, LCUpcomingRaw>();
  for (const c of generated) map.set(c.titleSlug, c);
  for (const c of liveContests) {
    if (!map.has(c.titleSlug)) {
      map.set(c.titleSlug, c);
    }
  }

  return Array.from(map.values());
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
  const twoMonthsAgo = now - 60 * 86400; // 60 days back so full calendar month is always covered
  const contests: UpcomingContest[] = [];

  try {
    const cfContests = await getCFContests();
    for (const contest of cfContests) {
      if (contest.startTimeSeconds < twoMonthsAgo) continue;
      if (contest.phase === 'BEFORE' && contest.startTimeSeconds > now) {
        // CF opens registration ~3.5 days (84 hours) before the contest.
        // Contests <= 3.5 days away are open, but > 3.5 days away are not yet open.
        const registrationOpen = contest.startTimeSeconds - now <= Math.floor(3.5 * 24 * 60 * 60);
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
      if (contest.startTime < twoMonthsAgo) continue;
      const isUpcoming = contest.startTime > now;
      const daysUntilStart = (contest.startTime - now) / 86400;
      // LC contest pages are live ~7 days before. Generated contests beyond that won't have a valid URL yet.
      const registrationOpen = isUpcoming && daysUntilStart <= 7;
      contests.push({
        id: `lc-${contest.titleSlug}`,
        name: contest.title,
        platform: 'LEETCODE',
        startTime: new Date(contest.startTime * 1000).toISOString(),
        durationSeconds: contest.duration,
        href: lcContestHref(contest.titleSlug),
        registrationOpen,
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

  const attendedDates = new Set(history.map((c) => `${c.platform}:${c.date}`));

  for (const contest of history) {
    events.push({
      date: contest.date,
      startTime: `${contest.date}T${contest.time}:00.000Z`,
      label: contest.name,
      platform: contest.platform,
      type: 'given',
      delta: contest.ratingChange,
      contestId: contest.id,
      href: contest.href,
    });
  }

  // Index schedule contests by platform:date to detect multiple contests on the same day
  const scheduleByPlatformDate = new Map<string, UpcomingContest[]>();
  for (const contest of schedule) {
    const d = contest.startTime.slice(0, 10);
    const k = `${contest.platform}:${d}`;
    if (!scheduleByPlatformDate.has(k)) scheduleByPlatformDate.set(k, []);
    scheduleByPlatformDate.get(k)!.push(contest);
  }

  for (const contest of schedule) {
    const startMs = new Date(contest.startTime).getTime();
    const date = contest.startTime.slice(0, 10);
    const key = `${contest.platform}:${date}:${contest.name}`;
    const datePlatformKey = `${contest.platform}:${date}`;
    const alreadyListed = events.some(
      (event) => event.date === date && event.platform === contest.platform,
    );
    if (alreadyListed || attendedContestKeys.has(key) || attendedDates.has(datePlatformKey)) continue;

    if (startMs >= now) {
      const sameDay = scheduleByPlatformDate.get(datePlatformKey) ?? [contest];
      const isMultiple = sameDay.length > 1;
      const isCf = contest.platform === 'CODEFORCES';
      const registrationOpen = sameDay.some((c) => c.registrationOpen);
      // If multiple CF contests on the same day, take user to the general /contests page
      const href = isMultiple && isCf
        ? 'https://codeforces.com/contests'
        : contest.href;
      const label = isMultiple
        ? sameDay.map((c) => c.name).join(' & ')
        : contest.name;

      events.push({
        date,
        startTime: contest.startTime,
        label,
        platform: contest.platform,
        type: 'upcoming',
        href,
        registrationOpen,
      });
      continue;
    }

    const endedMs = startMs + contest.durationSeconds * 1000;
    if (endedMs >= now - 60 * 86400000) {
      events.push({
        date,
        startTime: contest.startTime,
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
        startTime: dateIso,
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
  if (cfHistory.length === 0 && lcHistory.length === 0) return [];

  // Build per-day lookup maps (keyed to YYYY-MM-DD)
  const cfMap = new Map<string, number>();
  for (const point of cfHistory) cfMap.set(point.date.slice(0, 10), point.rating);

  const lcMap = new Map<string, number>();
  for (const point of lcHistory) lcMap.set(point.date.slice(0, 10), point.rating);

  // Unified sorted date list
  const allDates = Array.from(new Set([...Array.from(cfMap.keys()), ...Array.from(lcMap.keys())])).sort();

  // Forward-fill so each series is continuous across the combined timeline
  let lastCf: number | undefined;
  let lastLc: number | undefined;

  return allDates.map((date) => {
    if (cfMap.has(date)) lastCf = cfMap.get(date);
    if (lcMap.has(date)) lastLc = lcMap.get(date);
    return { date, cfRating: lastCf, lcRating: lastLc };
  });
}
