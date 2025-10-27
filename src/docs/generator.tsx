import { createRoot } from 'react-dom/client'
import React from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import localforage from 'localforage'
import { nanoid } from 'nanoid'
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from 'docx'
import DocRenderer from './DocRenderer'
import TEMPLATES from './templates'
import type { DocContext, DocInstance, DocKind, DocTemplate } from './types'
import { tDoc } from './i18nDoc'

const STORAGE_KEY = 'eucertify:docs:v1'

const templateMap = new Map<DocKind, DocTemplate>(TEMPLATES.map(template => [template.id, template]))

const EU_DOC_LEGISLATION_COLUMNS = [
  tDoc('docs.EU_DoC.tables.applicable_legislation.columns.reference'),
  tDoc('docs.EU_DoC.tables.applicable_legislation.columns.type')
]
const EU_DOC_STANDARDS_COLUMNS = [
  tDoc('docs.EU_DoC.tables.standards_list.columns.standard'),
  tDoc('docs.EU_DoC.tables.standards_list.columns.title')
]
const EU_DOC_LEGISLATION_REFERENCE = EU_DOC_LEGISLATION_COLUMNS[0]
const EU_DOC_LEGISLATION_TYPE = EU_DOC_LEGISLATION_COLUMNS[1]
const EU_DOC_STANDARD_ID = EU_DOC_STANDARDS_COLUMNS[0]
const EU_DOC_STANDARD_TITLE = EU_DOC_STANDARDS_COLUMNS[1]

const DOC_YES = tDoc('docs.common.fieldYes')
const DOC_NO = tDoc('docs.common.fieldNo')
const DOC_FOOTER_TITLE = tDoc('docs.common.footerTitle')
const DOC_META_VERSION = tDoc('docs.common.meta.version')
const DOC_META_CREATED = tDoc('docs.common.meta.created')
const DOC_META_UPDATED = tDoc('docs.common.meta.updated')

const getDefaultValue = (field: DocTemplate['fields'][number]) => {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'date':
      return ''
    case 'checkbox':
      return false
    case 'multiselect':
      return []
    case 'table':
      return []
    default:
      return ''
  }
}

export const listTemplates = (): DocTemplate[] => TEMPLATES

export const getTemplate = (kind: DocKind): DocTemplate => {
  const template = templateMap.get(kind)
  if (!template) {
    throw new Error(`Unknown document kind: ${kind}`)
  }
  return template
}

export const createInstance = (kind: DocKind, ctx: DocContext): DocInstance => {
  const template = getTemplate(kind)
  const now = new Date().toISOString()
  const data: Record<string, any> = {}

  template.fields.forEach(field => {
    const autoValue = field.auto?.(ctx)
    if (autoValue !== undefined) {
      data[field.key] = autoValue
    } else {
      data[field.key] = getDefaultValue(field)
    }
  })

  return {
    id: nanoid(),
    kind,
    version: 1,
    createdAt: now,
    updatedAt: now,
    data,
    status: 'draft'
  }
}

export const updateInstance = (
  draft: DocInstance,
  patch: Partial<DocInstance['data']>
): DocInstance => {
  const updatedData = { ...draft.data, ...patch }
  return {
    ...draft,
    data: updatedData,
    updatedAt: new Date().toISOString()
  }
}

export const loadDrafts = async (): Promise<DocInstance[]> => {
  try {
    const stored = await localforage.getItem<DocInstance[]>(STORAGE_KEY)
    if (stored && Array.isArray(stored)) return stored
  } catch {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) return parsed
        } catch (err) {
          console.warn('Failed to parse stored docs', err)
        }
      }
    }
  }
  return []
}

export const saveDrafts = async (drafts: DocInstance[]): Promise<void> => {
  try {
    await localforage.setItem(STORAGE_KEY, drafts)
  } catch {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
    }
  }
}

const renderToHiddenContainer = async (
  template: DocTemplate,
  instance: DocInstance
): Promise<HTMLDivElement> => {
  if (typeof document === 'undefined') {
    throw new Error('PDF export requires a DOM environment')
  }
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-10000px'
  container.style.left = '-10000px'
  container.style.width = '794px'
  container.style.padding = '24px'
  container.style.background = '#fff'
  container.className = 'doc-renderer-wrapper'
  document.body.appendChild(container)

  const root = createRoot(container)
  await new Promise<void>(resolve => {
    root.render(
      <React.StrictMode>
        <DocRenderer template={template} instance={instance} />
      </React.StrictMode>
    )
    setTimeout(() => resolve(), 0)
  })
  ;(container as any).__root = root
  return container
}

const cleanupContainer = (container: HTMLDivElement) => {
  const root = (container as any).__root as ReturnType<typeof createRoot> | undefined
  if (root) {
    root.unmount()
  }
  if (container.parentNode) {
    container.parentNode.removeChild(container)
  }
}

