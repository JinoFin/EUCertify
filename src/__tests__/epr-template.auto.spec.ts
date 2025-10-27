import { describe, it, expect } from 'vitest'
import TEMPLATES from '@/docs/templates'
import type { DocContext } from '@/docs/types'
import { buildIntelligence } from '@/domain/intelligence'

describe('EPR Info Sheet auto population', () => {
  it('builds per-country rows from catalog data without runtime require', () => {
    const template = TEMPLATES.find(t => t.id === 'EPR_Info_Sheet')
    expect(template).toBeTruthy()

    const context: DocContext = {
      answers: {},
      report: {
        productSummary: {
          type: 'electronics',
          role: 'manufacturer',
          markets: ['DE'],
          detectedTags: []
        },
        rules: [],
        explain: [],
        documents: [],
        countries: [],
        outputs: [],
        modules: [],
        missingInfo: []
      },
      nowISO: '2024-01-01T00:00:00.000Z',
      intelligence: buildIntelligence({ answers: {}, tags: [] })
    }

    const perCountryField = template!.fields.find(field => field.key === 'per_country')
    expect(perCountryField?.auto).toBeTypeOf('function')

    const rows = perCountryField?.auto?.(context) as any[]
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toMatchObject({ Country: 'DE' })
  })
})
