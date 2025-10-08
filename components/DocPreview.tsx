'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/Button';

interface DocPreviewProps {
  docId: string;
  productId: string;
  type: 'DOC' | 'CHECKLIST' | 'LABEL';
}

export function DocPreview({ docId, productId, type }: DocPreviewProps) {
  const locale = useLocale();
  const t = useTranslations('docs');
  const tNotifications = useTranslations('notifications');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const downloadUrl = `/api/pdf/${docId}?type=${type}&lang=${locale}`;

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const shareUrl = `${window.location.origin}/docs/${productId}?tab=${type}`;
    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl, title: t('title') });
        toast.success(tNotifications('linkCopied'));
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') {
          return;
        }
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(tNotifications('linkCopied'));
        return;
      } catch (error) {
        // fall through to error toast
      }
    }
    toast.error(tNotifications('shareFailed'));
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/product/${productId}`}>{t('edit')}</Link>
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleShare}>
            {t('share')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={offline}
            onClick={() => {
              if (offline || typeof window === 'undefined') return;
              window.open(downloadUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            {t('download')}
          </Button>
        </div>
      </div>
      {offline ? <p className="text-xs text-amber-600">{t('offlineDisabled')}</p> : null}
      <div className="h-[600px] overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">{t('loading')}</p>
        ) : (
          <iframe title={`${docId}-${type}`} srcDoc={html} className="h-full w-full border-0" />
        )}
      </div>
    </div>
  );
}
