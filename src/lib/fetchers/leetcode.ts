/**
 * LeetCode GraphQL API fetcher
 * All queries hit the public LeetCode GraphQL endpoint.
 * All functions throw a descriptive Error on failure.
 */

const LC_GRAPHQL = 'https://leetcode.com/graphql';

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface LCSolvedStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
}

export interface LCContestInfo {
  rating: number;
  attended: number;
  topPercentage: number | null;
}

export interface LCSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export interface LCTagStat {
  tagName: string;
  problemsSolved: number;
}

export interface LCProfile {
  username: string;
  ranking: number | null;
  avatar: string | null;
  realName: string | null;
}

export interface LCContestHistoryEntry {
  contestTitle: string;
  startTime: number;
  rating: number;
  ranking: number;
  problemsSolved: number;
  totalProblems: number;
  attended: boolean;
}

// ---------------------------------------------------------------------------
// Internal raw response types
// ---------------------------------------------------------------------------

interface LCRawAcCount {
  difficulty: string;
  count: number;
}

interface LCRawTotalCount {
  difficulty: string;
  count: number;
}

interface LCRawContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  topPercentage: number | null;
}

interface LCRawRecentSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

interface LCRawTagProblem {
  tagName: string;
  problemsSolved: number;
}

interface LCRawTagStats {
  advanced: LCRawTagProblem[];
  intermediate: LCRawTagProblem[];
  fundamental: LCRawTagProblem[];
}

// ---------------------------------------------------------------------------
// Core GraphQL query helper
// ---------------------------------------------------------------------------

