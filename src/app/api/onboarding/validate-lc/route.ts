import { NextRequest, NextResponse } from 'next/server';

const LC_GRAPHQL = 'https://leetcode.com/graphql';

const PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        userAvatar
        ranking
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

// GET /api/onboarding/validate-lc?username=neal_wu
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');
  if (!username) {
    return NextResponse.json({ valid: false, error: 'Username required' }, { status: 400 });
  }

  try {
    const res = await fetch(LC_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
        'User-Agent': 'ProjectArc/1.0',
      },
      body: JSON.stringify({
        query: PROFILE_QUERY,
        variables: { username },
      }),
      next: { revalidate: 0 },
    });

    const data = await res.json();
    const user = data?.data?.matchedUser;

    if (!user) {
      return NextResponse.json({ valid: false, error: 'Username not found on LeetCode.' });
    }

    const totalSolved =
      user.submitStats?.acSubmissionNum?.find((s: { difficulty: string }) => s.difficulty === 'All')?.count ?? 0;

    return NextResponse.json({
      valid: true,
      user: {
        username: user.username,
        realName: user.profile?.realName ?? null,
        avatar: user.profile?.userAvatar ?? null,
        ranking: user.profile?.ranking ?? null,
        totalSolved,
      },
    });
  } catch {
    return NextResponse.json({ valid: false, error: 'Could not reach LeetCode. Try again.' }, { status: 502 });
  }
}
