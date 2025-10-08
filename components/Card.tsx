import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('border-b border-slate-200 px-4 py-3 font-semibold', className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('px-4 py-4 text-sm text-slate-700', className)} {...props} />;
}
