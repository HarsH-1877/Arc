import { requireSession } from '@/lib/session';
import { DashboardClient } from './DashboardClient';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  // requireSession already verified + onboarding check done in layout
  await requireSession();
  return <DashboardClient />;
}
