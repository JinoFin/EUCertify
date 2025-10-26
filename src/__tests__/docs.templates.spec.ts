import { describe, expect, it } from 'vitest'
import { listTemplates } from '@/docs/generator'

describe('document templates', () => {
  it('provides the full template catalog', () => {
    const templates = listTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(6)
  })

  it('includes required EU DoC fields', () => {
    const templates = listTemplates()
    const doc = templates.find(template => template.id === 'EU_DoC')
    expect(doc).toBeTruthy()
    const keys = doc?.fields.map(field => field.key) ?? []
    expect(keys).toContain('manufacturer_name')
    expect(keys).toContain('product_name')
    expect(keys).toContain('applicable_legislation')
  })
})
