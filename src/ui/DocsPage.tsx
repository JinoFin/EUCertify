import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { listTemplates, createInstance, loadDrafts, saveDrafts, exportPDF, exportDOCX, getTemplate } from '@/docs/generator'
import type { DocInstance, DocKind, DocTemplate } from '@/docs/types'
import { makeDocContext, enrichContext } from '@/docs/context'
import { useWizard } from '@/state/useWizard'
import DocEditor from './DocEditor'
import LanguageSelector from '@/components/LanguageSelector'
import { useLang } from '@/context/LanguageContext'
import { DOCUMENT_CATALOG } from '@/data/documentCatalog'

const TEMPLATE_DOC_IDS: Partial<Record<DocKind, string>> = {
  EU_DoC: 'doc_eu_doc',
  Risk_Register: 'doc_risk',
  TechFile_Checklist: 'doc_tech_file',
  Labels_Checklist: 'label_ce_trace',
  EPR_Info_Sheet: 'epr_weee_reg',
  User_Manual_Starter: 'doc_user_manual'
}

const statusBadge = (t: (_path: string) => string, status?: string) => {
  switch (status) {
    case 'exportable':
      return t('docs.status.exportable')
    case 'upload':
      return t('docs.status.upload')
    case 'external':
      return t('docs.status.external')
    default:
      return ''
  }
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function DocsPage() {
  const { t } = useLang()
  const { kind } = useParams<{ kind?: DocKind }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { answers } = useWizard()
  const [drafts, setDrafts] = useState<DocInstance[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const createdKindRef = useRef<string | null>(null)
  const [docContext, setDocContext] = useState<ReturnType<typeof enrichContext> | null>(null)
  const [autoOpenSelection, setAutoOpenSelection] = useState(false)

  const isCreateRoute = location.pathname.startsWith('/docs/new')
  const isEditRoute = location.pathname.startsWith('/docs/edit')

  const templates = useMemo(() => listTemplates(), [])
  const docsById = useMemo(() => new Map(DOCUMENT_CATALOG.map(doc => [doc.docId, doc])), [])

  const activeDraft = drafts.find(draft => draft.id === selectedId) || null
  const activeTemplate = activeDraft ? getTemplate(activeDraft.kind) : null

  const docStatusLabel = (status: DocInstance['status']) => t(`docs.instanceStatus.${status}`)

  const loadContext = useCallback(async () => {
    const ctx = await makeDocContext(answers)
    const enriched = enrichContext(ctx)
    setDocContext(enriched)
    return enriched
  }, [answers])

  const ensureContext = useCallback(() => {
    if (docContext) return Promise.resolve(docContext)
    return loadContext()
  }, [docContext, loadContext])

  useEffect(() => {
    loadDrafts().then(items => {
      setDrafts(items)
      if (items.length) {
        setSelectedId(items[0].id)
      }
    })
  }, [])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  useEffect(() => {
    const state = location.state as { openPicker?: boolean } | null
    if (state?.openPicker) {
      setAutoOpenSelection(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  useEffect(() => {
    if (!isCreateRoute || !kind || createdKindRef.current === kind) return
    createdKindRef.current = kind
    setLoading(true)
    ensureContext()
      .then(ctx => {
        const instance = createInstance(kind, ctx)
        setDrafts(prev => {
          const next = [...prev, instance]
          saveDrafts(next)
          return next
        })
        setSelectedId(instance.id)
      })
      .finally(() => {
        setLoading(false)
        navigate('/docs', { replace: true })
      })
  }, [kind, isCreateRoute, ensureContext, navigate])

  const handleCreate = useCallback(
    async (template: DocTemplate) => {
      setLoading(true)
      try {
        const ctx = await ensureContext()
        const instance = createInstance(template.id, ctx)
        setDrafts(prev => {
          const next = [...prev, instance]
          saveDrafts(next)
          return next
        })
        setSelectedId(instance.id)
      } finally {
        setLoading(false)
      }
    },
    [ensureContext]
  )

  useEffect(() => {
    if (!isEditRoute || !kind) return
    const existing = drafts.find(draft => draft.kind === kind)
    if (existing) {
      setSelectedId(existing.id)
      return
    }
    const template = templates.find(item => item.id === kind)
    if (template) {
      handleCreate(template)
    }
  }, [isEditRoute, kind, drafts, templates, handleCreate])

  const persistDraft = (next: DocInstance) => {
    setDrafts(prev => {
      const updated = prev.map(item => (item.id === next.id ? next : item))
      saveDrafts(updated)
      return updated
    })
  }

  const handleSave = () => {
    if (!activeDraft) return
    const updated: DocInstance = { ...activeDraft, status: 'ready', updatedAt: new Date().toISOString() }
    persistDraft(updated)
  }

  const handleExportPdf = async () => {
    if (!activeDraft || !activeTemplate) return
    const blob = await exportPDF(activeDraft, activeTemplate)
    triggerDownload(blob, `${activeTemplate.title}.pdf`)
    const updated: DocInstance = { ...activeDraft, status: 'exported', updatedAt: new Date().toISOString() }
    persistDraft(updated)
  }

  const handleExportDocx = async () => {
    if (!activeDraft || !activeTemplate) return
    const blob = await exportDOCX(activeDraft, activeTemplate)
    triggerDownload(blob, `${activeTemplate.title}.docx`)
    const updated: DocInstance = { ...activeDraft, status: 'exported', updatedAt: new Date().toISOString() }
    persistDraft(updated)
  }

  const handleChange = (next: DocInstance) => {
    const status: DocInstance['status'] = next.status === 'exported' ? 'draft' : next.status
    persistDraft({ ...next, status })
  }

  return (
    <div className="page docs-page">
      <div className="page-header">
        <LanguageSelector />
      </div>
      <header>
        <h1>{t('docs.create.heading')}</h1>
        <p className="muted">{t('docs.create.description')}</p>
      </header>
      <section className="card template-grid">
        {templates.map(template => {
          const doc = TEMPLATE_DOC_IDS[template.id]
            ? docsById.get(TEMPLATE_DOC_IDS[template.id] as string)
            : undefined
          return (
            <article key={template.id} className="template-card">
              <header>
                <h3>{template.title}</h3>
                {doc ? <span className="badge muted">{statusBadge(t, doc.status)}</span> : null}
              </header>
              <p>{template.description}</p>
              <div className="template-actions">
                <button className="btn" type="button" onClick={() => handleCreate(template)} disabled={loading}>
                  {t('docs.actions.create')}
                </button>
              </div>
            </article>
          )
        })}
      </section>
      <section className="card drafts-list">
        <h2>{t('docs.drafts.title')}</h2>
        {drafts.length === 0 ? (
          <p className="muted">{t('docs.empty')}</p>
        ) : (
          <ul>
            {drafts.map(draft => {
              const template = getTemplate(draft.kind)
              return (
                <li key={draft.id}>
                  <button
                    className={draft.id === selectedId ? 'link active' : 'link'}
                    onClick={() => setSelectedId(draft.id)}
                  >
                    {template.title} · v{draft.version} · {docStatusLabel(draft.status)}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      {activeDraft && activeTemplate ? (
        <DocEditor
          template={activeTemplate}
          draft={activeDraft}
          onChange={handleChange}
          onSave={handleSave}
          onExportPdf={handleExportPdf}
          onExportDocx={activeTemplate.exportable.includes('docx') ? handleExportDocx : undefined}
          context={docContext}
          autoOpenPicker={autoOpenSelection && activeDraft.kind === 'EU_DoC'}
          onPickerAutoOpened={() => setAutoOpenSelection(false)}
        />
      ) : null}
    </div>
  )
}
