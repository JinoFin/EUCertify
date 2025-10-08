'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/Card';

interface QuestionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function QuestionCard({ title, description, children }: QuestionCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {description ? <p className="text-sm font-normal text-slate-500">{description}</p> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm text-slate-700">{children}</div>
      </CardContent>
    </Card>
  );
}
