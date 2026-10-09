/**
 * CodeChef API & Web Fetcher
 * Fetches user profile, rating history, recent submissions, and upcoming contests.
 */

import { ccRankStars } from '@/lib/codechef/cc-rank';
import type { UpcomingContest } from '@/lib/contests/types';

export interface CodeChefUser {
  handle: string;
  currentRating: number | null;
  maxRating: number | null;
  stars: string;
  globalRank: number | null;
  countryRank: number | null;
  totalSolved: number;
  contestsAttended: number;
}

export interface CodeChefRatingChange {
  contestId: string;
  contestName: string;
  rank: number | null;
  oldRating: number;
  newRating: number;
  ratingChange: number;
  date: string;
}

export interface CodeChefSubmission {
  id: string;
  problemCode: string;
  problemName: string;
  verdict: string;
  language: string;
  timestamp: string;
  href: string;
}

interface RawRatingEntry {
  code: string;
  name: string;
  rating: string | number;
  rank?: string | number;
  end_date?: string;
  getyear?: string;
  getmonth?: string;
  getday?: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch and parse a CodeChef user's profile.
 */
export async function getCodeChefUser(handle: string): Promise<CodeChefUser> {
  const url = `https://www.codechef.com/users/${encodeURIComponent(handle)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 300 }, // 5 min cache
  });

  if (!res.ok) {
    throw new Error(`CodeChef user '${handle}' not found (HTTP ${res.status})`);
  }

  const html = await res.text();

  // Validate that user exists on the page
  if (html.includes('Could not find') || html.includes('Page Not Found') || !html.includes('user-details-container')) {
    throw new Error(`CodeChef user '${handle}' not found`);
  }

  // Current Rating
  const ratingMatch = html.match(/class="rating-number"[^>]*>([^<]+)</i);
  const currentRating = ratingMatch ? parseInt(ratingMatch[1].trim(), 10) || null : null;

  // Highest Rating
  const highestMatch = html.match(/\(Highest Rating\s*(\d+)\)/i) || html.match(/Highest Rating\s*(\d+)/i);
  const maxRating = highestMatch ? parseInt(highestMatch[1].trim(), 10) : currentRating;

  // Stars
  let stars = currentRating ? ccRankStars(currentRating) : '1★';
  const starsContainer = html.match(/<div class="rating-star">([\s\S]*?)<\/div>/i);
  if (starsContainer) {
    const starCount = (starsContainer[1].match(/&#9733;/g) || []).length;
    if (starCount > 0) stars = `${starCount}★`;
  }

  // Global Rank
  const globalRankMatch = html.match(/Global Rank[^>]*>[\s\S]*?<strong[^>]*>(\d+)</i);
  const globalRank = globalRankMatch ? parseInt(globalRankMatch[1], 10) : null;

  // Country Rank
  const countryRankMatch = html.match(/Country Rank[^>]*>[\s\S]*?<strong[^>]*>(\d+)</i);
  const countryRank = countryRankMatch ? parseInt(countryRankMatch[1], 10) : null;

  // Total Problems Solved
  const problemsSolvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i) ||
                             html.match(/Problems Solved[\s\S]*?(\d+)/i);
  const totalSolved = problemsSolvedMatch ? parseInt(problemsSolvedMatch[1], 10) : 0;

  // Contests Attended from all_rating JSON
  let contestsAttended = 0;
  const allRatingMatch = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/i);
  if (allRatingMatch) {
    try {
      const parsed: RawRatingEntry[] = JSON.parse(allRatingMatch[1]);
      contestsAttended = parsed.length;
    } catch {
      // Ignore JSON parse errors
    }
  }

  return {
    handle,
    currentRating,
    maxRating,
    stars,
    globalRank,
    countryRank,
    totalSolved,
    contestsAttended,
  };
}

/**
 * Fetch contest rating changes for a user from their profile page.
 */
export async function getCodeChefRatingHistory(handle: string): Promise<CodeChefRatingChange[]> {
  const url = `https://www.codechef.com/users/${encodeURIComponent(handle)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const html = await res.text();
  const allRatingMatch = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/i);
  if (!allRatingMatch) return [];

