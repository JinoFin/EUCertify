import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Question } from '@/wizard/schema'
import { deriveTagsFromAnswers, visibleQuestions, visibleSections } from '@/wizard/logic'
import { useProjectData } from '@/stores/useProjectData'
import { useTranslation } from '@/i18n'

const COUNTRY_OPTIONS = [
  { value: 'AT', label: 'Austria (AT)' },
  { value: 'BE', label: 'Belgium (BE)' },
  { value: 'BG', label: 'Bulgaria (BG)' },
  { value: 'HR', label: 'Croatia (HR)' },
  { value: 'CY', label: 'Cyprus (CY)' },
  { value: 'CZ', label: 'Czechia (CZ)' },
  { value: 'DK', label: 'Denmark (DK)' },
  { value: 'EE', label: 'Estonia (EE)' },
  { value: 'FI', label: 'Finland (FI)' },
  { value: 'FR', label: 'France (FR)' },
  { value: 'DE', label: 'Germany (DE)' },
  { value: 'GR', label: 'Greece (GR)' },
  { value: 'HU', label: 'Hungary (HU)' },
  { value: 'IE', label: 'Ireland (IE)' },
  { value: 'IT', label: 'Italy (IT)' },
  { value: 'LV', label: 'Latvia (LV)' },
  { value: 'LT', label: 'Lithuania (LT)' },
  { value: 'LU', label: 'Luxembourg (LU)' },
  { value: 'MT', label: 'Malta (MT)' },
  { value: 'NL', label: 'Netherlands (NL)' },
  { value: 'PL', label: 'Poland (PL)' },
  { value: 'PT', label: 'Portugal (PT)' },
  { value: 'RO', label: 'Romania (RO)' },
  { value: 'SK', label: 'Slovakia (SK)' },
  { value: 'SI', label: 'Slovenia (SI)' },
  { value: 'ES', label: 'Spain (ES)' },
  { value: 'SE', label: 'Sweden (SE)' },
  { value: 'IS', label: 'Iceland (IS)' },
  { value: 'LI', label: 'Liechtenstein (LI)' },
  { value: 'NO', label: 'Norway (NO)' },
  { value: 'UK', label: 'United Kingdom (UK)' }
]

type Answers = Record<string, unknown>

const hasValue = (question: Question, value: unknown): boolean => {
  switch (question.type) {
    case 'boolean':
      return typeof value === 'boolean'
    case 'confirm':
      return value === true
    case 'text':
    case 'textarea':
      return typeof value === 'string' && value.trim().length > 0
    case 'single-select':
      return typeof value === 'string' && value.length > 0
    case 'multi-select':
    case 'country-multi':
      return Array.isArray(value) && value.length > 0
    default:
      return value !== undefined && value !== null
  }
}

