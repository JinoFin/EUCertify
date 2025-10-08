'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/Button';

interface DocPreviewProps {
  docId: string;
  type: 'DOC' | 'CHECKLIST' | 'LABEL';
}

export function DocPreview({ docId, type }: DocPreviewProps) {
  const locale = useLocale();
  const t = useTranslations('docs');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/pdf/${docId}?type=${type}&lang=${locale}&preview=1`).then(async (response) => {
      const text = await response.text();
      if (active) {
        setHtml(text);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [docId, type, locale]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline">
          <a href={`/api/pdf/${docId}?type=${type}&lang=${locale}`} target="_blank" rel="noopener noreferrer">
            {t('download')}
          </a>
        </Button>
      </div>
      <div className="h-[600px] overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : (
          <iframe title={`${docId}-${type}`} srcDoc={html} className="h-full w-full border-0" />
        )}
      </div>
    </div>
  );
}
