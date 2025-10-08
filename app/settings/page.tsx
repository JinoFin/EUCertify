import { createTranslator } from 'next-intl/server';
import { getLocale, getMessages } from '@/lib/i18n';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { LanguageSwitch } from '@/components/LanguageSwitch';

export default async function SettingsPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = await createTranslator({ locale, messages, namespace: 'settings' });

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
      <Card>
        <CardHeader>{t('defaultLanguage')}</CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-slate-600">{t('defaultLanguage')}</span>
          <LanguageSwitch label="" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>{t('signatory')}</CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Max Mustermann</p>
          <p>Head of Compliance</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>{t('companies')}</CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Acme GmbH · Berlin, Deutschland · VAT DE123456789</p>
          <button className="text-primary underline">{t('addCompany')}</button>
        </CardContent>
      </Card>
    </section>
  );
}
