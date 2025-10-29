import { useEffect, useState } from 'react'
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

export default function DocPackPage() {
  type StoredDoc = DocInstance & { name?: string }
  const [docs, setDocs] = useState<StoredDoc[]>([])
  const navigate = useNavigate()
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.length) setDocs(parsed as StoredDoc[])
      } catch (error) {
        console.warn('Failed to parse stored pack', error)
      }
    }
  }, [])

  if (!docs.length) {
    return (
      <div className="page pack-page">
        <div className="card">
          <p>No generated documents found. Please run the compliance pack generator from the results page.</p>
          <button onClick={() => navigate('/results')} className="btn">
            Back to results
          </button>
        </div>
      </div>
    )
  }

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
            {docs.map(doc => {
              const template = getTemplateFor(doc.kind)
              const docName = doc.name ?? template.title
              return (
                <tr key={doc.id}>
                  <td>{docName}</td>
                  <td>{doc.status}</td>
                  <td className="pack-actions">
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => navigate(`/docs/edit/${doc.kind}`)}
                    >
                      Open
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
    </div>
  )
}
