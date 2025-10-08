'use client';

import { cn } from '@/lib/utils';

interface StepperProps {
  current: number;
  total: number;
}

export function Stepper({ current, total }: StepperProps) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn('h-2 flex-1 rounded-full bg-slate-200', {
            'bg-primary': index <= current
          })}
        />
      ))}
    </div>
  );
}
