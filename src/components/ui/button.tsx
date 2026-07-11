'use client';

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-[var(--accent-primary)] text-white hover:opacity-90',
  secondary: 'bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] hover:opacity-90',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
};

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-11 px-6 text-sm rounded-md',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
