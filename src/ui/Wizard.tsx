import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { t } from '@/i18n'
import { useWizard } from '@/state/useWizard'
import { useProjects } from '@/state/useProjects'
import { useProjectData } from '@/state/useProjectData'
import type { WizardOption } from '@/data/questionsFlow'
import type { AnswerMap } from '@/domain/types'
import { debounce } from '@/utils/debounce'
import { countAnsweredRequired } from '@/domain/questionnaire'

const hasSelection = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'string' && value.length > 0
}

export default function Wizard() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const project = useProjects(state => (projectId ? state.list.find(item => item.id === projectId) ?? null : null))
  const loadProjects = useProjects(state => state.load)
  const selectProject = useProjects(state => state.select)
  const projectsLoading = useProjects(state => state.loading)
  const loadProjectData = useProjectData(state => state.load)
  const saveProjectAnswers = useProjectData(state => state.saveAnswers)
  const projectComplete = useProjectData(state => state.is_complete)
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
  const [toast, setToast] = useState<string | null>(null)
  const [previousCompletion, setPreviousCompletion] = useState<boolean | null>(null)
  const completionToastShownRef = useRef(false)

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
    setPreviousCompletion(null)
    completionToastShownRef.current = false
    setInitializing(true)

    ;(async () => {
      try {
        await loadProjectData(projectId)
        if (!active) return
        const state = useProjectData.getState()
        const loadedAnswers = (state.answers ?? {}) as AnswerMap
        hydrate(loadedAnswers)
        useProjects.setState(current => ({
          answersByProject: { ...current.answersByProject, [projectId]: loadedAnswers }
        }))
        completionToastShownRef.current = state.is_complete
        setPreviousCompletion(state.is_complete)
      } catch (error) {
        console.error('Failed to load answers', error)
        if (!active) return
        hydrate({})
        useProjects.setState(current => ({
          answersByProject: { ...current.answersByProject, [projectId]: {} }
        }))
        completionToastShownRef.current = false
        setPreviousCompletion(false)
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
  }, [hydrate, loadProjectData, navigate, projectId])

  const persistAnswers = useMemo(
    () =>
      debounce((id: string, payload: AnswerMap) => {
        saveProjectAnswers(id, payload)
          .then(snapshot => {
            useProjects.setState(current => ({
              answersByProject: { ...current.answersByProject, [id]: snapshot.answers }
            }))
            if (!snapshot.is_complete) {
              completionToastShownRef.current = false
            }
          })
          .catch(error => {
            console.error('Failed to persist answers', error)
          })
      }, 500),
    [saveProjectAnswers]
  )

  useEffect(() => {
    if (!projectId || initializing) return
    persistAnswers(projectId, answers)
  }, [answers, initializing, persistAnswers, projectId])

  useEffect(() => {
    if (!toast || typeof window === 'undefined') return
    const timeout = window.setTimeout(() => {
      setToast(null)
    }, 4000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [toast])

  useEffect(() => {
    if (previousCompletion === null) {
      setPreviousCompletion(projectComplete)
      completionToastShownRef.current = projectComplete
      return
    }
    if (!previousCompletion && projectComplete && !completionToastShownRef.current) {
      setToast(t('wizard.completedToast', 'Questionnaire completed — documents unlocked.'))
      completionToastShownRef.current = true
    }
    if (!projectComplete) {
      completionToastShownRef.current = false
    }
    setPreviousCompletion(projectComplete)
  }, [previousCompletion, projectComplete])

  const selection = currentQuestion ? answers[currentQuestion.id] : undefined
  const canAdvance = currentQuestion ? hasSelection(selection) : false

  const { required: requiredQuestionIds, answered: requiredAnswered } = useMemo(
    () => countAnsweredRequired(answers),
    [answers]
  )
  const requiredTotal = requiredQuestionIds.length
  const requiredPercent =
    requiredTotal === 0 ? 0 : Math.round((requiredAnswered / requiredTotal) * 100)

  const isFinalStep = useMemo(() => {
    if (!currentQuestion) return false
    if (currentQuestion.type === 'multiSelect') {
      return !currentQuestion.next
    }
    const value = answers[currentQuestion.id]
    if (typeof value !== 'string' || value.length === 0) return false
    const option = currentQuestion.options?.find(opt => opt.value === value)
    if (!option) return false
    return Boolean(option.end || currentQuestion.end || !option.next)
  }, [answers, currentQuestion])

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

  const handleNext = () => {
    if (!currentQuestion) return
    next()
    if (isFinalStep && !completionToastShownRef.current) {
      const latest = useProjectData.getState()
      if (latest.is_complete) {
        setToast(t('wizard.completedToast', 'Questionnaire completed — documents unlocked.'))
        completionToastShownRef.current = true
      }
    }
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
      {requiredTotal > 0 ? (
        <div
          className="wizard-required-progress"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 16
          }}
        >
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-value" style={{ width: `${requiredPercent}%` }}></div>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              {t('wizard.requiredProgress', '{answered} of {total} required answered')
                .replace('{answered}', String(requiredAnswered))
                .replace('{total}', String(requiredTotal))}
            </span>
            <strong style={{ fontSize: '0.85rem' }}>{requiredPercent}%</strong>
          </div>
        </div>
      ) : null}
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
            {`${t('wizard.progress', 'Progress')}: ${progress.current}/${progress.total}`}
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
              <button className="btn" type="button" onClick={handleNext} disabled={!canAdvance}>
                {isFinalStep ? t('wizard.finish', 'Finish') : t('wizard.next', 'Next')}
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
      {toast ? (
        <div
          role="status"
          className="card"
          style={{
            position: 'fixed',
            right: 24,
            top: 24,
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
