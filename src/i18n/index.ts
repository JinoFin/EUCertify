import en from './en'
import de from './de'
import zh from './zh'

export type Locale = 'en' | 'de' | 'zh'

const STORAGE_KEY = 'eucertify:locale'

const DICTS: Record<Locale, Record<string, string>> = {
  en,
  de,
  zh
}

const isLocale = (value: string | null | undefined): value is Locale =>
  value === 'en' || value === 'de' || value === 'zh'

let currentLocale: Locale = 'en'

if (typeof window !== 'undefined' && window.localStorage) {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isLocale(stored)) {
    currentLocale = stored
  }
}

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale) {
  currentLocale = locale
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, locale)
  }
}

export function t(key: string, def?: string): string {
  const locale = currentLocale
  return DICTS[locale]?.[key] ?? DICTS.en?.[key] ?? def ?? key
}

export function tDoc(key: string, def?: string): string {
  return DICTS.de?.[key] ?? DICTS.en?.[key] ?? def ?? key
}

const i18n = {
  get language(): Locale {
    return currentLocale
  },
  changeLanguage(locale: Locale) {
    currentLocale = locale
    return Promise.resolve(locale)
  }
}

export default i18n