async function lcQuery<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(LC_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProjectArc/1.0',
        // LeetCode requires a Referer to accept requests
        Referer: 'https://leetcode.com',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 0 },
    });
  } catch (networkErr) {
    throw new Error(
      `Network error reaching LeetCode API: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
  }

  if (!res.ok) {
    throw new Error(`LeetCode API returned HTTP ${res.status}`);
  }

  let body: { data?: T; errors?: Array<{ message: string }> };
  try {
    body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  } catch {
    throw new Error('Failed to parse LeetCode API response');
  }

  if (body.errors && body.errors.length > 0) {
    throw new Error(`LeetCode GraphQL error: ${body.errors[0].message}`);
  }

  if (!body.data) {
    throw new Error('LeetCode API returned no data');
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetch the number of problems solved across all difficulties,
 * plus an approximate acceptance rate.
 */
export async function getLCSolvedStats(username: string): Promise<LCSolvedStats> {
  const query = `
    query getUserStats($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
    }
  `;

  const data = await lcQuery<{
    matchedUser: {
      submitStats: {
        acSubmissionNum: Array<{ difficulty: string; count: number; submissions?: number }>;
        totalSubmissionNum: Array<{ difficulty: string; count: number; submissions?: number }>;
      };
    } | null;
  }>(query, { username });

  if (!data.matchedUser) {
    throw new Error(`LeetCode user not found: ${username}`);
  }

  const { acSubmissionNum, totalSubmissionNum } = data.matchedUser.submitStats;

  const getCount = (arr: Array<{ difficulty: string; count: number }>, diff: string) =>
    arr.find((x) => x.difficulty === diff)?.count ?? 0;

  const getSubmissions = (arr: Array<{ difficulty: string; count: number; submissions?: number }>, diff: string) => {
    const item = arr.find((x) => x.difficulty === diff);
    return item?.submissions ?? item?.count ?? 0;
  };

  const totalSolved = getCount(acSubmissionNum, 'All');
  const easySolved = getCount(acSubmissionNum, 'Easy');
  const mediumSolved = getCount(acSubmissionNum, 'Medium');
  const hardSolved = getCount(acSubmissionNum, 'Hard');

  const acSubs = getSubmissions(acSubmissionNum, 'All');
  const totalSubs = getSubmissions(totalSubmissionNum, 'All');

  // Acceptance rate = (total AC submissions / total submissions) * 100
  const acceptanceRate =
    totalSubs > 0 ? Math.min(100, Math.round((acSubs / totalSubs) * 10000) / 100) : 0;

  return { totalSolved, easySolved, mediumSolved, hardSolved, acceptanceRate };
}

/**
 * Fetch contest rating info. Returns null if the user has never participated.
 */
export async function getLCContestInfo(
  username: string,
): Promise<LCContestInfo | null> {
  const query = `
    query getContestRanking($username: String!) {
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        topPercentage
      }
    }
  `;

  const data = await lcQuery<{
    userContestRanking: LCRawContestRanking | null;
  }>(query, { username });

  if (!data.userContestRanking) {
    return null;
  }

  const { rating, attendedContestsCount, topPercentage } = data.userContestRanking;

  return {
    rating: Math.round(rating),
    attended: attendedContestsCount,
    topPercentage: topPercentage ?? null,
  };
}

/**
 * Fetch the most recent submissions (up to `limit`, default 50).
 */
export async function getLCRecentSubmissions(
  username: string,
  limit = 50,
): Promise<LCSubmission[]> {
  const query = `
    query getRecentSubmissions($username: String!, $limit: Int!) {
      recentSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `;

  const data = await lcQuery<{
    recentSubmissionList: LCRawRecentSubmission[] | null;
  }>(query, { username, limit });

  return (data.recentSubmissionList ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    titleSlug: s.titleSlug,
    timestamp: s.timestamp,
    statusDisplay: s.statusDisplay,
    lang: s.lang,
  }));
}

/**
 * Fetch tag-level statistics (problems solved per topic).
 * Merges advanced, intermediate, and fundamental tiers.
 */
export async function getLCTagStats(username: string): Promise<LCTagStat[]> {
  const query = `
    query getTagStats($username: String!) {
      matchedUser(username: $username) {
        tagProblemCounts {
          advanced {
            tagName
            problemsSolved
          }
          intermediate {
            tagName
            problemsSolved
          }
          fundamental {
            tagName
            problemsSolved
          }
        }
      }
    }
  `;

  const data = await lcQuery<{
    matchedUser: {
      tagProblemCounts: LCRawTagStats;
    } | null;
  }>(query, { username });

  if (!data.matchedUser) {
    return [];
  }

  const { advanced, intermediate, fundamental } = data.matchedUser.tagProblemCounts;
  const merged = new Map<string, number>();

  for (const group of [advanced, intermediate, fundamental]) {
    for (const { tagName, problemsSolved } of group) {
      merged.set(tagName, (merged.get(tagName) ?? 0) + problemsSolved);
    }
  }

  return Array.from(merged.entries())
    .map(([tagName, problemsSolved]) => ({ tagName, problemsSolved }))
    .sort((a, b) => b.problemsSolved - a.problemsSolved);
}

/**
 * Fetch public profile details (avatar, global ranking).
 */
export async function getLCProfile(username: string): Promise<LCProfile> {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
        }
      }
    }
  `;

  const data = await lcQuery<{
    matchedUser: {
      username: string;
      profile: { realName: string | null; userAvatar: string | null; ranking: number | null } | null;
    } | null;
  }>(query, { username });

  if (!data.matchedUser) {
    throw new Error(`LeetCode user not found: ${username}`);
  }

  return {
    username: data.matchedUser.username,
    ranking: data.matchedUser.profile?.ranking ?? null,
    avatar: data.matchedUser.profile?.userAvatar ?? null,
    realName: data.matchedUser.profile?.realName ?? null,
  };
}

/**
 * Fetch contest participation history with per-contest stats.
 */
export async function getLCContestHistory(username: string): Promise<LCContestHistoryEntry[]> {
  const query = `
    query getContestHistory($username: String!) {
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        problemsSolved
        totalProblems
        contest {
          title
          startTime
        }
      }
    }
  `;

  const data = await lcQuery<{
    userContestRankingHistory: Array<{
      attended: boolean;
      rating: number;
      ranking: number;
      problemsSolved: number;
      totalProblems: number;
      contest: { title: string; startTime: number };
    }> | null;
  }>(query, { username });

  return (data.userContestRankingHistory ?? [])
    .filter((entry) => entry.attended && entry.contest)
    .map((entry) => ({
      contestTitle: entry.contest.title,
      startTime: entry.contest.startTime,
      rating: Math.round(entry.rating),
      ranking: entry.ranking,
      problemsSolved: entry.problemsSolved,
      totalProblems: entry.totalProblems,
      attended: entry.attended,
    }))
    .sort((a, b) => a.startTime - b.startTime);
}

/**
 * Fetch all accepted submissions for a user (up to limit).
 * Uses recentAcSubmissionList which returns ALL accepted submissions historically.
 */
export async function getLCAllAcSubmissions(
  username: string,
  limit = 2000,
): Promise<LCSubmission[]> {
  const query = `
    query getAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        lang
      }
    }
  `;

  const data = await lcQuery<{
    recentAcSubmissionList: Array<{
      id: string;
      title: string;
      titleSlug: string;
      timestamp: string;
      lang: string;
    }> | null;
  }>(query, { username, limit });

  return (data.recentAcSubmissionList ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    titleSlug: s.titleSlug,
    timestamp: s.timestamp,
    statusDisplay: 'Accepted',
    lang: s.lang,
  }));
}

/**
 * Fetch topic tags for a specific problem by its slug.
 */
export async function getLCProblemTags(titleSlug: string): Promise<{ tags: string[]; difficulty: string | null }> {
  const query = `
    query getProblemInfo($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        difficulty
        topicTags {
          name
        }
      }
    }
  `;

  try {
    const data = await lcQuery<{
      question: { difficulty: string; topicTags: Array<{ name: string }> } | null;
    }>(query, { titleSlug });
    return {
      tags: (data.question?.topicTags ?? []).map((t) => t.name),
      difficulty: data.question?.difficulty ?? null,
    };
  } catch {
    return { tags: [], difficulty: null };
  }
}

