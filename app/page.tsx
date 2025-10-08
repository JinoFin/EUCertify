import { createTranslator } from 'next-intl/server';
import { getLocale, getMessages } from '@/lib/i18n';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default async function LandingPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const tLanding = await createTranslator({ locale, messages, namespace: 'landing' });

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16">
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">{tLanding('heroTitle')}</h1>
          <p className="mt-6 text-lg text-slate-600">{tLanding('heroSubtitle')}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/wizard">{tLanding('startWizard')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/knowledge">{tLanding('viewKnowledge')}</Link>
            </Button>
          </div>
        </div>
        <aside className="rounded-xl border border-primary/30 bg-white p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-primary">PWA Highlights</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>✔ Offline drafts und Hintergrundsynchronisierung</li>
            <li>✔ Live-Regel-Engine mit aktualisierten EU-Rechtsakten</li>
            <li>✔ Mehrsprachige PDF-Vorlagen mit QR-Verifizierung</li>
            <li>✔ Multi-Tenant-Unternehmens- und Produktverwaltung</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