export const exportPDF = async (
  instance: DocInstance,
  template: DocTemplate
): Promise<Blob> => {
  const tpl = template
  let doc: DocInstance = { ...instance, data: { ...instance.data } }
  const useSelections = Boolean(
    doc.selections &&
    ((doc.selections.selectedLegislationIds?.length ?? 0) > 0 ||
      (doc.selections.selectedStandards?.length ?? 0) > 0)
  )

  if (tpl.id === 'EU_DoC' && useSelections) {
    const { LEGISLATION_CATALOG } = await import('../data/legislationCatalog')
    const { STANDARDS_CATALOG } = await import('../data/standardsCatalog')
    const rowsLeg = (doc.selections?.selectedLegislationIds || []).map(id => {
      const meta = LEGISLATION_CATALOG.find(item => item.id === id)
      return { [EU_DOC_LEGISLATION_REFERENCE]: id, [EU_DOC_LEGISLATION_TYPE]: meta?.type ?? '' }
    })
    const rowsStd = (doc.selections?.selectedStandards || []).map(item => {
      const meta = STANDARDS_CATALOG.find(entry => entry.en === item.en)
      return { [EU_DOC_STANDARD_ID]: item.en, [EU_DOC_STANDARD_TITLE]: item.title || meta?.title || '' }
    })
    doc = {
      ...doc,
      data: {
        ...doc.data,
        applicable_legislation: rowsLeg,
        standards_list: rowsStd
      }
    }
  }

  const container = await renderToHiddenContainer(tpl, doc)
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
    const imgData = canvas.toDataURL('image/png')
    const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait'
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [canvas.width, canvas.height]
    })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    return pdf.output('blob')
  } finally {
    cleanupContainer(container)
  }
}

const buildDocxBlocks = (
  template: DocTemplate,
  instance: DocInstance
): (Paragraph | Table)[] => {
  const blocks: (Paragraph | Table)[] = []
  blocks.push(new Paragraph({ text: template.title, heading: HeadingLevel.TITLE }))
  blocks.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${DOC_META_VERSION} ${instance.version}  |  ${DOC_META_CREATED} ${new Date(instance.createdAt).toLocaleDateString()}  |  ${DOC_META_UPDATED} ${new Date(instance.updatedAt).toLocaleDateString()}`,
          italics: true
        })
      ]
    })
  )

  template.fields.forEach(field => {
    blocks.push(
      new Paragraph({
        text: field.label,
        heading: HeadingLevel.HEADING_2
      })
    )
    const value = instance.data[field.key]
    if (field.type === 'table') {
      const rows = Array.isArray(value) ? value : []
      let columns = field.columns ?? []
      if (columns.length === 0 && rows.length > 0) {
        columns = Object.keys(rows[0])
      }
      const tableRows: TableRow[] = []
      if (columns.length) {
        tableRows.push(
          new TableRow({
            children: columns.map(col =>
              new TableCell({
                children: [new Paragraph({ text: col, heading: HeadingLevel.HEADING_3 })]
              })
            )
          })
        )
      }
      rows.forEach(row => {
        tableRows.push(
          new TableRow({
            children: columns.map(col =>
              new TableCell({
                children: [new Paragraph(String((row && row[col]) ?? ''))]
              })
            )
          })
        )
      })
      const table = new Table({ rows: tableRows })
      blocks.push(table)
    } else if (field.type === 'multiselect') {
      const values = Array.isArray(value) ? value : value ? [value] : []
      blocks.push(new Paragraph({ text: values.join(', ') }))
    } else if (field.type === 'checkbox') {
      blocks.push(new Paragraph({ text: value ? DOC_YES : DOC_NO }))
    } else {
      blocks.push(new Paragraph({ text: value ? String(value) : '' }))
    }
  })

  if (template.footerNotes?.length) {
    blocks.push(new Paragraph({ text: DOC_FOOTER_TITLE, heading: HeadingLevel.HEADING_2 }))
    template.footerNotes.forEach(note => {
      blocks.push(new Paragraph({ text: note }))
    })
  }

  return blocks
}

export const exportDOCX = async (
  instance: DocInstance,
  template: DocTemplate
): Promise<Blob> => {
  if (!template.exportable.includes('docx')) {
    throw new Error('DOCX export not supported for this template')
  }
  const tpl = template
  let docInstance: DocInstance = { ...instance, data: { ...instance.data } }
  const useSelections = Boolean(
    docInstance.selections &&
    ((docInstance.selections.selectedLegislationIds?.length ?? 0) > 0 ||
      (docInstance.selections.selectedStandards?.length ?? 0) > 0)
  )

  if (tpl.id === 'EU_DoC' && useSelections) {
    const { LEGISLATION_CATALOG } = await import('../data/legislationCatalog')
    const { STANDARDS_CATALOG } = await import('../data/standardsCatalog')
    const rowsLeg = (docInstance.selections?.selectedLegislationIds || []).map(id => {
      const meta = LEGISLATION_CATALOG.find(item => item.id === id)
      return { [EU_DOC_LEGISLATION_REFERENCE]: id, [EU_DOC_LEGISLATION_TYPE]: meta?.type ?? '' }
    })
    const rowsStd = (docInstance.selections?.selectedStandards || []).map(item => {
      const meta = STANDARDS_CATALOG.find(entry => entry.en === item.en)
      return { [EU_DOC_STANDARD_ID]: item.en, [EU_DOC_STANDARD_TITLE]: item.title || meta?.title || '' }
    })
    docInstance = {
      ...docInstance,
      data: {
        ...docInstance.data,
        applicable_legislation: rowsLeg,
        standards_list: rowsStd
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: buildDocxBlocks(tpl, docInstance)
      }
    ]
  })
  return Packer.toBlob(doc)
}