export default function Wizard() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { load, saveAnswers, saveDerivedTags } = useProjectData()

  const [answers, setAnswers] = useState<Answers>({})
  const [initialised, setInitialised] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    setInitialised(false)
    load(projectId)
      .then(data => {
        if (cancelled) return
        setAnswers(data.answers ?? {})
        setInitialised(true)
      })
      .catch(error => {
        console.error('Failed to load project data', error)
        if (!cancelled) {
          setAnswers({})
          setInitialised(true)
        }
      })
    return () => {
      cancelled = true
      setInitialised(false)
    }
  }, [load, projectId])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const sections = useMemo(() => visibleSections(answers), [answers])

  const missingRequired = useMemo(() => {
    let missing = 0
    sections.forEach(section => {
      visibleQuestions(section, answers).forEach(question => {
        if (question.required && !hasValue(question, answers[question.id])) {
          missing += 1
        }
      })
    })
    return missing
  }, [answers, sections])

  const handleAnswerChange = (id: string, value: unknown) => {
    if (!projectId) return
    setAnswers(prev => {
      const next = { ...prev, [id]: value }
      void saveAnswers(projectId, next)
      return next
    })
    setSaving(true)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      setSaving(false)
    }, 600)
  }

  const confirmComplete = answers['confirmComplete'] === true
  const canFinish = missingRequired === 0 && confirmComplete

  const handleFinish = async () => {
    if (!projectId) return
    const tags = deriveTagsFromAnswers(answers)
    await saveDerivedTags(projectId, tags)
    if (!tags.length) {
      setToast(t('wizard.finish.noTags', 'Bitte prüfen Sie Ihre Antworten – es wurden keine anwendbaren Rechtsrahmen erkannt.'))
    }
    navigate(`/project/${projectId}/docs`)
  }

  if (!projectId) {
    return <div className="page wizard-page">{t('wizard.loadingProject', 'Projekt-ID fehlt.')}</div>
  }

  if (!initialised) {
    return <div className="page wizard-page">{t('wizard.loading', 'Fragebogen wird geladen …')}</div>
  }

  return (
    <div className="page wizard-page">
      <header className="wizard-header">
        <div>
          <h1>{t('wizard.header.title', 'EUCertify Fragebogen')}</h1>
          <p className="muted">
            {t(
              'wizard.header.subtitle',
              'Beantworten Sie die Fragen, um passende EU-Rechtsrahmen und Dokumente zu ermitteln.'
            )}
          </p>
        </div>
        <div className="wizard-status">
          <span className="muted">
            {saving
              ? t('wizard.saving', 'Speichern …')
              : t('wizard.saved', 'Aktuell gespeichert')}
          </span>
        </div>
      </header>

      {sections.map(section => {
        const questions = visibleQuestions(section, answers)
        if (!questions.length) return null
        return (
          <section key={section.id} className="card wizard-section">
            <h2>{t(section.titleKey, section.titleKey)}</h2>
            <div className="wizard-questions">
              {questions.map(question => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={value => handleAnswerChange(question.id, value)}
                  t={t}
                />
              ))}
            </div>
          </section>
        )
      })}

      <footer className="wizard-actions">
        <button
          type="button"
          className="btn"
          data-testid="wizard-finish"
          disabled={!canFinish}
          onClick={handleFinish}
        >
          {t('wizard.finish.submit', 'Weiter zu den Dokumenten')}
        </button>
        {missingRequired > 0 ? (
          <p className="muted" role="status">
            {t('wizard.finish.missingRequired', 'Bitte füllen Sie alle Pflichtfragen aus.')}
          </p>
        ) : null}
      </footer>

      {toast ? (
        <div className="toast" role="alert">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

type RendererProps = {
  question: Question
  value: unknown
  onChange: (value: unknown) => void
  t: (key: string, fallback?: string) => string
}

function QuestionRenderer({ question, value, onChange, t }: RendererProps) {
  const help = question.helpKey ? t(question.helpKey, question.helpKey) : null

  if (question.type === 'text') {
    return (
      <div className="wizard-question">
        <label className="wizard-label" htmlFor={question.id}>
          {t(question.titleKey, question.titleKey)}
        </label>
        <input
          id={question.id}
          type="text"
          value={typeof value === 'string' ? value : ''}
          placeholder={question.placeholderKey ? t(question.placeholderKey, '') : ''}
          onChange={event => onChange(event.target.value)}
        />
        {help ? <p className="muted">{help}</p> : null}
      </div>
    )
  }

  if (question.type === 'textarea') {
    return (
      <div className="wizard-question">
        <label className="wizard-label" htmlFor={question.id}>
          {t(question.titleKey, question.titleKey)}
        </label>
        <textarea
          id={question.id}
          value={typeof value === 'string' ? value : ''}
          onChange={event => onChange(event.target.value)}
        />
        {help ? <p className="muted">{help}</p> : null}
      </div>
    )
  }

  if (question.type === 'boolean') {
    const boolValue = typeof value === 'boolean' ? value : null
    return (
      <div className="wizard-question">
        <span className="wizard-label">{t(question.titleKey, question.titleKey)}</span>
        <div className="wizard-options">
          <label>
            <input
              type="radio"
              name={question.id}
              checked={boolValue === true}
              onChange={() => onChange(true)}
            />
            {t('common.yes', 'Ja')}
          </label>
          <label>
            <input
              type="radio"
              name={question.id}
              checked={boolValue === false}
              onChange={() => onChange(false)}
            />
            {t('common.no', 'Nein')}
          </label>
        </div>
        {help ? <p className="muted">{help}</p> : null}
      </div>
    )
  }

  if (question.type === 'single-select') {
    const options = question.options ?? []
    const current = typeof value === 'string' ? value : ''
    return (
      <div className="wizard-question">
        <label className="wizard-label" htmlFor={question.id}>
          {t(question.titleKey, question.titleKey)}
        </label>
        <select id={question.id} value={current} onChange={event => onChange(event.target.value)}>
          <option value="">
            {t('wizard.select.placeholder', 'Bitte auswählen')}
          </option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey, option.labelKey)}
            </option>
          ))}
        </select>
        {help ? <p className="muted">{help}</p> : null}
      </div>
    )
  }

  if (question.type === 'multi-select') {
    const values = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className="wizard-question">
        <span className="wizard-label">{t(question.titleKey, question.titleKey)}</span>
        <div className="wizard-options vertical">
          {(question.options ?? []).map(option => {
            const checked = values.includes(option.value)
            return (
              <label key={option.value}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={event => {
                    const next = new Set(values)
                    if (event.target.checked) {
                      next.add(option.value)
                    } else {
                      next.delete(option.value)
                    }
                    const result = Array.from(next)
                    if (question.normalize && /'none'/.test(question.normalize) && result.includes('none')) {
                      onChange([])
                    } else {
                      onChange(result)
                    }
                  }}
                />
                {t(option.labelKey, option.labelKey)}
              </label>
            )
          })}
        </div>
        {help ? <p className="muted">{help}</p> : null}
      </div>
    )
  }

  if (question.type === 'country-multi') {
    const selected = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className="wizard-question">
        <label className="wizard-label" htmlFor={question.id}>
          {t(question.titleKey, question.titleKey)}
        </label>
        <select
          id={question.id}
          multiple
          value={selected}
          onChange={event => {
            const options = Array.from(event.target.selectedOptions).map(option => option.value)
            onChange(options)
          }}
        >
          {COUNTRY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {help ? <p className="muted">{help}</p> : null}
      </div>
    )
  }

  if (question.type === 'confirm') {
    const checked = value === true
    return (
      <div className="wizard-question">
        <label className="wizard-label">
          <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
          {t(question.titleKey, question.titleKey)}
        </label>
        {help ? <p className="muted">{help}</p> : null}
      </div>
    )
  }

  return null
}
