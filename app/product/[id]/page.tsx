import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createTranslator } from 'next-intl/server';
import { getLocale, getMessages } from '@/lib/i18n';
import { demoProducts } from '@/lib/demo-data';
import actsMeta from '@/rules/acts.v1.json';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';

interface ProductPageProps {
  params: { id: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const tSummary = await createTranslator({ locale, messages, namespace: 'summary' });
  const tDocs = await createTranslator({ locale, messages, namespace: 'docs' });
  const product = demoProducts.find((item) => item.id === params.id);

  if (!product) {
    notFound();
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
          <p className="text-sm text-slate-500">{product.model}</p>
        </div>
        <Button asChild>
          <Link href={`/docs/${product.id}`}>{tDocs('title')}</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>{tSummary('acts')}</CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm text-slate-700">
            {product.acts.map((code) => {
              const meta = (actsMeta as any[]).find((act) => act.code === code);
              return (
                <li key={code}>
                  <span className="font-medium">{meta?.title ?? code}</span>{' '}
                  <span className="text-xs text-primary">{meta?.eli_url}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>{tSummary('documents')}</CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {(['DOC', 'CHECKLIST', 'LABEL'] as const).map((type) => (
            <Button key={type} asChild variant="outline">
              <Link href={`/docs/${product.id}?tab=${type}`}>{tDocs('download')}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
