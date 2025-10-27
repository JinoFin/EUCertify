import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import en from '@/i18n/en.json'
import de from '@/i18n/de.json'
import zh from '@/i18n/zh.json'

type LangCode = 'en' | 'de' | 'zh'
const bundles: Record<LangCode, any> = { en, de, zh }

type Ctx = { lang: LangCode; setLang: (_lang: LangCode) => void; t: (_path: string) => string }
const LanguageContext = createContext<Ctx>(null!)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>(() => (localStorage.getItem('lang') as LangCode) || 'en')

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  const t = (key: string): string => {
    const parts = key.split('.')
    let value: any = bundles[lang]
    for (const part of parts) {
      value = value?.[part]
    }
    return typeof value === 'string' ? value : key
  }

  const value = useMemo(() => ({ lang, setLang, t }), [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLang = () => useContext(LanguageContext)
