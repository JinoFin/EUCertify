import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n'
import { getSupabase } from '@/auth/supabase'

type DocumentRow = {
  id: string
  project_id: string
  project_name: string
  kind: string
  title: string
  status: string | null
  created_at: string | null
}

type FilterValue = 'all' | 'draft' | 'final'

type RawDocumentRow = {
  id?: string | null
  project_id?: string | null
  kind?: string | null
  title?: string | null
  status?: string | null
  created_at?: string | null
  projects?: {
    name?: string | null
  } | null
}

const STATUS_LABELS: Record<Exclude<FilterValue, 'all'>, string> = {
  draft: 'Draft',
  final: 'Final'
}

const normalizeStatus = (value: string | null | undefined): 'draft' | 'final' | 'other' => {
  if (!value) return 'draft'
  const lower = value.toLowerCase()
  if (lower === 'draft') return 'draft'
  if (lower === 'final') return 'final'
  return 'other'
}

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function AllDocuments() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabase()
    let active = true

    if (!supabase) {
      setLoadError(t('documents.all.supabaseMissing', 'Supabase client not configured.'))
      setLoading(false)
      return
    }

    setLoading(true)
    void supabase
      .from('documents')
      .select('id, project_id, kind, title, status, created_at, projects(name)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load documents', error)
          setLoadError(t('documents.all.loadError', 'Unable to load documents right now.'))
          setDocuments([])
        } else {
          const rows = (data ?? []) as RawDocumentRow[]
          const mapped = rows.map(row => ({
            id: row.id ?? '',
            project_id: row.project_id ?? '',
            project_name:
              row.projects?.name ?? t('documents.all.unknownProject', 'Untitled project'),
            kind: row.kind ?? '',
            title: row.title ?? '',
            status: row.status ?? null,
            created_at: row.created_at ?? null
          }))
          setDocuments(mapped)
          setLoadError(null)
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase()
    return documents.filter(doc => {
      const status = normalizeStatus(doc.status)
      if (filter !== 'all' && status !== filter) {
        return false
      }
      if (!term) return true
      const haystack = `${doc.title} ${doc.project_name}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [documents, filter, search])

  const handleDelete = async (doc: DocumentRow) => {
    const confirmed = window.confirm(
      t('documents.all.deleteConfirm', 'Delete this document? This action cannot be undone.')
    )
    if (!confirmed) return
    const supabase = getSupabase()
    if (!supabase) {
      setDocuments(items => items.filter(item => item.id !== doc.id))
      return
    }
    setDeletingId(doc.id)
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) {
      console.error('Failed to delete document', error)
      setLoadError(t('documents.all.deleteError', 'Could not delete the document. Please try again.'))
    } else {
      setDocuments(items => items.filter(item => item.id !== doc.id))
      setLoadError(null)
    }
    setDeletingId(null)
  }

  const handleOpen = (doc: DocumentRow) => {
    if (!doc.project_id) return
    navigate(`/project/${doc.project_id}/docs`, { state: { highlightDocId: doc.id } })
  }

  const emptyState = !loading && filteredDocuments.length === 0

  return (
    <div className="page documents-page">
      <header className="page-header" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1>{t('documents.all.title', 'All documents')}</h1>
          <p className="muted">
            {t('documents.all.subtitle', 'Review drafts and final documents across every project.')}
          </p>
        </div>
      </header>

      <section className="card">
        <div className="documents-controls">
          <div className="documents-filters" role="tablist" aria-label={t('documents.all.filters', 'Filter documents')}>
            {([
              ['all', t('documents.all.filter.all', 'All')],
              ['draft', t('documents.all.filter.drafts', 'Drafts')],
              ['final', t('documents.all.filter.final', 'Final')]
            ] satisfies [FilterValue, string][]).map(([value, label]) => {
              const isActive = filter === value
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`btn ghost small${isActive ? ' active' : ''}`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="documents-search">
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t('documents.all.searchPlaceholder', 'Search by document or project')}
              aria-label={t('documents.all.searchLabel', 'Search documents')}
            />
          </div>
        </div>

        {loading ? (
          <p className="muted">{t('documents.all.loading', 'Loading documents…')}</p>
        ) : loadError ? (
          <p className="muted" role="alert">
            {loadError}
          </p>
        ) : emptyState ? (
          <div className="documents-empty" role="status">
            <div className="documents-empty-illustration" aria-hidden="true">
              📄
            </div>
            <p>{t('documents.all.empty', 'No documents found yet.')}</p>
            <p className="muted">
              {t('documents.all.emptyHelp', 'Generate documents from a project to see them listed here.')}
            </p>
          </div>
        ) : (
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>{t('documents.all.column.title', 'Document')}</th>
                  <th>{t('documents.all.column.project', 'Project')}</th>
                  <th>{t('documents.all.column.status', 'Status')}</th>
                  <th>{t('documents.all.column.created', 'Created')}</th>
                  <th>{t('documents.all.column.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map(doc => {
                  const status = normalizeStatus(doc.status)
                  const statusLabel =
                    status === 'other'
                      ? (doc.status ?? t('documents.all.statusUnknown', 'Unknown'))
                      : t(`documents.all.status.${status}`, STATUS_LABELS[status])
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="documents-title">
                          <strong>{doc.title || doc.kind || t('documents.all.untitled', 'Untitled document')}</strong>
                          {doc.kind ? (
                            <span className="muted documents-kind">{doc.kind}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>{doc.project_name}</td>
                      <td>
                        <span className={`badge status-${status}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td className="documents-actions">
                        <button className="btn ghost small" type="button" onClick={() => handleOpen(doc)}>
                          {t('documents.all.action.open', 'Open')}
                        </button>
                        <button
                          className="btn ghost small"
                          type="button"
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                        >
                          {deletingId === doc.id
                            ? t('documents.all.action.deleting', 'Deleting…')
                            : t('documents.all.action.delete', 'Delete')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
