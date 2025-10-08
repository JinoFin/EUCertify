import Link from 'next/link';
import { createTranslator } from 'next-intl/server';
import { getLocale, getMessages } from '@/lib/i18n';
import { demoProducts } from '@/lib/demo-data';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import actsMeta from '@/rules/acts.v1.json';

export default async function DashboardPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = await createTranslator({ locale, messages, namespace: 'dashboard' });
  const tSummary = await createTranslator({ locale, messages, namespace: 'summary' });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">{demoProducts.length} Produkte</p>
        </div>
        <Button variant="outline">{t('newProduct')}</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {demoProducts.map((product) => (
          <Card key={product.id} className="flex flex-col gap-4 p-4">
            <CardHeader className="border-none p-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{product.name}</h2>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{product.model}</p>
                </div>
                <Badge variant={product.status === 'FINAL' ? 'success' : product.status === 'REVIEW' ? 'warning' : 'default'}>
                  {t(`status.${product.status.toLowerCase()}` as any)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 p-0">
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-medium text-slate-700">{tSummary('acts')}</p>
                <ul className="list-disc pl-5">
                  {product.acts.map((code) => {
                    const meta = (actsMeta as any[]).find((act) => act.code === code);
                    return (
                      <li key={code}>
                        {meta?.title ?? code}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-slate-400">
                  {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(product.updatedAt))}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={`/product/${product.id}`}>{t('regenerate')}</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/product/${product.id}?action=duplicate`}>{t('duplicate')}</Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/product/${product.id}?action=refresh`}>{t('updateActs')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
