'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { KnowledgePanel } from '@/components/KnowledgePanel';

interface SummaryPanelProps {
  acts: { code: string; title: string; eli_url: string; warnings?: string[] }[];
  missing: string[];
  standards: string[];
}

export function SummaryPanel({ acts, missing, standards }: SummaryPanelProps) {
  const t = useTranslations('wizard');
  const tSummary = useTranslations('summary');
  const [selectedAct, setSelectedAct] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>{t('actsHeading')}</CardHeader>
        <CardContent className="space-y-2">
          {acts.length === 0 ? <p className="text-sm text-slate-500">{t('noActs')}</p> : null}
          {acts.map((act) => (
            <div key={act.code} className="rounded border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{act.code}</p>
                  <p className="text-xs text-slate-500">{act.title}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAct(act.code)}>
                  {tSummary('openKnowledge')}
                </Button>
              </div>
              {act.warnings?.length ? (
                <div className="mt-2 space-y-1">
                  {act.warnings.map((warning) => (
                    <Badge key={warning} variant="warning">
                      {warning}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>{t('missingHeading')}</CardHeader>
        <CardContent className="space-y-2">
          {missing.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-emerald-600">
              <span aria-hidden>✓</span>
              {tSummary('ready')}
            </p>
          ) : (
            missing.map((item) => (
              <p key={item} className="text-sm text-amber-700">
                • {item}
              </p>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>{t('standardsHeading')}</CardHeader>
        <CardContent className="space-y-1">
          {standards.length === 0 ? (
            <p className="text-sm text-slate-500">{tSummary('noStandards')}</p>
          ) : (
            standards.map((standard) => (
              <p key={standard} className="text-sm text-slate-700">
                • {standard}
              </p>
            ))
          )}
        </CardContent>
      </Card>
      <KnowledgePanel actCode={selectedAct} onClose={() => setSelectedAct(null)} />
    </div>
  );
}
