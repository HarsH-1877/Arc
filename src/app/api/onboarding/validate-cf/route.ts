import { NextRequest, NextResponse } from 'next/server';

// GET /api/onboarding/validate-cf?handle=tourist
export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle');
  if (!handle) {
    return NextResponse.json({ valid: false, error: 'Handle required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      { next: { revalidate: 0 } },
    );
    const data = await res.json();

    if (data.status !== 'OK' || !data.result?.[0]) {
      return NextResponse.json({ valid: false, error: 'Handle not found on Codeforces.' });
    }

    const user = data.result[0];
    return NextResponse.json({
      valid: true,
      user: {
        handle: user.handle,
        rating: user.rating ?? null,
        maxRating: user.maxRating ?? null,
        rank: user.rank ?? null,
        maxRank: user.maxRank ?? null,
        avatar: user.avatar ?? null,
        titlePhoto: user.titlePhoto ?? null,
      },
    });
  } catch {
    return NextResponse.json({ valid: false, error: 'Could not reach Codeforces. Try again.' }, { status: 502 });
  }
}
