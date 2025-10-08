'use server';

import { cookies } from 'next/headers';
import { Locale, localeCookieName, locales } from '@/lib/i18n';

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    return;
  }
  const cookieStore = cookies();
  cookieStore.set(localeCookieName, locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });
}
