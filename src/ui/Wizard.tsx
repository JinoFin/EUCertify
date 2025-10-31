import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { t } from '@/i18n'
import { useWizard } from '@/state/useWizard'
import { useProjects } from '@/state/useProjects'
import type { WizardOption } from '@/data/questionsFlow'

const hasSelection = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'string' && value.length > 0
}

export default function Wizard() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const project = useProjects(state => (projectId ? state.projects.find(item => item.id === projectId) ?? null : null))
  const loadProjects = useProjects(state => state.load)
  const selectProject = useProjects(state => state.select)
  const projectsLoading = useProjects(state => state.loading)
  const loadAnswers = useProjects(state => state.loadAnswers)
  const saveAnswers = useProjects(state => state.saveAnswers)
  const hydrate = useWizard(state => state.hydrate)
  const currentQuestion = useWizard(state => state.currentQuestion)
  const answers = useWizard(state => state.answers)
  const progress = useWizard(state => state.progress)
  const completed = useWizard(state => state.completed)
  const answerSingle = useWizard(state => state.answerSingle)
  const toggleMulti = useWizard(state => state.toggleMulti)
  const next = useWizard(state => state.next)
  const back = useWizard(state => state.back)
  const restart = useWizard(state => state.restart)
  const loadExample = useWizard(state => state.loadExample)
  const [initializing, setInitializing] = useState(true)
  const [projectsReady, setProjectsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setProjectsReady(false)
    loadProjects()
      .catch(error => {
        console.error('Failed to load projects', error)
      })
      .finally(() => {
        if (cancelled) return
        setProjectsReady(true)
        if (projectId) {
          selectProject(projectId)
        }
      })
    return () => {
      cancelled = true
    }
  }, [loadProjects, projectId, selectProject])

  useEffect(() => {
    if (!projectId) {
      navigate('/', { replace: true })
      return
    }
    let active = true
    ;(async () => {
      try {
        const data = await loadAnswers(projectId)
        if (!active) return
        hydrate(data ?? {})
      } catch (error) {
        console.error('Failed to load answers', error)
        if (!active) return
        hydrate({})
      } finally {
        if (active) {
          setInitializing(false)
        }
      }
    })()
    return () => {
      active = false
      setInitializing(true)
    }
  }, [hydrate, loadAnswers, navigate, projectId])

  useEffect(() => {
    if (!projectId || initializing) return
    const handle = window.setTimeout(() => {
      saveAnswers(projectId, answers).catch(error => {
        console.error('Failed to persist answers', error)
      })
    }, 500)
    return () => window.clearTimeout(handle)
  }, [answers, initializing, projectId, saveAnswers])

  const selection = currentQuestion ? answers[currentQuestion.id] : undefined
  const canAdvance = currentQuestion ? hasSelection(selection) : false

  const headerTitle = useMemo(() => {
    if (!project) return t('wizard.loading', 'Loading adaptive questionnaire…')
    return t('wizard.header', 'Compliance wizard for {product}').replace('{product}', project.name)
  }, [project])

  const handleSingleSelect = (option: WizardOption) => {
    if (!currentQuestion) return
    answerSingle(currentQuestion, option)
  }

  const handleMultiToggle = (event: ChangeEvent<HTMLInputElement>, option: WizardOption) => {
    if (!currentQuestion) return
    toggleMulti(currentQuestion, option.value, event.target.checked)
  }

  if (!projectId) {
    return <div style={{ padding: 16 }}>{t('wizard.loadingProject', 'Loading project…')}</div>
  }

  if (!project) {
    if (projectsLoading || !projectsReady) {
      return <div style={{ padding: 16 }}>{t('wizard.loadingProject', 'Loading project…')}</div>
    }
    return (
      <div className="page wizard-page" style={{ padding: 16 }}>
        <p className="muted">{t('wizard.missingProject', 'We could not find that project.')}</p>
        <button className="btn" type="button" onClick={() => navigate('/')}> 
          {t('wizard.backToDashboard', 'Back to dashboard')}
        </button>
      </div>
    )
  }

  return (
    <div className="page wizard-page">
      <header className="wizard-header">
        <div>
          <h1>{headerTitle}</h1>
          <p className="muted">
            {t('wizard.subtitle', 'Answer to adapt EU legislation, EN standards, and documentation for your product.')}
          </p>
        </div>
        <div className="wizard-progress">
          <div className="progress-bar">
            <div className="progress-value" style={{ width: `${progress.percent}%` }}></div>
          </div>
          <span className="muted">
            {t('wizard.progress', 'Step {current} of {total}')
              .replace('{current}', String(progress.current))
              .replace('{total}', String(progress.total))}
          </span>
        </div>
      </header>

      {currentQuestion && !completed ? (
        <section className="card wizard-question">
          <h2>{currentQuestion.prompt}</h2>
          <div className="wizard-options">
            {currentQuestion.options?.map(option => {
              if (currentQuestion.type === 'singleChoice') {
                const checked = selection === option.value
                return (
                  <label key={option.value} className={`option-card${checked ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option.value}
                      checked={checked}
                      onChange={() => handleSingleSelect(option)}
                    />
                    <span className="option-label">{option.label ?? option.value}</span>
                    {option.examples?.length ? (
                      <ul className="examples">
                        {option.examples.map(example => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    ) : null}
                  </label>
                )
              }

              const values = Array.isArray(selection) ? selection : []
              const checked = values.includes(option.value)
              return (
                <label key={option.value} className={`option-card${checked ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    name={`${currentQuestion.id}_${option.value}`}
                    value={option.value}
                    checked={checked}
                    onChange={event => handleMultiToggle(event, option)}
                  />
                  <span className="option-label">{option.label ?? option.value}</span>
                  {option.examples?.length ? (
                    <ul className="examples">
                      {option.examples.map(example => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                  ) : null}
                </label>
              )
            })}
          </div>
          <footer className="wizard-actions">
            <button className="btn ghost" type="button" onClick={back} disabled={progress.current <= 1}>
              {t('wizard.back', 'Back')}
            </button>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn ghost" type="button" onClick={restart}>
                {t('wizard.restart', 'Restart questionnaire')}
              </button>
              <button className="btn" type="button" onClick={next} disabled={!canAdvance}>
                {t('wizard.next', 'Next')}
              </button>
            </div>
          </footer>
        </section>
      ) : null}

      {completed && !currentQuestion ? (
        <section className="card wizard-complete">
          <h2>{t('wizard.complete.title', 'EUCertify Adaptive Questionnaire')}</h2>
          <p className="muted">
            {t('wizard.complete.subtitle', 'Thanks! We collected the signals needed to tailor EU compliance.')}
          </p>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <button className="btn" type="button" onClick={() => navigate(`/project/${projectId}/results`)}>
              {t('wizard.viewResults', 'View compliance results')}
            </button>
            <button className="btn ghost" type="button" onClick={restart}>
              {t('wizard.restart', 'Restart questionnaire')}
            </button>
            <button className="btn ghost" type="button" onClick={loadExample}>
              {t('wizard.loadExample', 'Load example answers')}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
