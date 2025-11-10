import { tDoc } from '@/i18n'
import { nanoid } from 'nanoid'
import type { DocInstance, DocKind, DocTemplate, DocField } from '@/docs/types'
import type { Tag } from '@/wizard/schema'

type GenInput = {
  projectId: string
  answers: Record<string, any>
  laws: (string | Tag)[]
  locale: 'de'
  type: 'doc_eu_declaration'
}

const LEGACY_TEMPLATES: DocTemplate[] = [
  {
    id: 'EU_DoC',
    title: 'EU Declaration of Conformity',
    description: 'Legacy placeholder template for EU DoC.',
    fields: [
      legacyField('manufacturer_name', 'Manufacturer Name', 'text'),
      legacyField('product_name', 'Product Name', 'text'),
      legacyField('applicable_legislation', 'Applicable Legislation', 'textarea')
    ],
    exportable: ['pdf']
  },
  legacyTemplate('Risk_Register'),
  legacyTemplate('TechFile_Checklist'),
  legacyTemplate('Labels_Checklist'),
  legacyTemplate('EPR_Info_Sheet'),
  legacyTemplate('User_Manual_Starter')
]

function legacyField(key: string, label: string, type: DocField['type']): DocField {
  return { key, label, type }
}

function legacyTemplate(id: Exclude<DocKind, 'EU_DoC'>): DocTemplate {
  return {
    id,
    title: `${id.replace(/_/g, ' ')}`,
    description: 'Legacy placeholder template.',
    fields: [],
    exportable: ['pdf']
  }
}

function escapeHtml(input = ''): string {
  return input.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char] as string))
}

export async function generateDocPreview(input: GenInput): Promise<string> {
  const { answers, laws } = input
  const product = String(answers['product.name'] ?? '')
  const model = String(answers['product.model'] ?? '')
  const description = String(answers['product.description'] ?? '')
  const docTitle = tDoc('docs.doc.title', 'EU-Konformitätserklärung')
  const productHeading = tDoc('docs.doc.product', 'Produkt')
  const lawsHeading = tDoc('docs.doc.laws', 'Angewandte Rechtsvorschriften')
  const statementHeading = tDoc('docs.doc.statement', 'Erklärung')
  const statementText = tDoc(
    'docs.doc.statementText',
    'Hiermit erklären wir, dass das oben bezeichnete Produkt mit den einschlägigen Rechtsvorschriften der EU übereinstimmt.'
  )
  const previewHint = tDoc(
    'docs.doc.previewHint',
    'Hinweis: Vorschauversion – Platzhalter für Herstellerangaben, Ort/Datum und Unterschrift.'
  )

  const safeLaws = (laws ?? []).map(law => escapeHtml(String(law)))

  return `
  <article style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif; line-height:1.45;">
    <h1 style="margin:0 0 12px">${escapeHtml(docTitle)}</h1>

    <section>
      <h2 style="font-size:1.1rem;margin:16px 0 8px;">${escapeHtml(productHeading)}</h2>
      <p><strong>${escapeHtml(tDoc('docs.doc.productName', 'Bezeichnung:'))}</strong> ${escapeHtml(product)}${model ? ` – ${escapeHtml(model)}` : ''}</p>
      ${description ? `<p><strong>${escapeHtml(tDoc('docs.doc.productDescription', 'Kurzbeschreibung:'))}</strong> ${escapeHtml(description)}</p>` : ''}
    </section>

    <section>
      <h2 style="font-size:1.1rem;margin:16px 0 8px;">${escapeHtml(lawsHeading)}</h2>
      <ul>
        ${safeLaws.map(law => `<li>${law}</li>`).join('')}
      </ul>
    </section>

    <section>
      <h2 style="font-size:1.1rem;margin:16px 0 8px;">${escapeHtml(statementHeading)}</h2>
      <p>${escapeHtml(statementText)}</p>
    </section>

    <footer style="margin-top:24px;font-size:.925rem;color:#555">
      <p>${escapeHtml(previewHint)}</p>
    </footer>
  </article>`
}

export async function exportDocPDF(input: GenInput): Promise<void> {
  if (typeof window === 'undefined') return
  const html = await generateDocPreview(input)
  const docTitle = tDoc('docs.doc.title', 'EU-Konformitätserklärung')
  const handle = window.open('', '_blank')
  if (!handle) return
  handle.document.open()
  handle.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${escapeHtml(docTitle)}</title></head><body>${html}</body></html>`)
  handle.document.close()
  handle.focus()
  window.setTimeout(() => {
    try {
      handle.print()
    } catch (error) {
      console.error('Failed to trigger print dialog', error)
    }
  }, 300)
}

export function listTemplates(): DocTemplate[] {
  return LEGACY_TEMPLATES
}

export function getTemplate(kind: DocKind): DocTemplate {
  return LEGACY_TEMPLATES.find(template => template.id === kind) ?? LEGACY_TEMPLATES[0]
}

export function createInstance(kind: DocKind, _context: unknown): DocInstance {
  const now = new Date().toISOString()
  return {
    id: nanoid(),
    kind,
    version: 1,
    createdAt: now,
    updatedAt: now,
    data: {},
    status: 'draft'
  }
}

export async function loadDrafts(): Promise<DocInstance[]> {
  return []
}

export async function saveDrafts(_drafts: DocInstance[]): Promise<void> {
  // no-op
}

export async function exportPDF(_instance: unknown, _template?: DocTemplate): Promise<Blob> {
  return new Blob()
}

export async function exportDOCX(_instance: unknown, _template?: DocTemplate): Promise<Blob> {
  console.warn('DOCX export is not available in the simplified generator.')
  return new Blob()
}
