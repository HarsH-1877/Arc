import { requireSession } from '@/lib/session';
import { ProblemsClient } from './ProblemsClient';

export const metadata = { title: 'Problems' };

export default async function ProblemsPage() {
  await requireSession();
  return <ProblemsClient />;
}
