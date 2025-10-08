'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/Button';

interface KnowledgePanelProps {
  actCode: string | null;
  onClose: () => void;
}

export function KnowledgePanel({ actCode, onClose }: KnowledgePanelProps) {
  const locale = useLocale();
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!actCode) {
      return;
    }
    let active = true;
    fetch(`/knowledge/${actCode}/v1?lang=${locale}`).then(async (response) => {
      const text = await response.text();
      if (active) {
        setHtml(text);
      }
    });
    return () => {
      active = false;
    };
  }, [actCode, locale]);

  return (
    <Dialog.Root open={Boolean(actCode)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <Dialog.Title className="text-lg font-semibold text-primary">{actCode}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm">
                ×
              </Button>
            </Dialog.Close>
          </div>
          <div className="mdx-content" dangerouslySetInnerHTML={{ __html: html }} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
