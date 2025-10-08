'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { setLocale } from '@/app/actions/set-locale';
import { locales, type Locale } from '@/lib/i18n-config';
import { toast } from 'sonner';

interface Props {
  label: string;
}

export function LanguageSwitch({ label }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('notifications');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      {label ? <span>{label}</span> : null}
      <select
        className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
        value={locale}
        disabled={pending}
        onChange={(event) => {
          const nextLocale = event.target.value as Locale;
          startTransition(async () => {
            await setLocale(nextLocale);
            toast.success(t('languageUpdated'));
            router.refresh();
          });
        }}
      >
        {locales.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
