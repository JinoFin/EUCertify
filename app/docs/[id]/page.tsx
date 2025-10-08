'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { DocPreview } from '@/components/DocPreview';
import { Button } from '@/components/Button';

export default function DocsPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const t = useTranslations('docs');
  const search = useSearchParams();
  const initialTab = search.get('tab') ?? 'DOC';

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">ID: {params.id}</p>
        </div>
        <Button variant="outline">{t('language')}: {locale}</Button>
      </div>
      <Tabs.Root defaultValue={initialTab} className="space-y-4">
        <Tabs.List className="flex gap-2">
          <Tabs.Trigger value="DOC" className="rounded border border-slate-200 px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10">
            {t('tabs.doc')}
          </Tabs.Trigger>
          <Tabs.Trigger value="CHECKLIST" className="rounded border border-slate-200 px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10">
            {t('tabs.checklist')}
          </Tabs.Trigger>
          <Tabs.Trigger value="LABEL" className="rounded border border-slate-200 px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10">
            {t('tabs.label')}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="DOC">
          <DocPreview docId={`${params.id}-doc`} type="DOC" />
        </Tabs.Content>
        <Tabs.Content value="CHECKLIST">
          <DocPreview docId={`${params.id}-checklist`} type="CHECKLIST" />
        </Tabs.Content>
        <Tabs.Content value="LABEL">
          <DocPreview docId={`${params.id}-label`} type="LABEL" />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
