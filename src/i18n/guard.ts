import en from './en'
import de from './de'
import zh from './zh'

const locales: Record<'de' | 'zh', Record<string, string>> = {
  de,
  zh
}

export type TranslationGuardReport = {
  locale: keyof typeof locales
  missing: string[]
}

export function guardTranslations(): TranslationGuardReport[] {
  const sourceKeys = Object.keys(en)
  const reports: TranslationGuardReport[] = []

  for (const [locale, dict] of Object.entries(locales) as Array<[keyof typeof locales, Record<string, string>]>) {
    const missing = sourceKeys.filter(key => !(key in dict))
    if (missing.length) {
      reports.push({ locale, missing })
    }
  }

  return reports
}
