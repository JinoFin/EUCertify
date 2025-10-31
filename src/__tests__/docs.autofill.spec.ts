import { describe, expect, it } from 'vitest'
import type { AnswerMap } from '@/domain/types'
import { createInstance } from '@/docs/generator'
import { makeDocContext, enrichContext } from '@/docs/context'

const answers: AnswerMap = {
  product_type: 'electronic',
  power_need: 'yes',
  battery: 'yes',
  battery_type: 'rechargeable',
  wireless: 'yes',
  wireless_band: '2.4GHz',
  power_source: 'mains',
  user_role: 'importer',
  child_use: 'no',
  moving_parts: 'yes',
  food_contact: 'no',
  chemical_content: 'no',
  skin_contact: 'no',
  outdoor_use: 'no',
  target_countries: ['DE', 'FR'],
  existing_docs: 'no',
  needs_docs: 'generate',
  manufacturer_name: 'Acme Devices',
  manufacturer_address: '123 Example Street\nBerlin, Germany',
  product_name: 'Smart Sensor',
  product_model: 'SS-1000'
}

describe('document auto-fill', () => {
  it('builds EU DoC with legislation and inferred date', async () => {
    const ctx = await makeDocContext({ answers })
    const enriched = enrichContext({ ...ctx, nowISO: '2024-05-20T12:00:00.000Z' })
    const instance = createInstance('EU_DoC', enriched)

    expect(instance.data.manufacturer_name).toBe('')
    expect(instance.data.product_name).toBe('Smart Sensor')
    const legislation = instance.data['applicable_legislation']
    expect(Array.isArray(legislation)).toBe(true)
    expect(legislation.length).toBeGreaterThan(0)
    expect(instance.data.place_date).toBe('2024-05-20')
  })
})
