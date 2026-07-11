import { NextResponse } from 'next/server';
import { USE_MOCK_DATA, MOCK_NOTIFICATIONS } from '@/lib/mock';

export async function GET() {
  if (USE_MOCK_DATA) return NextResponse.json(MOCK_NOTIFICATIONS);
  return NextResponse.json([]);
}

export async function PATCH(req: Request) {
  if (USE_MOCK_DATA) {
    const { id } = await req.json();
    const updated = MOCK_NOTIFICATIONS.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    return NextResponse.json(updated);
  }
  return NextResponse.json({ ok: true });
}
