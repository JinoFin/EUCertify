import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales, localeCookieName } from '@/lib/i18n';

export default createMiddleware({
  locales: Array.from(locales),
  defaultLocale,
  localePrefix: 'never',
  localeDetection: true,
  cookies: {
    locale: localeCookieName
  }
});

export const config = {
  matcher: ['/((?!_next|api/qr|api/pdf).*)']
};
