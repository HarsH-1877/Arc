import { NextRequest, NextResponse } from 'next/server';
import { getCodeChefUser } from '@/lib/fetchers/codechef';

// GET /api/onboarding/validate-cc?handle=tourist
export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle');
  if (!handle) {
    return NextResponse.json({ valid: false, error: 'Handle required' }, { status: 400 });
  }

  try {
    const user = await getCodeChefUser(handle.trim());
    return NextResponse.json({
      valid: true,
      user: {
        handle: user.handle,
        currentRating: user.currentRating,
        maxRating: user.maxRating,
        stars: user.stars,
        globalRank: user.globalRank,
        countryRank: user.countryRank,
        totalSolved: user.totalSolved,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handle not found on CodeChef.';
    return NextResponse.json({ valid: false, error: message }, { status: 404 });
  }
}
