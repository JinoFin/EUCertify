import { describe, it, expect } from 'vitest'
import { tDoc } from '@/docs/i18nDoc'
import de from '@/i18n/de.json'

describe('Document i18n is German-only', () => {
  it('tDoc returns German strings', () => {
    expect(tDoc('docs.EU_DoC.title')).toBe(de.docs.EU_DoC.title)
  })
})
