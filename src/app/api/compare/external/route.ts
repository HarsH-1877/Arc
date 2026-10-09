import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCFAllSubmissions, getCFRatingHistory, getCFUser } from '@/lib/fetchers/codeforces';
import { getLCAllAcSubmissions, getLCContestHistory, getLCContestInfo, getLCProfile, getLCSolvedStats, getLCTagStats } from '@/lib/fetchers/leetcode';
import { getCodeChefUser, getCodeChefRatingHistory, getCodeChefRecentSubmissions } from '@/lib/fetchers/codechef';

const normaliseTopics = (entries: Array<[string, number]>) => {
  const max = Math.max(...entries.map(([, count]) => count), 1);
  return entries.map(([topic, rawCount]) => ({ topic, rawCount, value: Math.round((rawCount / max) * 100) })).sort((a, b) => b.rawCount - a.rawCount);
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: 'Sign in required' } }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const handle = searchParams.get('handle')?.trim();
  if (!handle || (platform !== 'CODEFORCES' && platform !== 'LEETCODE' && platform !== 'CODECHEF')) {
    return NextResponse.json({ error: { message: 'A platform and handle are required' } }, { status: 400 });
  }

  try {
    if (platform === 'CODEFORCES') {
      const [profile, ratingHistory, submissions] = await Promise.all([
        getCFUser(handle), getCFRatingHistory(handle), getCFAllSubmissions(handle),
      ]);
      const solved = new Set(submissions.filter((s) => s.verdict === 'OK').map((s) => `${s.contestId ?? 'practice'}:${s.problem.index}`));
      const tags = new Map<string, number>();
      const heatmap = new Map<string, number>();
      for (const submission of submissions.filter((s) => s.verdict === 'OK')) {
        for (const tag of submission.problem.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
        const day = new Date(submission.creationTimeSeconds * 1000).toISOString().slice(0, 10);
        heatmap.set(day, (heatmap.get(day) ?? 0) + 1);
      }
      const history = ratingHistory.map((item) => ({ date: new Date(item.ratingUpdateTimeSeconds * 1000).toISOString(), rating: item.newRating, contestId: item.contestId }));
      const averageRank = ratingHistory.length ? Math.round(ratingHistory.reduce((sum, item) => sum + item.rank, 0) / ratingHistory.length) : null;
      return NextResponse.json({
        id: `cf:${profile.handle}`, username: profile.handle, avatarUrl: profile.titlePhoto ?? profile.avatar ?? null,
        cfHandle: profile.handle, lcHandle: null, cfRating: profile.rating ?? null, cfMaxRating: profile.maxRating ?? null, cfRank: profile.rank ?? null,
        lcRating: null, lcMaxRating: null, totalSolved: solved.size, cfSolvedCount: solved.size, lcSolvedCount: 0,
        cfContestCount: ratingHistory.length, cfAverageRank: averageRank, lcContestCount: 0, lcAverageRank: null,
        streak: 0, totalActiveDays: heatmap.size, ratingHistory: history, cfRatingHistory: history, lcRatingHistory: [],
        topicStats: normaliseTopics(Array.from(tags.entries())), cfTopicStats: normaliseTopics(Array.from(tags.entries())), lcTopicStats: [],
        heatmapData: Array.from(heatmap, ([date, count]) => ({ date, count })), cfHeatmapData: Array.from(heatmap, ([date, count]) => ({ date, count })), lcHeatmapData: [], lastSyncedAt: null,
      });
    }

    if (platform === 'CODECHEF') {
      const [profile, ratingHistory, submissions] = await Promise.all([
        getCodeChefUser(handle),
        getCodeChefRatingHistory(handle),
        getCodeChefRecentSubmissions(handle),
      ]);
      const heatmap = new Map<string, number>();
      for (const submission of submissions) {
        const day = submission.timestamp
          ? (submission.timestamp.includes('T') ? submission.timestamp.slice(0, 10) : new Date(submission.timestamp).toISOString().slice(0, 10))
          : '';
        if (day) heatmap.set(day, (heatmap.get(day) ?? 0) + 1);
      }
      const history = ratingHistory.map((item) => ({
        date: new Date(item.date).toISOString(),
        rating: item.newRating,
        contestId: item.contestId,
      }));
      const averageRank = ratingHistory.length
        ? Math.round(ratingHistory.reduce((sum, item) => sum + (item.rank ? Number(item.rank) : 0), 0) / ratingHistory.length)
        : null;
      return NextResponse.json({
        id: `cc:${profile.handle}`,
        username: profile.handle,
        avatarUrl: null,
        cfHandle: null,
        lcHandle: null,
        ccHandle: profile.handle,
        cfRating: null,
        cfMaxRating: null,
        cfRank: null,
        lcRating: null,
        lcMaxRating: null,
        ccRating: profile.currentRating,
        ccMaxRating: profile.maxRating,
        ccStars: profile.stars,
        totalSolved: profile.totalSolved ?? 0,
        cfSolvedCount: 0,
        lcSolvedCount: 0,
        ccSolvedCount: profile.totalSolved ?? 0,
        cfContestCount: 0,
        cfAverageRank: null,
        lcContestCount: 0,
        lcAverageRank: null,
        ccContestCount: profile.contestsAttended ?? ratingHistory.length,
        ccAverageRank: averageRank,
        streak: 0,
        totalActiveDays: heatmap.size,
        ratingHistory: history,
        cfRatingHistory: [],
        lcRatingHistory: [],
        ccRatingHistory: history,
        topicStats: [],
        cfTopicStats: [],
        lcTopicStats: [],
        ccTopicStats: [],
        heatmapData: Array.from(heatmap, ([date, count]) => ({ date, count })),
        cfHeatmapData: [],
        lcHeatmapData: [],
        ccHeatmapData: Array.from(heatmap, ([date, count]) => ({ date, count })),
        lastSyncedAt: null,
      });
    }

    const [profile, solved, contest, topicStats, submissions, contestHistory] = await Promise.all([
      getLCProfile(handle), getLCSolvedStats(handle), getLCContestInfo(handle), getLCTagStats(handle), getLCAllAcSubmissions(handle), getLCContestHistory(handle),
    ]);
    const heatmap = new Map<string, number>();
    for (const submission of submissions) {
      const day = new Date(Number(submission.timestamp) * 1000).toISOString().slice(0, 10);
      heatmap.set(day, (heatmap.get(day) ?? 0) + 1);
    }
    const history = contestHistory.map((item) => ({ date: new Date(item.startTime * 1000).toISOString(), rating: item.rating }));
    const averageRank = contestHistory.length ? Math.round(contestHistory.reduce((sum, item) => sum + item.ranking, 0) / contestHistory.length) : null;
    const topics = normaliseTopics(topicStats.map((item) => [item.tagName, item.problemsSolved]));
    return NextResponse.json({
      id: `lc:${profile.username}`, username: profile.username, avatarUrl: profile.avatar, cfHandle: null, lcHandle: profile.username,
      cfRating: null, cfMaxRating: null, cfRank: null, lcRating: contest?.rating ?? null, lcMaxRating: Math.max(contest?.rating ?? 0, ...history.map((item) => item.rating)) || null,
      totalSolved: solved.totalSolved, cfSolvedCount: 0, lcSolvedCount: solved.totalSolved, cfContestCount: 0, cfAverageRank: null,
      lcContestCount: contest?.attended ?? contestHistory.length, lcAverageRank: averageRank, streak: 0, totalActiveDays: heatmap.size,
      ratingHistory: history, cfRatingHistory: [], lcRatingHistory: history, topicStats: topics, cfTopicStats: [], lcTopicStats: topics,
      heatmapData: Array.from(heatmap, ([date, count]) => ({ date, count })), cfHeatmapData: [], lcHeatmapData: Array.from(heatmap, ([date, count]) => ({ date, count })), lastSyncedAt: null,
    });
  } catch (error) {
    return NextResponse.json({ error: { message: error instanceof Error ? error.message : 'Could not find that platform user' } }, { status: 404 });
  }
}
