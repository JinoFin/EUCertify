import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { exportPDF, exportDOCX, getTemplate } from '@/docs/generator'
import type { DocInstance } from '@/docs/types'
import { useSessionStore, selectProductById } from '@/state/useSession'
import { t } from '@/i18n'
import { docFilename } from '@/docs/filename'
import { useProjects } from '@/state/useProjects'

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
  const { projectId, productId } = useParams<{ projectId: string; productId: string }>()
  const product = useSessionStore(state =>
    projectId && productId ? selectProductById(state, projectId, productId) : null
  )
  const navigate = useNavigate()
  const [docs, setDocs] = useState<DocInstance[]>([])

  useEffect(() => {
    if (!projectId || !productId || !product) {
      navigate('/', { replace: true })
      return
    }
    setDocs([...(product.lastPack ?? [])])
  }, [navigate, product, productId, projectId])

  if (!projectId || !productId || !product) {
    return null
  }

  if (!docs.length) {
    return (
      <div className="page pack-page">
        <div className="card">
          <p>{t('pack.empty', 'No generated documents found. Please run the compliance pack generator from the results page.')}</p>
          <button onClick={() => navigate(`/projects/${projectId}/products/${productId}/results`)} className="btn">
            {t('pack.backToResults', 'Back to results')}
          </button>
        </div>
      </div>
    )
  }

  const getTemplateFor = (kind: DocInstance['kind']) => getTemplate(kind)

  const resolveDocTitle = (doc: DocInstance) => {
    const template = getTemplateFor(doc.kind)
    return { template, title: (doc.data?.title as string) || (doc as any).name || template.title }
  }

  const handleExportPdf = async (doc: DocInstance) => {
    const { template, title } = resolveDocTitle(doc)
    const blob = await exportPDF(doc, template)
    const projectName = useProjects.current()?.name ?? product.name ?? t('pack.safeNameFallback', 'Product')
    triggerDownload(blob, docFilename(projectName, title, 'pdf'))
  }

  const handleExportDocx = async (doc: DocInstance) => {
    const { template, title } = resolveDocTitle(doc)
    if (!template.exportable.includes('docx')) return
    const blob = await exportDOCX(doc, template)
    const projectName = useProjects.current()?.name ?? product.name ?? t('pack.safeNameFallback', 'Product')
    triggerDownload(blob, docFilename(projectName, title, 'docx'))
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
              const { template, title: docName } = resolveDocTitle(doc)
              const statusLabel = t(`doc.status.${doc.status}`, doc.status)
              return (
                <tr key={doc.id}>
                  <td>{docName}</td>
                  <td>{statusLabel}</td>
                  <td className="pack-actions">
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() =>
                        navigate(`/projects/${projectId}/products/${productId}/docs/edit/${doc.kind}`)
                      }
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
