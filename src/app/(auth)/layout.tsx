import { NodeBackground } from '@/components/shared/NodeBackground';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      <NodeBackground opacity={0.03} />
      <div className="relative z-10 w-full max-w-[480px]">
        {children}
      </div>
    </div>
  );
}
