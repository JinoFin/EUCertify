import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportPDF, exportDOCX, getTemplate } from '@/docs/generator'
import type { DocInstance } from '@/docs/types'
import LanguageSelector from '@/components/LanguageSelector'
import { useLang } from '@/context/LanguageContext'

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
  const { t } = useLang()
  const [pack] = useState<DocInstance[]>(() => parseStoredPack())
  const navigate = useNavigate()

  const hasDocs = pack.length > 0

  const getTemplateFor = (kind: DocInstance['kind']) => getTemplate(kind)

  const docStatusLabel = (status: DocInstance['status']) => t(`docs.instanceStatus.${status}`)

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
      <div className="page-header">
        <LanguageSelector />
      </div>
      <header>
        <h2>{t('docPack.title')}</h2>
        <p className="muted">{t('docPack.subtitle')}</p>
      </header>

      {!hasDocs ? (
        <div className="card">
          <p>{t('docPack.empty')}</p>
          <button className="btn" type="button" onClick={() => navigate('/results')}>
            {t('docPack.backToResults')}
          </button>
        </div>
      ) : (
        <section className="card">
          <table className="pack-table">
            <thead>
              <tr>
                <th>{t('docPack.table.document')}</th>
                <th>{t('docPack.table.status')}</th>
                <th>{t('docPack.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pack.map(doc => {
                const template = getTemplateFor(doc.kind)
                return (
                  <tr key={doc.id}>
                    <td>{template.title}</td>
                    <td>{docStatusLabel(doc.status)}</td>
                    <td className="pack-actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => navigate(`/docs/edit/${doc.kind}`)}
                      >
                        {t('docPack.actions.edit')}
                      </button>
                      <button className="btn ghost" type="button" onClick={() => handleExportPdf(doc)}>
                        {t('docPack.actions.exportPdf')}
                      </button>
                      {template.exportable.includes('docx') ? (
                        <button className="btn ghost" type="button" onClick={() => handleExportDocx(doc)}>
                          {t('docPack.actions.exportDocx')}
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
