import { createRoot } from 'react-dom/client'
import React from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import localforage from 'localforage'
import { nanoid } from 'nanoid'
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from 'docx'
import i18n, { tDoc } from '@/i18n'
import { useDocuments } from '@/state/useDocuments'
import { getSupabase } from '@/auth/supabase'
import DocRenderer from './DocRenderer'
import TEMPLATES from './templates'
import type { DocContext, DocInstance, DocKind, DocTemplate } from './types'

const STORAGE_KEY = 'eucertify:docs:v1'

const templateMap = new Map<DocKind, DocTemplate>(TEMPLATES.map(template => [template.id, template]))

type GeneratorPayload = { type: 'generator'; instance: DocInstance }

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
    const message = tDoc('docs.generator.error.unknownKind', 'Unknown document kind: {kind}')
    throw new Error(message.replace('{kind}', kind))
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

const hasSupabase = () => Boolean(getSupabase())

const loadLocalDrafts = async (): Promise<DocInstance[]> => {
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
          console.warn(tDoc('docs.generator.warn.parseFailed', 'Failed to parse stored docs'), err)
        }
      }
    }
  }
  return []
}

const persistLocalDrafts = async (drafts: DocInstance[]): Promise<void> => {
  try {
    await localforage.setItem(STORAGE_KEY, drafts)
  } catch {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
    }
  }
}

const prepareCloudPayload = (draft: DocInstance): GeneratorPayload => ({
  type: 'generator',
  instance: { ...draft }
})

const guessDocTitle = (draft: DocInstance, template: DocTemplate) => {
  const productName = (draft.data?.product_name as string) || (draft.data?.productName as string)
  return productName ? `${template.title} – ${productName}` : template.title
}

const syncFinalDrafts = async (drafts: DocInstance[]): Promise<boolean> => {
  if (!hasSupabase()) return false
  const finalDrafts = drafts.filter(draft => draft.status === 'final' && draft.scope?.projectId)
  if (!finalDrafts.length) return false
  const documentsStore = useDocuments.getState()
  let changed = false
  await Promise.all(
    finalDrafts.map(async draft => {
      const projectId = draft.scope?.projectId
      if (!projectId) return
      const template = getTemplate(draft.kind)
      try {
        const saved = await documentsStore.addOrUpdate({
          id: draft.cloudId,
          project_id: projectId,
          kind: draft.kind,
          title: guessDocTitle(draft, template),
          status: 'final',
          payload: prepareCloudPayload({ ...draft })
        })
        if (saved?.id && saved.id !== draft.cloudId) {
          draft.cloudId = saved.id
          changed = true
        }
      } catch (error) {
        console.error('Failed to sync document with Supabase', error)
      }
    })
  )
  return changed
}

const loadRemoteDrafts = async (projectId?: string): Promise<DocInstance[]> => {
  if (!projectId || !hasSupabase()) return []
  const documentsStore = useDocuments.getState()
  try {
    await documentsStore.loadForProject(projectId)
  } catch (error) {
    console.warn('Unable to load remote documents', error)
    return []
  }

  const docs = documentsStore.docs.filter(doc => templateMap.has(doc.kind as DocKind))
  const instances: DocInstance[] = []
  docs.forEach(doc => {
    const payload = doc.payload as GeneratorPayload | undefined
    if (!payload || payload.type !== 'generator' || !payload.instance) return
    const instance = payload.instance as DocInstance
    const created = instance.createdAt || doc.created_at || new Date().toISOString()
    const updated = doc.updated_at || instance.updatedAt || doc.created_at || created
    instances.push({
      ...instance,
      cloudId: doc.id,
      status: instance.status ?? 'final',
      scope:
        instance.scope && instance.scope.projectId
          ? instance.scope
          : { projectId, productId: instance.scope?.productId ?? projectId },
      createdAt: created,
      updatedAt: updated
    })
  })
  return instances
}

export const loadDrafts = async (projectId?: string): Promise<DocInstance[]> => {
  const localDrafts = await loadLocalDrafts()
  if (!projectId) return localDrafts
  const remoteDrafts = await loadRemoteDrafts(projectId)
  if (!remoteDrafts.length) return localDrafts
  const merged = new Map<string, DocInstance>()
  localDrafts.forEach(draft => {
    merged.set(draft.id, draft)
  })
  remoteDrafts.forEach(draft => {
    merged.set(draft.id, draft)
  })
  return Array.from(merged.values())
}

export const saveDrafts = async (drafts: DocInstance[]): Promise<void> => {
  await persistLocalDrafts(drafts)
  const synced = await syncFinalDrafts(drafts)
  if (synced) {
    await persistLocalDrafts(drafts)
  }
}

const renderToHiddenContainer = async (
  template: DocTemplate,
  instance: DocInstance
): Promise<HTMLDivElement> => {
  if (typeof document === 'undefined') {
    throw new Error(tDoc('docs.generator.error.pdfDom', 'PDF export requires a DOM environment'))
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
      return { ID: id, Type: meta?.type ?? '' }
    })
    const rowsStd = (doc.selections?.selectedStandards || []).map(item => {
      const meta = STANDARDS_CATALOG.find(entry => entry.en === item.en)
      return { 'EN Standard': item.en, Title: item.title || meta?.title || '' }
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

  const restore = i18n.language
  const needsChange = restore !== 'de'
  if (needsChange) {
    await i18n.changeLanguage('de')
  }

  let container: HTMLDivElement | null = null
  try {
    container = await renderToHiddenContainer(tpl, doc)
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
    if (container) {
      cleanupContainer(container)
    }
    if (needsChange) {
      await i18n.changeLanguage(restore)
    }
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
          text: [
            `${tDoc('doc.meta.version', 'Version')} ${instance.version}`,
            `${tDoc('doc.meta.created', 'Created')} ${new Date(instance.createdAt).toLocaleDateString()}`,
            `${tDoc('doc.meta.updated', 'Updated')} ${new Date(instance.updatedAt).toLocaleDateString()}`
          ].join(`  ${tDoc('docs.generator.meta.separator', '|')}  `),
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
      const yesLabel = tDoc('doc.field.yes', 'Yes')
      const noLabel = tDoc('doc.field.no', 'No')
      blocks.push(new Paragraph({ text: value ? yesLabel : noLabel }))
    } else {
      blocks.push(new Paragraph({ text: value ? String(value) : '' }))
    }
  })

  if (template.footerNotes?.length) {
    blocks.push(
      new Paragraph({ text: tDoc('doc.footer.notes', 'Notes'), heading: HeadingLevel.HEADING_2 })
    )
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
    throw new Error(
      tDoc('docs.generator.error.docxUnsupported', 'DOCX export not supported for this template')
    )
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
      return { ID: id, Type: meta?.type ?? '' }
    })
    const rowsStd = (docInstance.selections?.selectedStandards || []).map(item => {
      const meta = STANDARDS_CATALOG.find(entry => entry.en === item.en)
      return { 'EN Standard': item.en, Title: item.title || meta?.title || '' }
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

  const restore = i18n.language
  const needsChange = restore !== 'de'
  if (needsChange) {
    await i18n.changeLanguage('de')
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: buildDocxBlocks(tpl, docInstance)
      }
    ]
  })
  try {
    return await Packer.toBlob(doc)
  } finally {
    if (needsChange) {
      await i18n.changeLanguage(restore)
    }
  }
}
