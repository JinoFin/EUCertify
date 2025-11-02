import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation, tDoc } from '@/i18n'
import { useProjectData } from '@/stores/useProjectData'
import { preselectedLaws } from '@/wizard/logic'
import type { Tag } from '@/wizard/schema'

export default function Docs() {
  const { projectId } = useParams<{ projectId: string }>()
  const { t } = useTranslation()
  const { load, setLawOverrides } = useProjectData()
  const [derivedTags, setDerivedTags] = useState<Tag[]>([])
  const [selectedLaws, setSelectedLaws] = useState<string[]>([])
  const [overridesActive, setOverridesActive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    setLoading(true)
    load(projectId)
      .then(data => {
        if (cancelled) return
        const tags = Array.isArray(data.derivedTags)
          ? (data.derivedTags.filter((tag): tag is Tag => typeof tag === 'string') as Tag[])
          : []
        const overrides = Array.isArray(data.lawOverrides)
          ? data.lawOverrides.filter((entry): entry is string => typeof entry === 'string')
          : []
        const recommended = preselectedLaws(tags)
        setDerivedTags(tags)
        if (overrides.length) {
          setSelectedLaws(overrides)
          setOverridesActive(true)
        } else {
          setSelectedLaws(recommended)
          setOverridesActive(false)
        }
      })
      .catch(error => {
        console.error('Failed to load project data', error)
        if (!cancelled) {
          setDerivedTags([])
          setSelectedLaws([])
          setOverridesActive(false)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load, projectId])

  const recommended = useMemo(() => preselectedLaws(derivedTags), [derivedTags])

  const available = useMemo(() => {
    const catalog = new Set<string>()
    recommended.forEach(law => catalog.add(law))
    selectedLaws.forEach(law => catalog.add(law))
    return Array.from(catalog).sort((a, b) => a.localeCompare(b))
  }, [recommended, selectedLaws])

  const handleToggle = (law: string) => {
    if (!projectId) return
    setSelectedLaws(prev => {
      const set = new Set(prev)
      if (set.has(law)) {
        set.delete(law)
      } else {
        set.add(law)
      }
      const next = Array.from(set)
      setOverridesActive(true)
      void setLawOverrides(projectId, next)
      return next
    })
  }

  const handleReset = () => {
    if (!projectId) return
    setSelectedLaws(recommended)
    setOverridesActive(false)
    void setLawOverrides(projectId, recommended)
  }

  if (!projectId) {
    return <div className="page docs-page">{t('docs.missingProject', 'Projekt-ID fehlt.')}</div>
  }

  if (loading) {
    return <div className="page docs-page">{t('docs.loading', 'Dokumente werden geladen …')}</div>
  }

  return (
    <div className="page docs-page">
      <header className="docs-header">
        <h1>{t('docs.page.title', 'Dokumente & Vorlagen')}</h1>
        <p className="muted">
          {t('docs.laws.note', 'Vorschau und Exporte erfolgen ausschließlich auf Deutsch (DoC, Checkliste, Mandat).')}
        </p>
      </header>

      <section className="card">
        <h2>{t('docs.tags.title', 'Abgeleitete Produkttags')}</h2>
        {derivedTags.length ? (
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              listStyle: 'none',
              margin: 0,
              padding: 0
            }}
          >
            {derivedTags.map(tag => (
              <li
                key={tag}
                style={{
                  padding: '4px 8px',
                  borderRadius: '999px',
                  background: 'rgba(15,23,42,0.08)',
                  fontSize: '0.85rem'
                }}
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t('docs.tags.empty', 'Noch keine Tags erkannt.')}</p>
        )}
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{t('docs.laws.title', 'Vorausgewählte Rechtsrahmen')}</h2>
          <button type="button" className="btn ghost" onClick={handleReset}>
            {t('docs.laws.reset', 'Empfehlungen übernehmen')}
          </button>
        </div>
        {available.length === 0 ? (
          <p className="muted">{t('docs.laws.empty', 'Noch keine Rechtsrahmen ausgewählt.')}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {available.map(law => {
              const checked = selectedLaws.includes(law)
              return (
                <li key={law}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={checked} onChange={() => handleToggle(law)} />
                    <span>{law}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
        <p className="muted" style={{ marginTop: 8 }}>
          {overridesActive
            ? t('docs.laws.overridden', 'Eigene Auswahl gespeichert – wird in DoC & Checklisten verwendet.')
            : t('docs.laws.usingRecommended', 'Aktuell werden die empfohlenen Rechtsrahmen verwendet.')}
        </p>
      </section>

      <section className="card">
        <h2>{t('docs.preview.title', 'Dokumentenvorschau')}</h2>
        <p className="muted">
          {tDoc('docs.preview.description', 'Die Dokumentvorlagen bleiben deutschsprachig. Anpassungen folgen Ihrer Rechtsrahmen-Auswahl.')}
        </p>
      </section>
    </div>
  )
}
