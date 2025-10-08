import { cookies, headers } from 'next/headers';
import { defaultLocale, localeCookieName, locales, type Locale } from './i18n-config';

export { defaultLocale, localeCookieName, locales };
export type { Locale };

const dictionaries: Record<Locale, () => Promise<Record<string, any>>> = {
  'de': async () => (await import('../messages/de.json')).default,
  'en': async () => (await import('../messages/en.json')).default,
  'zh-CN': async () => (await import('../messages/zh-CN.json')).default
};

export async function getLocale(): Promise<Locale> {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value as Locale | undefined;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  const acceptLanguage = headers().get('accept-language');
  if (acceptLanguage) {
    const matched = acceptLanguage
      .split(',')
      .map((entry) => entry.trim().split(';')[0])
      .find((lang) => locales.includes(lang as Locale));
    if (matched) {
      return matched as Locale;
    }
  }
  return defaultLocale;
}

export async function getMessages(locale: Locale) {
  const loader = dictionaries[locale];
  return loader();
}
