import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { t } from '@/i18n'
import { recommendFromTags } from '@/domain/intelligence'
import { useDocuments, type Doc } from '@/state/useDocuments'
import { useProjectData } from '@/state/useProjectData'
import LegislationStandardsPicker from '@/ui/LegislationStandardsPicker'
type SelectionState = { legislationIds: string[]; standardCodes: string[] }

type Params = { projectId?: string; id?: string }

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((value, index) => value === right[index])
}

export default function ProjectDocs() {
  const params = useParams<Params>()
  const navigate = useNavigate()
  const projectId = params.projectId ?? params.id
  const { load, setLawOverrides, setStandardOverrides } = useProjectData()
  const loadDocs = useDocuments(state => state.loadForProject)
  const docs = useDocuments(state => state.docs)
  const removeDoc = useDocuments(state => state.remove)

  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [recommended, setRecommended] = useState<SelectionState>({ legislationIds: [], standardCodes: [] })
  const [tags, setTags] = useState<string[]>([])
  const [overridesActive, setOverridesActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    load(projectId)
      .then(data => {
        const tagList = data.derivedTags ?? []
        setTags(tagList)
        const auto = recommendFromTags(tagList)
        const base: SelectionState = {
          legislationIds: auto.legislationIds,
          standardCodes: auto.standardCodes
        }
        setRecommended(base)
        const hasOverrides = Boolean((data.lawOverrides?.length ?? 0) || (data.standardOverrides?.length ?? 0))
        const initial: SelectionState = {
          legislationIds: data.lawOverrides && data.lawOverrides.length ? data.lawOverrides : base.legislationIds,
          standardCodes:
            data.standardOverrides && data.standardOverrides.length ? data.standardOverrides : base.standardCodes
        }
        setSelection(initial)
        setOverridesActive(hasOverrides)
        setError(null)
      })
      .catch(err => {
        console.error('Failed to load project data', err)
        setError(t('projectDocs.loadError', 'Projekt konnte nicht geladen werden.'))
      })
      .finally(() => setLoading(false))
  }, [projectId, load])

  useEffect(() => {
    if (!projectId) return
    loadDocs(projectId).catch(err => {
      console.error('Failed to load documents', err)
    })
  }, [projectId, loadDocs])

  const handleSelectionChange = useCallback(
    (next: SelectionState) => {
      if (!projectId) return
      setSelection(next)
      setOverridesActive(true)
      void setLawOverrides(projectId, next.legislationIds)
      void setStandardOverrides(projectId, next.standardCodes)
    },
    [projectId, setLawOverrides, setStandardOverrides]
  )

  const handleReset = useCallback(() => {
    if (!projectId) return
    setSelection(recommended)
    setOverridesActive(false)
    void setLawOverrides(projectId, [])
    void setStandardOverrides(projectId, [])
  }, [projectId, recommended, setLawOverrides, setStandardOverrides])

  if (!projectId) {
    return (
      <div className="project-docs-page">
        <p>{t('projectDocs.missingId', 'Kein Projekt ausgewählt.')}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="project-docs-page">
        <p>{t('projectDocs.loading', 'Lade Dokumentoptionen …')}</p>
      </div>
    )
  }

  if (!tags.length) {
    return (
      <div className="project-docs-page">
        <div className="card">
          <h2>{t('projectDocs.completeWizard.title', 'Fragebogen abschließen')}</h2>
          <p>{t('projectDocs.completeWizard.body', 'Bitte beenden Sie zuerst den Fragebogen, um Empfehlungen zu erhalten.')}</p>
          <button className="btn" type="button" onClick={() => navigate(`/project/${projectId}/wizard`)}>
            {t('projectDocs.completeWizard.cta', 'Zum Wizard')}
          </button>
        </div>
      </div>
    )
  }

  const resetDisabled =
    !selection ||
    (arraysEqual(selection.legislationIds, recommended.legislationIds) &&
      arraysEqual(selection.standardCodes, recommended.standardCodes))

  return (
    <div className="project-docs-page">
      <section className="card">
        <header>
          <h2>{t('projectDocs.selection.title', 'Rechtsrahmen & Normen')}</h2>
          <p className="muted">
            {overridesActive
              ? t('projectDocs.selection.overrides', 'Eigene Auswahl aktiv – Empfehlungen wurden überschrieben.')
              : t('projectDocs.selection.recommended', 'Basierend auf den erkannten Produkttags.')}
          </p>
        </header>
        {selection ? (
          <LegislationStandardsPicker initial={selection} onChange={handleSelectionChange} />
        ) : null}
        <div className="picker-actions">
          <button type="button" className="link" onClick={handleReset} disabled={resetDisabled}>
            {t('projectDocs.selection.reset', 'Zurücksetzen')}
          </button>
        </div>
        {error ? (
          <p className="muted" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="card">
        <header>
          <h2>{t('projectDocs.documents.title', 'Gespeicherte Dokumente')}</h2>
        </header>
        <DocsList docs={docs} onDelete={removeDoc} />
      </section>
    </div>
  )
}

type DocsListProps = {
  docs: Doc[]
  onDelete: (id: string) => Promise<void>
}

function DocsList({ docs, onDelete }: DocsListProps) {
  if (!docs.length) {
    return <p className="muted">{t('projectDocs.documents.empty', 'Noch keine Dokumente gespeichert.')}</p>
  }

  const handleDelete = (id: string) => {
    void onDelete(id).catch(error => {
      console.error('Failed to delete document', error)
      window.alert(t('projectDocs.documents.deleteError', 'Dokument konnte nicht gelöscht werden.'))
    })
  }

  return (
    <ul className="docs-list">
      {docs.map(doc => (
        <li key={doc.id} className="docs-list-item">
          <div>
            <strong>{doc.title || doc.kind}</strong>
            <div className="muted small">
              {doc.kind} • {doc.status}
            </div>
          </div>
          <div className="docs-actions">
            <button className="btn ghost small" type="button" onClick={() => window.open(`/project/${doc.project_id}/docs`, '_self')}>
              {t('projectDocs.documents.open', 'Öffnen')}
            </button>
            <button
              className="btn ghost small"
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  t('projectDocs.documents.deleteConfirm', 'Dokument wirklich löschen?')
                )
                if (!confirmed) return
                handleDelete(doc.id)
              }}
            >
              {t('projectDocs.documents.delete', 'Löschen')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
