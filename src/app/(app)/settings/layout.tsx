import { SettingsShell } from '@/components/layout/SettingsShell';

export const metadata = { title: 'Settings' };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
