import Link from 'next/link';
import actsMeta from '@/rules/acts.v1.json';
import { createTranslator } from 'next-intl/server';
import { getLocale, getMessages } from '@/lib/i18n';

export default async function KnowledgeIndex() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = await createTranslator({ locale, messages, namespace: 'knowledge' });

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">{t('title')}</h1>
      <p className="mt-2 text-sm text-slate-500">{t('intro')}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(actsMeta as any[]).map((act) => (
          <Link
            key={act.code}
            href={`/knowledge/${act.code}/v1`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-primary"
          >
            <h2 className="text-lg font-semibold text-slate-800">{act.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{act[`summary_${locale === 'zh-CN' ? 'zh' : locale}`] ?? act.summary_en}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
