import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { t } from '@/i18n'
import { recommendFromTags } from '@/domain/intelligence'
import { useProjectData } from '@/state/useProjectData'
import { useDocuments } from '@/state/useDocuments'
import { generateDocPreview, exportDocPDF } from '@/docs/generator'

export default function Docs() {
  const { projectId } = useParams<{ projectId: string }>()
  const { load } = useProjectData()
  const addOrUpdate = useDocuments(state => state.addOrUpdate)
  const docSectionRef = useRef<HTMLDivElement | null>(null)

  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [derivedTags, setDerivedTags] = useState<string[]>([])
  const [laws, setLaws] = useState<string[]>([])
  const [standards, setStandards] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [previewHtml, setPreviewHtml] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    load(projectId)
      .then(data => {
        const nextAnswers = data.answers ?? {}
        const tags = data.derivedTags ?? []
        const recommended = recommendFromTags(tags)
        const lawSelection = data.lawOverrides && data.lawOverrides.length ? data.lawOverrides : recommended.legislationIds
        const standardSelection =
          data.standardOverrides && data.standardOverrides.length ? data.standardOverrides : recommended.standardCodes

        setAnswers(nextAnswers)
        setDerivedTags(tags)
        setLaws(lawSelection)
        setStandards(standardSelection)
      })
      .catch(error => {
        console.error('Failed to load project data', error)
      })
      .finally(() => setLoading(false))
  }, [projectId, load])

  useEffect(() => {
    if (!toast || typeof window === 'undefined') return
    const timeout = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const enrichedAnswers = useMemo(() => ({ ...answers, __derivedTags: derivedTags }), [answers, derivedTags])

  const canPreview = laws.length > 0 && derivedTags.length > 0

  const handlePreview = async () => {
    if (!projectId || !canPreview) return
    const html = await generateDocPreview({ projectId, answers: enrichedAnswers, laws, locale: 'de', type: 'doc_eu_declaration' })
    setPreviewHtml(html)
  }

  const handleExport = async () => {
    if (!projectId || !canPreview) return
    await exportDocPDF({ projectId, answers: enrichedAnswers, laws, locale: 'de', type: 'doc_eu_declaration' })
    setToast(t('docs.preview.exported', 'PDF wird im neuen Tab geöffnet.'))
  }

  const handleSaveFinal = async () => {
    if (!projectId || !canPreview) return
    const html = previewHtml || (await generateDocPreview({ projectId, answers: enrichedAnswers, laws, locale: 'de', type: 'doc_eu_declaration' }))
    setPreviewHtml(html)
    const title = `${answers['product.name'] ?? 'Produkt'} – EU-Konformitätserklärung`
    try {
      await addOrUpdate({
        project_id: projectId,
        kind: 'EU_DoC',
        title,
        status: 'final',
        payload: { html, laws, standards, answers: enrichedAnswers }
      })
      setToast(t('docs.preview.saved', 'Finales Dokument gespeichert.'))
    } catch (error) {
      console.error('Failed to save document', error)
      window.alert(t('docs.preview.saveError', 'Speichern nicht möglich.'))
    }
  }

  const handleScrollToDoc = () => {
    docSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePlaceholder = () => {
    setToast(t('docs.placeholder', 'Diese Funktion ist in Vorbereitung.'))
  }

  if (!projectId) {
    return <div className="docs-page">{t('docs.noProject', 'Kein Projekt ausgewählt.')}</div>
  }

  if (loading) {
    return <div className="docs-page">{t('docs.loading', 'Lade Dokumente …')}</div>
  }

  return (
    <div className="docs-page">
      <section className="card">
        <h1>{t('docs.summary.title', 'Dokumentenübersicht')}</h1>
        <p className="muted">{t('docs.summary.subtitle', 'Empfohlene Rechtsrahmen und Normen auf Basis Ihrer Antworten.')}</p>
        <div className="summary-grid">
          <div>
            <h3>{t('docs.summary.laws', 'Legislation')}</h3>
            {laws.length ? (
              <ul>
                {laws.map(law => (
                  <li key={law}>{law}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">{t('docs.summary.noLaws', 'Keine Empfehlungen verfügbar.')}</p>
            )}
          </div>
          <div>
            <h3>{t('docs.summary.standards', 'Standards')}</h3>
            {standards.length ? (
              <ul>
                {standards.map(code => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">{t('docs.summary.noStandards', 'Noch keine Standards ausgewählt.')}</p>
            )}
          </div>
        </div>
        <div className="actions" style={{ gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={handleScrollToDoc}>
            {t('docs.summary.openDoc', 'EU-Konformitätserklärung öffnen')}
          </button>
          <button type="button" className="btn ghost" onClick={handlePlaceholder}>
            {t('docs.summary.checklist', 'Checklistenvorlage')}
          </button>
          <button type="button" className="btn ghost" onClick={handlePlaceholder}>
            {t('docs.summary.mandate', 'Mandatsvereinbarung')}
          </button>
        </div>
      </section>

      <section className="card" ref={docSectionRef}>
        <h2>{t('docs.preview.euDoc', 'EU-Konformitätserklärung')}</h2>
        <p className="muted">{t('docs.preview.description', 'Vorschau, Export und Speicherung des EU-DoC. Inhalt bleibt auf Deutsch.')}</p>
        <div className="actions" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={handlePreview} disabled={!canPreview}>
            {t('docs.preview.button', 'Vorschau aktualisieren')}
          </button>
          <button type="button" onClick={handleExport} disabled={!canPreview}>
            {t('docs.preview.pdf', 'PDF exportieren')}
          </button>
          <button type="button" onClick={handleSaveFinal} disabled={!canPreview}>
            {t('docs.preview.saveFinal', 'Als finales Dokument speichern')}
          </button>
        </div>
        <div className="preview-frame" style={{ border: '1px solid #ddd', minHeight: 280, marginTop: 16, padding: 12, background: '#fff' }}>
          {previewHtml ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <em>{t('docs.preview.empty', 'Keine Vorschau geladen.')}</em>}
        </div>
      </section>

      {toast ? (
        <div
          role="status"
          className="card"
          style={{ position: 'fixed', right: 24, bottom: 24, maxWidth: 320, background: '#ecfdf5', color: '#065f46' }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
