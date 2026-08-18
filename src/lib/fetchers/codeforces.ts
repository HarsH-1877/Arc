/**
 * Codeforces API fetcher
 * Wraps the public Codeforces REST API endpoints.
 * All functions throw a descriptive Error on failure so callers can
 * decide how to surface it (sync worker catches and sets ERROR status).
 */

const CF_BASE = 'https://codeforces.com/api';

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface CFUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  avatar?: string;
  titlePhoto?: string;
  contribution?: number;
  friendOfCount?: number;
}

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratingUpdateTimeSeconds: number;
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  problem: {
    index: string;
    name: string;
    tags: string[];
    rating?: number;
  };
  verdict?: string;
  programmingLanguage: string;
  creationTimeSeconds: number;
}

// ---------------------------------------------------------------------------
// Raw Codeforces API shapes (internal)
// ---------------------------------------------------------------------------

interface CFApiResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result?: T;
}

interface CFRawUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  avatar?: string;
  titlePhoto?: string;
  contribution?: number;
  friendOfCount?: number;
}

interface CFRawRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratingUpdateTimeSeconds: number;
}

interface CFRawSubmission {
  id: number;
  contestId?: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    tags: string[];
    rating?: number;
  };
  verdict?: string;
  programmingLanguage: string;
  creationTimeSeconds: number;
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

async function cfFetch<T>(endpoint: string): Promise<T> {
  const url = `${CF_BASE}/${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      // Always bypass Next.js cache for fresh data
      next: { revalidate: 0 },
      headers: { 'User-Agent': 'ProjectArc/1.0' },
    });
  } catch (networkErr) {
    throw new Error(
      `Network error reaching Codeforces API: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
  }

  if (!res.ok) {
    throw new Error(`Codeforces API returned HTTP ${res.status} for ${endpoint}`);
  }

  let body: CFApiResponse<T>;
  try {
    body = (await res.json()) as CFApiResponse<T>;
  } catch {
    throw new Error(`Failed to parse Codeforces API response for ${endpoint}`);
  }

  if (body.status !== 'OK') {
    throw new Error(
      `Codeforces API error for ${endpoint}: ${body.comment ?? 'Unknown error'}`,
    );
  }

  if (body.result === undefined) {
    throw new Error(`Codeforces API returned OK but no result for ${endpoint}`);
  }

  return body.result;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetch user profile info for a single handle.
 */
export async function getCFUser(handle: string): Promise<CFUser> {
  const [raw] = await cfFetch<CFRawUser[]>(
    `user.info?handles=${encodeURIComponent(handle)}`,
  );

  if (!raw) {
    throw new Error(`Codeforces handle not found: ${handle}`);
  }

  return {
    handle: raw.handle,
    rating: raw.rating,
    maxRating: raw.maxRating,
    rank: raw.rank,
    maxRank: raw.maxRank,
    avatar: raw.avatar,
    titlePhoto: raw.titlePhoto,
    contribution: raw.contribution,
    friendOfCount: raw.friendOfCount,
  };
}

/**
 * Fetch the full contest rating history for a handle.
 * Returns an empty array if the user has never participated.
 */
export async function getCFRatingHistory(handle: string): Promise<CFRatingChange[]> {
  const raw = await cfFetch<CFRawRatingChange[]>(
    `user.rating?handle=${encodeURIComponent(handle)}`,
  );

  return raw.map((entry) => ({
    contestId: entry.contestId,
    contestName: entry.contestName,
    rank: entry.rank,
    oldRating: entry.oldRating,
    newRating: entry.newRating,
    ratingUpdateTimeSeconds: entry.ratingUpdateTimeSeconds,
  }));
}

/**
 * Fetch submissions for a handle (up to 10000).
 */
export async function getCFSubmissions(
  handle: string,
  count = 1000,
  from = 1,
): Promise<CFSubmission[]> {
  const raw = await cfFetch<CFRawSubmission[]>(
    `user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${count}`,
  );

  return raw.map((s) => ({
    id: s.id,
    contestId: s.contestId,
    problem: {
      index: s.problem.index,
      name: s.problem.name,
      tags: s.problem.tags,
      rating: s.problem.rating,
    },
    verdict: s.verdict,
    programmingLanguage: s.programmingLanguage,
    creationTimeSeconds: s.creationTimeSeconds,
  }));
}

/** Fetch a handle's complete submission history in stable API-sized pages. */
export async function getCFAllSubmissions(handle: string): Promise<CFSubmission[]> {
  const pageSize = 1000;
  const submissions: CFSubmission[] = [];
  let from = 1;

  while (true) {
    const page = await getCFSubmissions(handle, pageSize, from);
    submissions.push(...page);
    if (page.length < pageSize) return submissions;
    from += page.length;
  }
}

export interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds: number;
  relativeTimeSeconds?: number;
}

/**
 * Fetch Codeforces contest schedule (upcoming and recent).
 */
export async function getCFContests(): Promise<CFContest[]> {
  const raw = await cfFetch<CFContest[]>('contest.list?gym=false');
  return raw.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    phase: c.phase,
    frozen: c.frozen,
    durationSeconds: c.durationSeconds,
    startTimeSeconds: c.startTimeSeconds,
    relativeTimeSeconds: c.relativeTimeSeconds,
  }));
}
