import './globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { createTranslator } from 'next-intl/server';
import { getLocale, getMessages } from '@/lib/i18n';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { PwaInitializer } from '@/components/PwaInitializer';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'EUCertify',
  description: 'Guided EU compliance workflows with multilingual documents.',
  manifest: '/manifest.webmanifest',
  themeColor: '#003399'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const tNav = await createTranslator({ locale, messages, namespace: 'nav' });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <PwaInitializer />
            <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
                <Link href="/" className="font-semibold text-primary">
                  EUCertify
                </Link>
                <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
                  <Link href="/dashboard" className="hover:text-primary">
                    {tNav('dashboard')}
                  </Link>
                  <Link href="/wizard" className="hover:text-primary">
                    {tNav('wizard')}
                  </Link>
                  <Link href="/knowledge" className="hover:text-primary">
                    {tNav('knowledge')}
                  </Link>
                  <Link href="/settings" className="hover:text-primary">
                    {tNav('settings')}
                  </Link>
                  <LanguageSwitch label={tNav('language')} />
                </nav>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-slate-200 bg-white/70">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} EUCertify.</p>
                <p>Built for manufacturers, importers und EU-Bevollmächtigte.</p>
              </div>
            </footer>
          </div>
        </NextIntlClientProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
