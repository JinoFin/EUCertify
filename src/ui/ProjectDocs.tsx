import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { t } from '@/i18n'
import { buildReport } from '@/domain/engine'
import { buildIntelligence } from '@/domain/intelligence'
import type { AnswerMap } from '@/domain/types'
import type { DocInstance, DocKind, SelectionBlock } from '@/docs/types'
import { makeDocContext, enrichContext } from '@/docs/context'
import { createInstance, exportPDF, exportDOCX, getTemplate } from '@/docs/generator'
import { normalizeSelectionBlock, selectionsEqual as compareSelections } from '@/docs/selectionUtils'
import DOCUMENT_CATALOG from '@/data/documentCatalog'
import { STANDARDS_CATALOG } from '@/data/standardsCatalog'
import { useProjectData } from '@/state/useProjectData'
import { useDocuments } from '@/state/useDocuments'
import { useProjects } from '@/state/useProjects'
import { useSessionStore } from '@/state/useSession'
import LegislationStandardsPicker from './LegislationStandardsPicker'
import ComplianceChecklist, { buildChecklistGroups } from './Checklist'
import DocEditor from './DocEditor'
import { exportPdf } from './pdf'
import { LockIcon, MoreVerticalIcon } from './icons'

type TemplateOption = {
  kind: DocKind
  docId: string
}

const DOC_TEMPLATE_MAP: TemplateOption[] = [
  { kind: 'EU_DoC', docId: 'doc_eu_doc' },
  { kind: 'Risk_Register', docId: 'doc_risk' },
  { kind: 'TechFile_Checklist', docId: 'doc_tech_file' },
  { kind: 'Labels_Checklist', docId: 'label_ce_trace' },
  { kind: 'EPR_Info_Sheet', docId: 'epr_weee_reg' },
  { kind: 'User_Manual_Starter', docId: 'doc_user_manual' }
]

const toTemplateMeta = (docId: string) => DOCUMENT_CATALOG.find(item => item.docId === docId)

type PersistedPayload = {
  data?: Record<string, any>
  selections?: SelectionBlock
}

const mapDocumentToDraft = (
  document: ReturnType<typeof useDocuments.getState>['documentsByProject'][string][number],
  ctx: ReturnType<typeof enrichContext>
): DocInstance => {
  const template = getTemplate(document.kind as DocKind)
  const base = createInstance(template.id, ctx)
  const payload = (document.payload ?? {}) as PersistedPayload
  return {
    ...base,
    id: document.id,
    kind: template.id,
    createdAt: document.created_at ?? base.createdAt,
    updatedAt: document.updated_at ?? base.updatedAt,
    status: document.status === 'final' ? 'ready' : 'draft',
    data: { ...base.data, ...(payload.data ?? {}) },
    selections: payload.selections ? normalizeSelectionBlock(payload.selections) : undefined
  }
}

