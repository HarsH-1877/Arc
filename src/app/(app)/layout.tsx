import { AppShell } from '@/components/layout/AppShell';
import { USE_MOCK_DATA } from '@/lib/mock/config';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (USE_MOCK_DATA) {
    return <AppShell>{children}</AppShell>;
  }

  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.onboarded) redirect('/link-account');

  return <AppShell>{children}</AppShell>;
}
