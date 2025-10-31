import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { listTemplates, createInstance, loadDrafts, saveDrafts, exportPDF, exportDOCX, getTemplate } from '@/docs/generator'
import type { DocInstance, DocKind, DocTemplate } from '@/docs/types'
import { makeDocContext, enrichContext } from '@/docs/context'
import { normalizeSelectionBlock } from '@/docs/selectionUtils'
import { useWizard } from '@/state/useWizard'
import DocEditor from './DocEditor'
import { t } from '@/i18n'
import { DOCUMENT_CATALOG } from '@/data/documentCatalog'
import {
  useProjects,
  selectProjectById,
  selectSelectionByProjectId,
  selectPackByProjectId
} from '@/state/useProjects'

const TEMPLATE_DOC_IDS: Partial<Record<DocKind, string>> = {
  EU_DoC: 'doc_eu_doc',
  Risk_Register: 'doc_risk',
  TechFile_Checklist: 'doc_tech_file',
  Labels_Checklist: 'label_ce_trace',
  EPR_Info_Sheet: 'epr_weee_reg',
  User_Manual_Starter: 'doc_user_manual'
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
  const params = useParams<{ projectId: string; kind?: DocKind }>()
  const { kind, projectId } = params
  const navigate = useNavigate()
  const location = useLocation()
  const project = useProjects(state => (projectId ? selectProjectById(state, projectId) : null))
  const selectProject = useProjects(state => state.select)
  const loadProjects = useProjects(state => state.load)
  const projectsLoading = useProjects(state => state.loading)
  const loadProjectAnswers = useProjects(state => state.loadAnswers)
  const storedSelection = useProjects(state =>
    projectId ? selectSelectionByProjectId(state, projectId) : undefined
  )
  const answersByProject = useProjects(state => state.answersByProject)
  const cachedAnswers = projectId ? answersByProject[projectId] : undefined
  const storedPack = useProjects(state => (projectId ? selectPackByProjectId(state, projectId) : undefined))
  const hydrate = useWizard(state => state.hydrate)
  const { answers } = useWizard()
  const [drafts, setDrafts] = useState<DocInstance[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const createdKindRef = useRef<string | null>(null)
  const [docContext, setDocContext] = useState<ReturnType<typeof enrichContext> | null>(null)
  const [autoOpenSelection, setAutoOpenSelection] = useState(false)
  const allDraftsRef = useRef<DocInstance[]>([])

  const isCreateRoute = location.pathname.includes('/docs/new')
  const isEditRoute = location.pathname.includes('/docs/edit')

  useEffect(() => {
    if (!projectId) {
      navigate('/', { replace: true })
      return
    }
    selectProject(projectId)
  }, [navigate, projectId, selectProject])

  useEffect(() => {
    if (!projectId) return
    if (!project && !projectsLoading) {
      loadProjects().catch(error => {
        console.error('Failed to load projects', error)
      })
    }
  }, [loadProjects, project, projectId, projectsLoading])

  useEffect(() => {
    if (!projectId) return
    if (cachedAnswers !== undefined) {
      hydrate(cachedAnswers)
      return
    }
    let active = true
    ;(async () => {
      try {
        const loaded = await loadProjectAnswers(projectId)
        if (!active) return
        hydrate(loaded ?? {})
      } catch (error) {
        console.error('Failed to load project answers', error)
        if (!active) return
        hydrate({})
      }
    })()
    return () => {
      active = false
    }
  }, [cachedAnswers, hydrate, loadProjectAnswers, projectId])

  if (!projectId) {
    return null
  }

  if (!project) {
    return (
      <div className="page docs-page">
        <header className="page-header">
          <h1>{t('docs.loading', 'Loading documentation workspace…')}</h1>
        </header>
      </div>
    )
  }

  const resultsSelection = useMemo(
    () => (storedSelection ? normalizeSelectionBlock(storedSelection) : null),
    [storedSelection]
  )

  const autoFromResults = useMemo(
    () => ({
      applicableLegislation: resultsSelection?.selectedLegislationIds ?? [],
      applicableStandards: resultsSelection?.selectedStandards.map(item => item.en) ?? []
    }),
    [resultsSelection]
  )

  const scope = useMemo(
    () => ({ projectId: projectId!, productId: projectId! }),
    [projectId]
  )

  const templates = useMemo(() => listTemplates(), [])
  const docsById = useMemo(() => new Map(DOCUMENT_CATALOG.map(doc => [doc.docId, doc])), [])

  const activeDraft = drafts.find(draft => draft.id === selectedId) || null
  const activeTemplate = activeDraft ? getTemplate(activeDraft.kind) : null
  const safeProductName = useMemo(
    () => project.name.trim().replace(/[\/:*?"<>|]+/g, '_').replace(/\s+/g, '_'),
    [project.name]
  )

  const syncDrafts = (updater: (current: DocInstance[]) => DocInstance[]) => {
    setDrafts(prev => {
      const next = updater(prev)
      const others = allDraftsRef.current.filter(
        draft => draft.scope?.projectId !== scope.projectId || draft.scope?.productId !== scope.productId
      )
      allDraftsRef.current = [...others, ...next]
      saveDrafts(allDraftsRef.current)
      return next
    })
  }

  const loadContext = useCallback(async () => {
    const ctx = await makeDocContext({
      answers,
      auto: autoFromResults
    })
    const enriched = enrichContext(ctx)
    setDocContext(enriched)
    return enriched
  }, [answers, autoFromResults])

  const ensureContext = useCallback(() => {
    if (docContext) return Promise.resolve(docContext)
    return loadContext()
  }, [docContext, loadContext])

  useEffect(() => {
    loadDrafts().then(items => {
      let mutated = false
      const scopedItems = items.map(item => {
        if (!item.scope) {
          mutated = true
          return { ...item, scope }
        }
        return item
      })
      let shouldPersist = mutated
      const others = scopedItems.filter(
        draft => draft.scope?.projectId !== scope.projectId || draft.scope?.productId !== scope.productId
      )
      let scoped = scopedItems.filter(
        draft => draft.scope?.projectId === scope.projectId && draft.scope?.productId === scope.productId
      )
      if (storedPack?.length) {
        const merged = new Map(scoped.map(draft => [draft.kind, draft]))
        storedPack.forEach(doc => {
          const scopedDoc =
            doc.scope?.projectId === scope.projectId && doc.scope?.productId === scope.productId
              ? doc
              : { ...doc, scope }
          const existing = merged.get(scopedDoc.kind)
          if (!existing || (existing.updatedAt ?? '') < (scopedDoc.updatedAt ?? '')) {
            merged.set(scopedDoc.kind, scopedDoc)
            shouldPersist = true
          }
        })
        scoped = Array.from(merged.values())
      }
      allDraftsRef.current = [...others, ...scoped]
      if (shouldPersist) {
        void saveDrafts(allDraftsRef.current)
      }
      setDrafts(scoped)
      if (scoped.length) {
        setSelectedId(scoped[0].id)
      }
    })
  }, [scope, storedPack])

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
        instance.scope = scope
        syncDrafts(prev => [...prev, instance])
        setSelectedId(instance.id)
      })
      .finally(() => {
        setLoading(false)
        navigate(`/project/${projectId}/docs`, { replace: true })
      })
  }, [kind, isCreateRoute, ensureContext, navigate, scope, projectId])

  const handleCreate = useCallback(
    async (template: DocTemplate) => {
      setLoading(true)
      try {
        const ctx = await ensureContext()
        const instance = createInstance(template.id, ctx)
        instance.scope = scope
        syncDrafts(prev => [...prev, instance])
        setSelectedId(instance.id)
      } finally {
        setLoading(false)
      }
    },
    [ensureContext, scope]
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
    syncDrafts(prev => prev.map(item => (item.id === next.id ? next : item)))
  }

  const handleSave = () => {
    if (!activeDraft) return
    const updated: DocInstance = { ...activeDraft, status: 'ready', updatedAt: new Date().toISOString() }
    persistDraft(updated)
  }

  const handleExportPdf = async () => {
    if (!activeDraft || !activeTemplate) return
    const blob = await exportPDF(activeDraft, activeTemplate)
    triggerDownload(blob, `${safeProductName}__${activeTemplate.title}.pdf`)
    const updated: DocInstance = { ...activeDraft, status: 'exported', updatedAt: new Date().toISOString() }
    persistDraft(updated)
  }

  const handleExportDocx = async () => {
    if (!activeDraft || !activeTemplate) return
    const blob = await exportDOCX(activeDraft, activeTemplate)
    triggerDownload(blob, `${safeProductName}__${activeTemplate.title}.docx`)
    const updated: DocInstance = { ...activeDraft, status: 'exported', updatedAt: new Date().toISOString() }
    persistDraft(updated)
  }

  const handleChange = (next: DocInstance) => {
    const status: DocInstance['status'] = next.status === 'exported' ? 'draft' : next.status
    persistDraft({ ...next, status })
  }

  return (
    <div className="page docs-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1>{t('docs.create.heading', 'Create document')}</h1>
          <p className="muted">{t('docs.create.description', 'Generate compliance documentation directly from your answers.')}</p>
        </div>
      </header>
      <section className="card template-grid">
        {templates.map(template => {
          const doc = TEMPLATE_DOC_IDS[template.id]
            ? docsById.get(TEMPLATE_DOC_IDS[template.id] as string)
            : undefined
          const status = doc?.status
          const statusText =
            status === 'exportable'
              ? t('docs.status.exportable', 'Generated by EUCertify')
              : status === 'upload'
              ? t('docs.status.upload', 'Upload evidence')
              : status === 'external'
              ? t('docs.status.external', 'External requirement')
              : null
          return (
            <article key={template.id} className="template-card">
              {status && statusText ? (
                <div className={`status-pill ${status}`}>
                  <span className="dot" aria-hidden="true"></span>
                  {statusText}
                </div>
              ) : null}
              <header>
                <h3>{template.title}</h3>
              </header>
              <p>{template.description}</p>
              <div className="template-actions">
                <button className="btn" type="button" onClick={() => handleCreate(template)} disabled={loading}>
                  {t('docs.actions.create', 'Create draft')}
                </button>
              </div>
            </article>
          )
        })}
      </section>
      <section className="card drafts-list">
        <h2>{t('docs.drafts.heading', 'Drafts')}</h2>
        {drafts.length === 0 ? (
          <p className="muted">{t('docs.empty', 'No documents yet')}</p>
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
                    {template.title} · v{draft.version} · {draft.status}
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
