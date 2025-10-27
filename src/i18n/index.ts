import en from './en'
import de from './de'
import zh from './zh'

export type Locale = 'en' | 'de' | 'zh'

const DICTS: Record<Locale, Record<string, string>> = {
  en,
  de,
  zh
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en'
  }
  const stored = window.localStorage.getItem('eucertify:locale') as Locale | null
  if (stored && (stored === 'en' || stored === 'de' || stored === 'zh')) {
    return stored
  }
  return 'en'
}

export function setLocale(locale: Locale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('eucertify:locale', locale)
}

export function t(key: string, def?: string): string {
  const locale = getLocale()
  return DICTS[locale]?.[key] ?? DICTS.en?.[key] ?? def ?? key
}

export function tDoc(key: string, def?: string): string {
  return DICTS.de?.[key] ?? DICTS.en?.[key] ?? def ?? key
}
