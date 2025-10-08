import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'warning' | 'success';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<typeof variant, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  } as const;

  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', variants[variant], className)}
      {...props}
    />
  );
}
