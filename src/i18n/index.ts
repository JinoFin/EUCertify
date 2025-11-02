import { useSyncExternalStore } from 'react'
import en from './en'
import de from './de'
import zh from './zh'

export type Locale = 'en' | 'de' | 'zh'

const STORAGE_KEY = 'eucertify:locale'

const dictionaries: Record<Locale, Record<string, string>> = {
  en: { ...en },
  de: { ...de },
  zh: { ...zh }
}

const isLocale = (value: string | null | undefined): value is Locale =>
  value === 'en' || value === 'de' || value === 'zh'

let currentLocale: Locale = 'en'

const subscribers = new Set<() => void>()

const notify = () => {
  subscribers.forEach(callback => {
    try {
      callback()
    } catch (error) {
      console.error('Failed to notify locale subscriber', error)
    }
  })
}

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
  notify()
}

const translate = (locale: Locale, key: string, fallback?: string) =>
  dictionaries[locale]?.[key] ?? dictionaries.en?.[key] ?? fallback ?? key

export function t(key: string, def?: string): string {
  return translate(currentLocale, key, def)
}

export function tDoc(key: string, def?: string): string {
  return dictionaries.de?.[key] ?? dictionaries.en?.[key] ?? def ?? key
}

export function addResources(locale: Locale, resources: Record<string, string>) {
  dictionaries[locale] = { ...dictionaries[locale], ...resources }
  notify()
}

export const i18n = {
  get language(): Locale {
    return currentLocale
  },
  async changeLanguage(locale: Locale) {
    setLocale(locale)
    return locale
  },
  addResources
}

const subscribe = (callback: () => void) => {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}

export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, () => currentLocale)
  return {
    t: (key: string, fallback?: string) => translate(locale, key, fallback),
    i18n
  }
}

export default i18n