export default function ProjectDocs() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const project = useProjects(state =>
    projectId ? state.list.find(item => item.id === projectId) ?? null : null
  )
  const loadProjects = useProjects(state => state.load)
  const projectsLoading = useProjects(state => state.loading)
  const documentsByProject = useDocuments(state => state.documentsByProject)
  const listDocuments = useDocuments(state => state.list)
  const createDocumentDraft = useDocuments(state => state.createDraft)
  const updateDocument = useDocuments(state => state.update)
  const removeDocument = useDocuments(state => state.remove)
  const loadProjectData = useProjectData(state => state.load)
  const answers = useProjectData(state => state.answers)
  const tags = useProjectData(state => state.tags)
  const overrides = useProjectData(state => state.overrides)
  const isComplete = useProjectData(state => state.is_complete)
  const saveOverrides = useProjectData(state => state.saveOverrides)
  const resetOverrides = useProjectData(state => state.resetOverrides)
  const setSessionSelection = useSessionStore(state => state.setResultsSelection)
  const [loadingProjectData, setLoadingProjectData] = useState(false)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [draftForEditor, setDraftForEditor] = useState<DocInstance | null>(null)
  const [generatorBusy, setGeneratorBusy] = useState(false)
  const [savingDoc, setSavingDoc] = useState(false)

  useEffect(() => {
    if (projectId) {
      void loadProjects().catch(error => {
        console.error('Failed to load projects', error)
      })
    }
  }, [loadProjects, projectId])

  useEffect(() => {
    if (!projectId) return
    let active = true
    setLoadingProjectData(true)
    loadProjectData(projectId)
      .catch(error => {
        console.error('Failed to load project data', error)
      })
      .finally(() => {
        if (!active) return
        setLoadingProjectData(false)
      })
    return () => {
      active = false
    }
  }, [loadProjectData, projectId])

  const report = useMemo(() => buildReport(answers as AnswerMap), [answers])
  const detectedTags = report.productSummary.detectedTags
  const combinedTags = useMemo(() => (tags.length ? tags : detectedTags), [detectedTags, tags])
  const intelligence = useMemo(
    () =>
      buildIntelligence({
        answers: answers as AnswerMap,
        tags: combinedTags
      }),
    [answers, combinedTags]
  )

  const autoSelectionFromIntelligence = useMemo(
    () => ({
      legislationIds: Array.from(new Set(intelligence.applicableLegislation)),
      standards: Array.from(new Set(intelligence.applicableStandards)).map(en => ({
        en,
        title: STANDARDS_CATALOG.find(item => item.en === en)?.title ?? ''
      }))
    }),
    [intelligence]
  )

  const autoSelectionNormalized = useMemo(
    () =>
      normalizeSelectionBlock({
        selectedLegislationIds: autoSelectionFromIntelligence.legislationIds,
        selectedStandards: autoSelectionFromIntelligence.standards
      }),
    [autoSelectionFromIntelligence]
  )

  const overrideSelection = useMemo(() => {
    if (!overrides) return undefined
    return normalizeSelectionBlock({
      selectedLegislationIds: overrides.legislation_ids ?? [],
      selectedStandards: overrides.standard_codes.map(code => ({
        en: code,
        title: STANDARDS_CATALOG.find(item => item.en === code)?.title ?? ''
      }))
    })
  }, [overrides])

  const initialSelection = overrideSelection ?? autoSelectionNormalized
  const [selection, setSelection] = useState<SelectionBlock>(initialSelection)

  useEffect(() => {
    setSelection(current => (compareSelections(current, initialSelection) ? current : initialSelection))
  }, [initialSelection])

  useEffect(() => {
    if (!projectId) return
    const initial = overrideSelection ?? autoSelectionNormalized
    setSessionSelection(projectId, projectId, initial)
  }, [autoSelectionNormalized, overrideSelection, projectId, setSessionSelection])

  const selectionAutoPayload = useMemo(
    () => ({
      applicableLegislation: selection.selectedLegislationIds,
      applicableStandards: selection.selectedStandards.map(item => item.en)
    }),
    [selection]
  )

  const docContext = useMemo(
    () => enrichContext(makeDocContext({ answers: answers as AnswerMap, intelligence, auto: selectionAutoPayload })),
    [answers, intelligence, selectionAutoPayload]
  )

  const documents = useMemo(() => {
    if (!projectId) return []
    return documentsByProject[projectId] ?? []
  }, [documentsByProject, projectId])

  useEffect(() => {
    if (!projectId || !isComplete) return
    setDocumentsLoading(true)
    listDocuments(projectId)
      .catch(error => {
        console.error('Failed to list project documents', error)
      })
      .finally(() => {
        setDocumentsLoading(false)
      })
  }, [isComplete, listDocuments, projectId])

  const handleSelectionChange = useCallback(
    (next: SelectionBlock) => {
      const normalized = normalizeSelectionBlock(next)
      setSelection(current => (compareSelections(current, normalized) ? current : normalized))
      if (projectId) {
        void saveOverrides(projectId, {
          legislation_ids: normalized.selectedLegislationIds,
          standard_codes: normalized.selectedStandards.map(item => item.en)
        })
        setSessionSelection(projectId, projectId, normalized)
      }
    },
    [projectId, saveOverrides, setSessionSelection]
  )

  const handleResetSelection = useCallback(() => {
    if (!projectId) return
    void resetOverrides(projectId)
    setSelection(current => (compareSelections(current, autoSelectionNormalized) ? current : autoSelectionNormalized))
    setSessionSelection(projectId, projectId, autoSelectionNormalized)
  }, [autoSelectionNormalized, projectId, resetOverrides, setSessionSelection])

  const handleGenerateDocument = async (kind: DocKind) => {
    if (!projectId) return
    setGeneratorBusy(true)
    try {
      const template = getTemplate(kind)
      const instance = createInstance(template.id, docContext)
      const payload: PersistedPayload = {
        data: instance.data,
        selections: selection
      }
      const title = template.title
      const created = await createDocumentDraft(projectId, kind, title, payload)
      if (created) {
        setGeneratorOpen(false)
        setActiveDocId(created.id)
      }
    } finally {
      setGeneratorBusy(false)
    }
  }

  useEffect(() => {
    if (!activeDocId) {
      setDraftForEditor(null)
      return
    }
    const activeDoc = documents.find(doc => doc.id === activeDocId)
    if (!activeDoc) {
      setDraftForEditor(null)
      return
    }
    const draft = mapDocumentToDraft(activeDoc, docContext)
    setDraftForEditor(draft)
  }, [activeDocId, docContext, documents])

  const handleSaveDraft = async () => {
    if (!draftForEditor) return
    setSavingDoc(true)
    try {
      const patchPayload: PersistedPayload = {
        data: draftForEditor.data,
        selections: draftForEditor.selections
      }
      await updateDocument(draftForEditor.id, {
        payload: patchPayload,
        status: draftForEditor.status === 'ready' ? 'final' : 'draft'
      })
    } finally {
      setSavingDoc(false)
    }
  }

  const handleExportPdf = async () => {
    if (!draftForEditor) return
    const template = getTemplate(draftForEditor.kind)
    const blob = await exportPDF(draftForEditor, template)
    const meta = toTemplateMeta(DOC_TEMPLATE_MAP.find(item => item.kind === draftForEditor.kind)?.docId ?? '')
    const filename = `${project?.name ?? 'document'}-${meta?.name ?? template.title}.pdf`
    triggerDownload(blob, filename)
  }

  const handleExportDocx = async () => {
    if (!draftForEditor) return
    const template = getTemplate(draftForEditor.kind)
    const blob = await exportDOCX(draftForEditor, template)
    const meta = toTemplateMeta(DOC_TEMPLATE_MAP.find(item => item.kind === draftForEditor.kind)?.docId ?? '')
    const filename = `${project?.name ?? 'document'}-${meta?.name ?? template.title}.docx`
    triggerDownload(blob, filename)
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

  const handleRename = async (docId: string, currentTitle: string) => {
    const next = window.prompt(t('docs.rename.prompt', 'Rename document'), currentTitle)
    if (!next || !next.trim()) return
    await updateDocument(docId, { title: next.trim() })
  }

  const handleDelete = async (docId: string) => {
    const confirmed = window.confirm(t('docs.delete.confirm', 'Delete this document?'))
    if (!confirmed) return
    await removeDocument(docId)
    if (activeDocId === docId) {
      setActiveDocId(null)
    }
  }

  const handleOpen = (docId: string) => {
    setActiveDocId(docId)
  }

  const checklistGroups = useMemo(() => buildChecklistGroups(report), [report])

  const exportChecklist = () => {
    exportPdf({
      answers: answers as AnswerMap,
      report,
      productName: project?.name ?? t('results.untitled', 'Untitled product')
    })
  }

  if (!projectId) {
    return (
      <div className="page project-docs-page" style={{ padding: 16 }}>
        <p className="muted">{t('docs.error.missingProject', 'Select a project to manage documents.')}</p>
        <button className="btn" type="button" onClick={() => navigate('/')}>{t('wizard.backToDashboard', 'Back to dashboard')}</button>
      </div>
    )
  }

  if ((projectsLoading && !project) || loadingProjectData) {
    return (
      <div className="page project-docs-page" style={{ padding: 16 }}>
        <p className="muted">{t('docs.loading', 'Loading project data…')}</p>
      </div>
    )
  }

  if (!isComplete) {
    return (
      <div className="page project-docs-page">
        <div className="docs-locked">
          <div className="card">
            <div className="lock-icon">
              <LockIcon width={32} height={32} />
            </div>
            <h2>{t('docs.locked.title', 'Complete the questionnaire')}</h2>
            <p className="muted">
              {t(
                'docs.locked.subtitle',
                'Finish the questions for this product to unlock document generation and the auto checklist.'
              )}
            </p>
            <button className="btn" type="button" onClick={() => navigate(`/project/${projectId}/wizard`)}>
              {t('docs.locked.cta', 'Go to Wizard')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page project-docs-page">
      <header className="page-header">
        <div>
          <h2>{t('docs.hub.title', 'Documents hub')}</h2>
          <p className="muted">
            {t('docs.hub.subtitle', 'Generate compliance documents and track your tailored checklist.')}
          </p>
        </div>
      </header>

      <section className="card">
        <h3>{t('docs.selection.title', 'Legislation & EN standards')}</h3>
        {!overrides ? (
          <div className="info-banner">
            {t('docs.selection.auto', 'We pre-selected legislation and standards from your answers. Adjust if needed.')}
          </div>
        ) : (
          <div className="info-banner">
            <span>{t('docs.selection.custom', 'Using your custom selection.')}</span>{' '}
            <button className="link" type="button" onClick={handleResetSelection}>
              {t('docs.selection.reset', 'Apply recommendations again')}
            </button>
          </div>
        )}
        <LegislationStandardsPicker
          initial={initialSelection}
          autoFromReport={autoSelectionFromIntelligence}
          onChange={handleSelectionChange}
        />
      </section>

      <div className="project-docs-grid">
        <section className="card docs-column">
          <header className="section-header">
            <div>
              <h3>{t('docs.generated.title', 'Generated Documents')}</h3>
              <p className="muted">
                {t('docs.generated.subtitle', 'Drafts saved for this project. Edit, export, or remove them at any time.')}
              </p>
            </div>
            <button className="btn" type="button" onClick={() => setGeneratorOpen(true)}>
              {t('docs.generated.new', 'Generate New')}
            </button>
          </header>
          {documentsLoading ? (
            <p className="muted">{t('docs.generated.loading', 'Loading documents…')}</p>
          ) : documents.length === 0 ? (
            <p className="muted">{t('docs.generated.empty', 'No documents generated yet.')}</p>
          ) : (
            <div className="doc-list">
              {documents.map(doc => {
                const meta = toTemplateMeta(doc.kind)
                return (
                  <article key={doc.id} className="doc-row">
                    <div className="doc-row-main">
                      <div>
                        <h4>{doc.title || meta?.name || doc.kind}</h4>
                        <p className="muted">{meta?.description}</p>
                      </div>
                      <span className={`badge doc-status status-${(doc.status ?? 'draft').toString().toLowerCase()}`}>
                        {(doc.status ?? 'draft').toString().toUpperCase()}
                      </span>
                    </div>
                    <footer className="doc-row-actions">
                      <button className="btn small" type="button" onClick={() => handleOpen(doc.id)}>
                        {t('docs.generated.open', 'Open')}
                      </button>
                      <button className="btn ghost small" type="button" onClick={() => handleRename(doc.id, doc.title)}>
                        {t('docs.generated.rename', 'Rename')}
                      </button>
                      <button className="btn ghost small" type="button" onClick={() => handleDelete(doc.id)}>
                        {t('docs.generated.delete', 'Delete')}
                      </button>
                    </footer>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="card checklist-column">
          <header className="section-header">
            <div>
              <h3>{t('docs.checklist.title', 'Compliance Checklist')}</h3>
              <p className="muted">
                {t('docs.checklist.subtitle', 'Track testing, documentation, and registrations tailored to your answers.')}
              </p>
            </div>
            <button className="btn ghost" type="button" onClick={exportChecklist}>
              {t('docs.checklist.export', 'Export checklist (PDF)')}
            </button>
          </header>
          <ComplianceChecklist
            groups={checklistGroups}
            storageKey={`eucertify:checklist:${projectId}`}
            emptyMessage={t('docs.checklist.empty', 'No checklist items available yet.')}
          />
        </section>
      </div>

      {generatorOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="section-header" style={{ marginBottom: 12 }}>
              <div>
                <h3>{t('docs.generator.title', 'Generate a document')}</h3>
                <p className="muted">
                  {t('docs.generator.subtitle', 'Pick a template to create a draft pre-filled with your answers.')}
                </p>
              </div>
              <button className="btn ghost" type="button" onClick={() => setGeneratorOpen(false)}>
                {t('dashboard.modal.cancel', 'Cancel')}
              </button>
            </header>
            <div className="template-grid">
              {DOC_TEMPLATE_MAP.map(option => {
                const meta = toTemplateMeta(option.docId)
                if (!meta) return null
                return (
                  <button
                    key={option.kind}
                    className="template-card"
                    type="button"
                    disabled={generatorBusy}
                    onClick={() => handleGenerateDocument(option.kind)}
                  >
                    <div className="template-card-header">
                      <MoreVerticalIcon width={18} height={18} />
                      <span>{meta.name}</span>
                    </div>
                    <p className="muted">{meta.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {draftForEditor ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal wide">
            <DocEditor
              template={getTemplate(draftForEditor.kind)}
              draft={draftForEditor}
              onChange={setDraftForEditor}
              onSave={handleSaveDraft}
              onExportPdf={handleExportPdf}
              onExportDocx={handleExportDocx}
              onClose={() => setActiveDocId(null)}
              context={docContext}
            />
            {savingDoc ? <p className="muted" style={{ marginTop: 12 }}>{t('docs.generated.saving', 'Saving…')}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
