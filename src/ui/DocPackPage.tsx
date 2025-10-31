import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { exportPDF, exportDOCX, getTemplate } from '@/docs/generator'
import type { DocInstance } from '@/docs/types'
import { useProjects, selectProjectById, selectPackByProjectId } from '@/state/useProjects'
import { t } from '@/i18n'

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

export default function DocPackPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = useProjects(state => (projectId ? selectProjectById(state, projectId) : null))
  const docs = useProjects(state => (projectId ? selectPackByProjectId(state, projectId) ?? [] : []))
  const loadProjects = useProjects(state => state.load)
  const projectsLoading = useProjects(state => state.loading)
  const selectProject = useProjects(state => state.select)
  const navigate = useNavigate()
  const safeProductName = useMemo(
    () =>
      (project?.name ?? t('pack.safeNameFallback', 'Product'))
        .trim()
        .replace(/[\/:*?"<>|]+/g, '_')
        .replace(/\s+/g, '_'),
    [project?.name]
  )

  useEffect(() => {
    if (!projectId) {
      navigate('/', { replace: true })
      return
    }
    selectProject(projectId)
    if (!project && !projectsLoading) {
      loadProjects().catch(error => {
        console.error('Failed to load projects', error)
      })
    }
  }, [loadProjects, navigate, project, projectId, projectsLoading, selectProject])

  if (!projectId) {
    return null
  }

  if (!project) {
    return (
      <div className="page pack-page">
        <div className="card">
          <p>{t('pack.loading', 'Loading compliance pack…')}</p>
        </div>
      </div>
    )
  }

  if (!docs.length) {
    return (
      <div className="page pack-page">
        <div className="card">
          <p>{t('pack.empty', 'No generated documents found. Please run the compliance pack generator from the results page.')}</p>
          <button onClick={() => navigate(`/project/${projectId}/results`)} className="btn">
            {t('pack.backToResults', 'Back to results')}
          </button>
        </div>
      </div>
    )
  }

  const getTemplateFor = (kind: DocInstance['kind']) => getTemplate(kind)

  const handleExportPdf = async (doc: DocInstance) => {
    const template = getTemplateFor(doc.kind)
    const blob = await exportPDF(doc, template)
    triggerDownload(blob, `${safeProductName}__${template.title}.pdf`)
  }

  const handleExportDocx = async (doc: DocInstance) => {
    const template = getTemplateFor(doc.kind)
    if (!template.exportable.includes('docx')) return
    const blob = await exportDOCX(doc, template)
    triggerDownload(blob, `${safeProductName}__${template.title}.docx`)
  }

  return (
    <div className="page pack-page">
      <header>
        <h2>{t('pack.title', 'Your Compliance Pack')}</h2>
        <p className="muted">{t('pack.subtitle', 'These documents were pre-filled using your answers. Review, edit, and export each one.')}</p>
      </header>

      <section className="card">
        <table className="pack-table">
          <thead>
            <tr>
              <th>{t('pack.table.document', 'Document')}</th>
              <th>{t('pack.table.status', 'Status')}</th>
              <th>{t('pack.table.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {docs.map(doc => {
              const template = getTemplateFor(doc.kind)
              const docName = (doc.data?.title as string) || (doc as any).name || template.title
              const statusLabel = t(`doc.status.${doc.status}`, doc.status)
              return (
                <tr key={doc.id}>
                  <td>{docName}</td>
                  <td>{statusLabel}</td>
                  <td className="pack-actions">
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => navigate(`/project/${projectId}/docs/edit/${doc.kind}`)}
                    >
                      {t('pack.actions.open', 'Open')}
                    </button>
                    <button className="btn ghost" type="button" onClick={() => handleExportPdf(doc)}>
                      {t('pack.actions.exportPdf', 'Export PDF')}
                    </button>
                    {template.exportable.includes('docx') ? (
                      <button className="btn ghost" type="button" onClick={() => handleExportDocx(doc)}>
                        {t('pack.actions.exportDocx', 'Export DOCX')}
                      </button>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
