export const locales = ['de', 'en', 'zh-CN'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';
export const localeCookieName = 'eucertify-locale';
