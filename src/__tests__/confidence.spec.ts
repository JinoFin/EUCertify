import { describe, expect, it } from 'vitest'
import { buildReport } from '@/domain/engine'
import type { AnswerMap } from '@/domain/types'

const baseAnswers: AnswerMap = {
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
  target_countries: ['DE'],
  existing_docs: 'no',
  needs_docs: 'generate'
}

describe('confidence scoring', () => {
  it('keeps confidence within range', () => {
    const report = buildReport(baseAnswers)
    report.explain.forEach(entry => {
      expect(entry.confidence).toBeGreaterThanOrEqual(0)
      expect(entry.confidence).toBeLessThanOrEqual(1)
    })
  })

  it('gives high confidence when radio follow-ups answered', () => {
    const report = buildReport({ ...baseAnswers, wireless_band: '2.4GHz' })
    const red = report.explain.find(entry => entry.id === 'RED')
    expect(red?.confidence).toBeGreaterThanOrEqual(0.75)
  })

  it('drops to medium confidence when radio details missing', () => {
    const report = buildReport(baseAnswers)
    const red = report.explain.find(entry => entry.id === 'RED')
    expect(red?.confidence).toBeGreaterThan(0.5)
    expect(red?.confidence).toBeLessThan(0.75)
  })
})
