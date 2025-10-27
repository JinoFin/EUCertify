import { describe, it, expect } from 'vitest'
import COUNTRY_OBLIGATIONS from '@/data/countryObligations'
import STANDARDS_CATALOG from '@/data/standardsCatalog'
import LEG_CATALOG from '@/data/legislationCatalog'

describe('ESM catalogs load correctly in browser env', () => {
  it('country obligations are accessible', () => {
    expect(COUNTRY_OBLIGATIONS).toBeTruthy()
    expect(Object.keys(COUNTRY_OBLIGATIONS).length).toBeGreaterThan(0)
  })

  it('standards catalog loads', () => {
    expect(STANDARDS_CATALOG.some(entry => entry.en.startsWith('EN '))).toBe(true)
  })

  it('legislation catalog loads', () => {
    expect(LEG_CATALOG.some(item => item.id === 'EMC')).toBe(true)
  })
})
