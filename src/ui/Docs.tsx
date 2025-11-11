import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { t, tDoc } from '@/i18n'
import { useProjectData } from '@/stores/useProjectData'
import { useDocuments } from '@/state/useDocuments'
import { generateDocPreview, exportDocPDF } from '@/docs/generator'
import { preselectedLaws } from '@/wizard/logic'
import type { Tag } from '@/wizard/schema'

export default function Docs() {
  const { projectId } = useParams()
  const { load } = useProjectData()
  const { createDraft, saveContent, saveFinalDoC } = useDocuments()

  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [derivedTags, setDerivedTags] = useState<Tag[]>([])
  const [overrides, setOverrides] = useState<string[] | null>(null)
  const [laws, setLaws] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [previewHtmlByLocale, setPreviewHtmlByLocale] = useState<
    Partial<Record<'de' | 'en', string>>
  >({})
  const [previewLocale, setPreviewLocale] = useState<'de' | 'en'>('de')
  const [toast, setToast] = useState<string | null>(null)

  const previewHtml = previewHtmlByLocale[previewLocale] ?? ''

  useEffect(() => {
    let mounted = true
    if (!projectId) return
    setLoading(true)
    load(projectId).then(project => {
      if (!mounted) return
      const nextAnswers = project.answers ?? {}
      const tags = Array.isArray(project.derivedTags)
        ? (project.derivedTags.filter((tag): tag is Tag => typeof tag === 'string') as Tag[])
        : []
      const lawOverrides = Array.isArray(project.lawOverrides) && project.lawOverrides.length
        ? project.lawOverrides.filter((law): law is string => typeof law === 'string')
        : null

      setAnswers(nextAnswers)
      setDerivedTags(tags)
      setOverrides(lawOverrides)

      const recommended = lawOverrides && lawOverrides.length > 0
        ? lawOverrides
        : preselectedLaws(tags)

      setLaws(recommended)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [projectId, load])

  useEffect(() => {
    if (!toast || typeof window === 'undefined') return
    const timeout = window.setTimeout(() => {
      setToast(null)
    }, 3200)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [toast])

  const hasWizardData = useMemo(() => Object.keys(answers ?? {}).length > 0, [answers])
  const canPreview = useMemo(() => (laws?.length ?? 0) > 0 && hasWizardData, [laws, hasWizardData])

  async function onPreview() {
    if (!projectId || !canPreview) return
    const html = await generateDocPreview({
      projectId,
      answers,
      laws,
      locale: previewLocale,
      type: 'doc_eu_declaration'
    })
    setPreviewHtmlByLocale(prev => ({ ...prev, [previewLocale]: html }))
  }

  async function onExportPDF() {
    if (!projectId || !canPreview) return
    await exportDocPDF({
      projectId,
      answers,
      laws,
      locale: 'de',
      type: 'doc_eu_declaration'
    })
  }

  async function onSaveDraft() {
    if (!projectId || !canPreview) return
    const title = `${answers['product.name'] ?? 'Produkt'} – EU-Konformitätserklärung`
    const content =
      previewHtml || (await generateDocPreview({
        projectId,
        answers,
        laws,
        locale: previewLocale,
        type: 'doc_eu_declaration'
      }))
    const draftId = await createDraft({
      projectId,
      kind: 'doc_eu_declaration',
      title
    })
    await saveContent(draftId, content)
    console.debug('Draft saved:', draftId)
  }

  async function onSaveFinal() {
    if (!projectId || !canPreview) return
    const title = `${answers['product.name'] ?? 'Produkt'} – EU-Konformitätserklärung`
    const existing = previewHtmlByLocale.de
    const html =
      existing && existing.length > 0
        ? existing
        : await generateDocPreview({
            projectId,
            answers,
            laws,
            locale: 'de',
            type: 'doc_eu_declaration'
          })
    if (!existing) {
      setPreviewHtmlByLocale(prev => ({ ...prev, de: html }))
    }
    const id = await saveFinalDoC(projectId, html, title)
    console.debug('Final DoC saved:', id)
    setToast('✅ DoC gespeichert')
  }

  if (loading) return <div className="docs-page">{t('loading', 'Lade…')}</div>

  return (
    <div className="docs-page">
      <h1>{tDoc('docs.page.title', 'Dokumente')}</h1>

      <section>
        <h2>{t('docs.recommendedLaws', 'Empfohlene Rechtsrahmen')}</h2>
        {laws.length === 0 ? (
          <div className="empty">
            <p>{t('docs.empty.noRecommendations', 'Keine Empfehlungen verfügbar.')}</p>
            <p>{t('docs.empty.completeWizard', 'Bitte schließen Sie zunächst den Fragebogen ab.')}</p>
            {hasWizardData && (
              <p>{t('docs.empty.checkAnswers', 'Bitte prüfen Sie Ihre Antworten oder wählen Sie Rechtsrahmen manuell.')}</p>
            )}
          </div>
        ) : (
          <ul>
            {laws.map(law => (
              <li key={law}>{law}</li>
            ))}
          </ul>
        )}
        {overrides && overrides.length > 0 ? (
          <p className="muted">{t('docs.recommendations.overrides', 'Eigene Auswahl aktiv – Vorschläge aus dem Fragebogen werden überschrieben.')}</p>
        ) : derivedTags.length > 0 ? (
          <p className="muted">{t('docs.recommendations.source', 'Basierend auf den abgeleiteten Produkttags aus dem Fragebogen.')}</p>
        ) : null}
      </section>

      <section>
        <h2>{t('docs.preview.euDoc', 'EU-Konformitätserklärung (Vorschau/Export)')}</h2>
        <div className="actions" style={{ gap: 8, marginBottom: 8 }}>
          <span className="muted" style={{ alignSelf: 'center' }}>
            {t('docs.preview.language', 'Vorschau-Sprache:')}
          </span>
          <button
            type="button"
            className={`btn ghost small${previewLocale === 'de' ? ' active' : ''}`}
            onClick={() => setPreviewLocale('de')}
          >
            DE
          </button>
          <button
            type="button"
            className={`btn ghost small${previewLocale === 'en' ? ' active' : ''}`}
            onClick={() => setPreviewLocale('en')}
          >
            EN
          </button>
        </div>
        <div className="actions">
          <button disabled={!canPreview} onClick={onPreview}>
            {previewLocale === 'de'
              ? t('docs.preview.button', 'Vorschau (DE)')
              : t('docs.preview.buttonEn', 'Vorschau (EN)')}
          </button>
          <button disabled={!canPreview} onClick={onExportPDF}>
            {t('docs.preview.pdf', 'PDF exportieren (DE)')}
          </button>
          <button disabled={!canPreview} onClick={onSaveDraft}>
            {t('docs.preview.save', 'Entwurf speichern')}
          </button>
          <button disabled={!canPreview} onClick={onSaveFinal}>
            Als finales Dokument speichern
          </button>
        </div>

        <div
          className="preview-frame"
          style={{ border: '1px solid #ddd', minHeight: 240, marginTop: 16, padding: 12, background: '#fff' }}
        >
          {previewHtml ? (
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <em>{t('docs.preview.empty', 'Keine Vorschau geladen.')}</em>
          )}
        </div>
      </section>

      {toast ? (
        <div
          role="status"
          className="card"
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            maxWidth: 320,
            background: '#ecfdf5',
            color: '#065f46',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
            border: '1px solid rgba(15, 23, 42, 0.08)'
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
