'use client';

import { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const padMap = {
  none: '0px',
  sm: '12px',
  md: '16px',
  lg: '24px',
};

// Deprecated: Use <Card> instead.
export function GlassCard({ children, className, padding = 'md', style }: GlassCardProps) {
  return (
    <Card 
      variant="base" 
      padding={padMap[padding]} 
      className={className} 
    >
      <div style={style} className="h-full w-full">
        {children}
      </div>
    </Card>
  );
}
