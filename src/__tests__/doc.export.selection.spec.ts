import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const renderSpy = vi.hoisted(() => vi.fn(() => null))
vi.mock('@/docs/DocRenderer', () => ({
  __esModule: true,
  default: renderSpy
}))

import { exportPDF, getTemplate } from '@/docs/generator'
import type { DocInstance } from '@/docs/types'

describe('document export selections', () => {
  beforeEach(() => {
    renderSpy.mockClear()
  })

  it('applies explicit selections for EU DoC exports', async () => {
    const template = getTemplate('EU_DoC')
    const instance: DocInstance = {
      id: 'doc-1',
      kind: 'EU_DoC',
      version: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      status: 'draft',
      data: {
        manufacturer_name: 'Maker',
        manufacturer_address: '1 Road',
        product_name: 'Widget',
        product_model: 'W-1',
        applicable_legislation: [],
        standards_list: [],
        place_date: 'Berlin, 2024-01-01',
        name_title: 'QA Manager',
        signature: 'Maker'
      },
      selections: {
        selectedLegislationIds: ['RED', 'EMC', 'RoHS'],
        selectedStandards: [
          {
            en: 'EN 300 328',
            title: '2.4 GHz wideband transmission systems'
          }
        ]
      }
    }

    await exportPDF(instance, template)

    const renderCall = renderSpy.mock.calls.at(-1)
    expect(renderCall).toBeTruthy()
    if (!renderCall) {
      throw new Error('DocRenderer did not render during export')
    }
    const props = (renderCall as unknown as [{ instance: DocInstance }])[0]
    expect(props.instance.data.applicable_legislation).toEqual([
      { ID: 'RED', Type: 'Directive' },
      { ID: 'EMC', Type: 'Directive' },
      { ID: 'RoHS', Type: 'Directive' }
    ])
    expect(props.instance.data.standards_list).toEqual([
      { 'EN Standard': 'EN 300 328', Title: '2.4 GHz wideband transmission systems' }
    ])
  })
})
