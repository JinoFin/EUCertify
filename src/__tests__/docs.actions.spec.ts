import { describe, expect, it, vi } from 'vitest'
const canvasMock = {
  width: 600,
  height: 800,
  toDataURL: () => 'data:image/png;base64,AAA'
}

vi.mock('html2canvas', () => ({
  default: vi.fn(async () => canvasMock)
}))

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    addImage: vi.fn(),
    output: vi.fn(() => new Blob(['pdf']))
  }))
}))

import type { AnswerMap } from '@/domain/types'
import { createInstance, exportPDF, getTemplate } from '@/docs/generator'
import { makeDocContext, enrichContext } from '@/docs/context'

const answers: AnswerMap = {
  product_type: 'electronic',
  power_need: 'yes',
  battery: 'yes',
  battery_type: 'rechargeable',
  wireless: 'yes',
  wireless_band: '2.4GHz',
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
  needs_docs: 'generate',
  manufacturer_name: 'TestCo',
  manufacturer_address: '1 Road',
  product_name: 'Widget',
  product_model: 'W-1'
}

describe('document actions', () => {
  it('exports PDF blobs without throwing', async () => {
    const template = getTemplate('EU_DoC')
    const base = await makeDocContext({ answers })
    const ctx = enrichContext({ ...base, nowISO: '2024-05-20T00:00:00.000Z' })
    const instance = createInstance('EU_DoC', ctx)
    const blob = await exportPDF(instance, template)
    expect(blob).toBeInstanceOf(Blob)
  })
})
