import { describe, expect, it } from 'vitest'
import { buildReport } from '@/domain/engine'
import type { AnswerMap } from '@/domain/types'

const sampleAnswers: AnswerMap = {
  product_type: 'electronic',
  power_need: 'yes',
  battery: 'yes',
  battery_type: 'rechargeable',
  wireless: 'yes',
  power_source: 'mains',
  user_role: 'manufacturer',
  child_use: 'no',
  moving_parts: 'yes',
  food_contact: 'no',
  chemical_content: 'no',
  skin_contact: 'no',
  outdoor_use: 'no',
  target_countries: ['DE', 'FR'],
  existing_docs: 'no',
  needs_docs: 'generate',
  wireless_band: '2.4GHz'
}

describe('buildReport selectors', () => {
  it('includes expected rules, documents, and country obligations', () => {
    const report = buildReport(sampleAnswers)
    const ruleIds = report.rules.map(rule => rule.id)
    expect(ruleIds).toEqual(
      expect.arrayContaining(['RED', 'EMC', 'LVD', 'RoHS', 'GPSR', 'WEEE', 'Batteries', 'Packaging'])
    )

    const docIds = report.documents.map(doc => doc.docId)
    expect(docIds).toEqual(
      expect.arrayContaining([
        'doc_eu_doc',
        'doc_tech_file',
        'test_emc',
        'test_red_rf',
        'label_ce_trace',
        'doc_material_rohs'
      ])
    )

    const germany = report.countries.find(country => country.code === 'DE')
    const france = report.countries.find(country => country.code === 'FR')
    expect(germany?.registrations.map(reg => reg.id)).toEqual(
      expect.arrayContaining(['DE_LUCID', 'DE_WEEE'])
    )
    expect(france?.registrations.map(reg => reg.id)).toEqual(
      expect.arrayContaining(['FR_TRIMAN', 'FR_EEE', 'FR_PACK'])
    )
  })
})
