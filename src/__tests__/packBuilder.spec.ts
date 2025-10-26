import { describe, expect, it } from 'vitest'
import type { AnswerMap } from '@/domain/types'
import { makeDocContext } from '@/docs/context'
import { buildCompliancePack } from '@/docs/packBuilder'

const sampleAnswersForEEEWirelessBattery = (): AnswerMap => ({
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
})

describe('buildCompliancePack', () => {
  it('prefills DoC with correct legislation and standards', async () => {
    const answers = sampleAnswersForEEEWirelessBattery()
    const ctx = await makeDocContext(answers)
    const pack = buildCompliancePack(ctx)
    const doc = pack.find(item => item.kind === 'EU_DoC')
    if (!doc) {
      throw new Error('DoC not generated')
    }
    expect(doc.data.applicable_legislation.length).toBeGreaterThan(0)
    expect(
      doc.data.standards_list.some((standard: any) => standard['EN Standard']?.includes('EN'))
    ).toBe(true)
  })
})
