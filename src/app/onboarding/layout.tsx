import { NodeBackground } from '@/components/shared/NodeBackground';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      <NodeBackground opacity={0.04} />
      <div className="relative z-10 w-full max-w-[520px]">
        {children}
      </div>
    </div>
  );
}
