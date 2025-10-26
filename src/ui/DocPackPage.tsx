import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportPDF, exportDOCX, getTemplate } from '@/docs/generator'
import type { DocInstance } from '@/docs/types'

const STORAGE_KEY = 'eucertify:lastPack'

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

const parseStoredPack = (): DocInstance[] => {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed as DocInstance[]
    }
  } catch (error) {
    console.warn('Failed to parse stored pack', error)
  }
  return []
}

export default function DocPackPage() {
  const [pack] = useState<DocInstance[]>(() => parseStoredPack())
  const navigate = useNavigate()

  const hasDocs = pack.length > 0

  const getTemplateFor = (kind: DocInstance['kind']) => getTemplate(kind)

  const handleExportPdf = async (doc: DocInstance) => {
    const template = getTemplateFor(doc.kind)
    const blob = await exportPDF(doc, template)
    triggerDownload(blob, `${template.title}.pdf`)
  }

  const handleExportDocx = async (doc: DocInstance) => {
    const template = getTemplateFor(doc.kind)
    if (!template.exportable.includes('docx')) return
    const blob = await exportDOCX(doc, template)
    triggerDownload(blob, `${template.title}.docx`)
  }

  return (
    <div className="page pack-page">
      <header>
        <h2>Your Compliance Pack</h2>
        <p className="muted">
          These documents were pre-filled using your answers. Review, edit, and export each one.
        </p>
      </header>

      {!hasDocs ? (
        <div className="card">
          <p>No generated documents found. Run the compliance pack generator from the results page.</p>
          <button className="btn" type="button" onClick={() => navigate('/results')}>
            Back to results
          </button>
        </div>
      ) : (
        <section className="card">
          <table className="pack-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pack.map(doc => {
                const template = getTemplateFor(doc.kind)
                return (
                  <tr key={doc.id}>
                    <td>{template.title}</td>
                    <td>{doc.status}</td>
                    <td className="pack-actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => navigate(`/docs/edit/${doc.kind}`)}
                      >
                        Edit
                      </button>
                      <button className="btn ghost" type="button" onClick={() => handleExportPdf(doc)}>
                        Export PDF
                      </button>
                      {template.exportable.includes('docx') ? (
                        <button className="btn ghost" type="button" onClick={() => handleExportDocx(doc)}>
                          Export DOCX
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
