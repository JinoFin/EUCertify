import i18n, { type Locale } from '@/i18n'
import { QUESTIONNAIRE_SCHEMA } from '@/wizard/schema'

const SUPPORTED: Locale[] = ['en', 'de', 'zh']

export function mergeWizardI18n() {
  const packs = QUESTIONNAIRE_SCHEMA.i18n
  SUPPORTED.forEach(locale => {
    const resources = packs[locale]
    if (resources) {
      i18n.addResources(locale, resources)
    }
  })
}