  try {
    const entries: RawRatingEntry[] = JSON.parse(allRatingMatch[1]);
    const history: CodeChefRatingChange[] = [];
    let prevRating = 1500; // CodeChef baseline

    for (const entry of entries) {
      const newRating = typeof entry.rating === 'number' ? entry.rating : parseInt(String(entry.rating), 10) || prevRating;
      const rank = entry.rank != null ? parseInt(String(entry.rank), 10) || null : null;
      const ratingChange = newRating - prevRating;

      let dateIso: string;
      if (entry.end_date) {
        dateIso = new Date(entry.end_date.replace(' ', 'T') + '+05:30').toISOString();
      } else if (entry.getyear && entry.getmonth && entry.getday) {
        const mm = entry.getmonth.padStart(2, '0');
        const dd = entry.getday.padStart(2, '0');
        dateIso = new Date(`${entry.getyear}-${mm}-${dd}T00:00:00Z`).toISOString();
      } else {
        dateIso = new Date().toISOString();
      }

      history.push({
        contestId: entry.code || String(history.length + 1),
        contestName: entry.name || entry.code,
        rank,
        oldRating: prevRating,
        newRating,
        ratingChange,
        date: dateIso,
      });

      prevRating = newRating;
    }

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

/**
 * Fetch recent submissions for a user.
 */
export async function getCodeChefRecentSubmissions(handle: string, maxPages = 2): Promise<CodeChefSubmission[]> {
  const submissions: CodeChefSubmission[] = [];

  for (let page = 0; page < maxPages; page++) {
    try {
      const url = `https://www.codechef.com/recent/user?page=${page}&user_handle=${encodeURIComponent(handle)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 120 },
      });

      if (!res.ok) break;

      const data = await res.json() as { content?: string; max_page?: number };
      const content = data.content || '';
      if (!content) break;

      // Parse table rows from HTML content
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch: RegExpExecArray | null;

      while ((rowMatch = rowRegex.exec(content)) !== null) {
        const rowHtml = rowMatch[1];
        if (rowHtml.includes('<th')) continue; // Skip header

        // Problem Code and Link
        const problemMatch = rowHtml.match(/href='\/[^']*\/problems\/([^']+)'[^>]*>([^<]+)<\/a>/i) ||
                             rowHtml.match(/title='([A-Z0-9_]+)'>/i);
        const problemCode = problemMatch ? problemMatch[1] : '';
        const problemName = problemMatch && problemMatch[2] ? problemMatch[2] : problemCode;
        if (!problemCode) continue;

        // Solution ID
        const solMatch = rowHtml.match(/\/viewsolution\/(\d+)/i);
        const id = solMatch ? solMatch[1] : `${problemCode}-${Date.now()}-${Math.random()}`;

        // Verdict
        let verdict = 'ATTEMPTED';
        if (rowHtml.includes('tick-icon') || rowHtml.includes('accepted')) {
          verdict = 'AC';
        } else if (rowHtml.includes('wrong') || rowHtml.includes('cross-icon')) {
          verdict = 'WA';
        } else if (rowHtml.includes('time') || rowHtml.includes('clock-icon')) {
          verdict = 'TLE';
        } else if (rowHtml.includes('runtime')) {
          verdict = 'RE';
        }

        // Language
        const langMatch = rowHtml.match(/<td\s+title='([^']+)'>\1<\/td>/i);
        const language = langMatch ? langMatch[1] : 'C++';

        // Time: title='11:30 PM 21/11/09' -> HH:mm a DD/MM/YY
        const timeMatch = rowHtml.match(/title='(\d{1,2}:\d{2}\s+[AP]M\s+\d{2}\/\d{2}\/\d{2})'/i);
        let timestampIso = new Date().toISOString();
        if (timeMatch) {
          const parts = timeMatch[1].match(/(\d{1,2}):(\d{2})\s+([AP]M)\s+(\d{2})\/(\d{2})\/(\d{2})/i);
          if (parts) {
            let hour = parseInt(parts[1], 10);
            const min = parts[2];
            const ampm = parts[3].toUpperCase();
            const day = parts[4];
            const month = parts[5];
            const year = '20' + parts[6];
            if (ampm === 'PM' && hour < 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;
            const hh = String(hour).padStart(2, '0');
            timestampIso = new Date(`${year}-${month}-${day}T${hh}:${min}:00+05:30`).toISOString();
          }
        }

        submissions.push({
          id,
          problemCode,
          problemName,
          verdict,
          language,
          timestamp: timestampIso,
          href: `https://www.codechef.com/problems/${problemCode}`,
        });
      }

      if (data.max_page != null && page >= data.max_page) break;
    } catch {
      break;
    }
  }

  return submissions;
}

/**
 * Fetch upcoming CodeChef contests list.
 */
export async function getCodeChefUpcomingContests(): Promise<UpcomingContest[]> {
  const url = 'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!res.ok) return [];

    const data = await res.json() as {
      status?: string;
      future_contests?: Array<{
        contest_id: string;
        contest_code: string;
        contest_name: string;
        contest_start_date_iso?: string;
        contest_duration?: string;
      }>;
    };

    if (data.status !== 'success' || !Array.isArray(data.future_contests)) {
      return [];
    }

    const now = Date.now();
    return data.future_contests
      .filter((c) => c.contest_start_date_iso && new Date(c.contest_start_date_iso).getTime() >= now - 3600000)
      .map((c) => ({
        id: `cc-${c.contest_code}`,
        name: c.contest_name,
        platform: 'CODECHEF' as const,
        startTime: c.contest_start_date_iso!,
        durationSeconds: (parseInt(c.contest_duration || '120', 10) || 120) * 60,
        href: `https://www.codechef.com/${c.contest_code}`,
        registrationOpen: true, // CodeChef contests can always be registered
      }));
  } catch {
    return [];
  }
}
