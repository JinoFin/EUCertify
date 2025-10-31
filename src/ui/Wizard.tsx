import { useEffect, useMemo } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { t } from '@/i18n'
import { useWizard } from '@/state/useWizard'
import { useSessionStore, selectProductById } from '@/state/useSession'
import type { WizardOption } from '@/data/questionsFlow'

const hasSelection = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'string' && value.length > 0
}

export default function Wizard() {
  const navigate = useNavigate()
  const { projectId, productId } = useParams<{ projectId: string; productId: string }>()
  const product = useSessionStore(state =>
    projectId && productId ? selectProductById(state, projectId, productId) : null
  )
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

  useEffect(() => {
    if (!projectId || !productId || !product) {
      navigate('/', { replace: true })
      return
    }
    hydrate(product.answers ?? {})
  }, [hydrate, navigate, product, productId, projectId])

  const selection = currentQuestion ? answers[currentQuestion.id] : undefined
  const canAdvance = currentQuestion ? hasSelection(selection) : false

  const headerTitle = useMemo(() => {
    if (!product) return t('wizard.loading', 'Loading adaptive questionnaire…')
    return t('wizard.header', 'Compliance wizard for {product}').replace('{product}', product.name)
  }, [product])

  const handleSingleSelect = (option: WizardOption) => {
    if (!currentQuestion) return
    answerSingle(currentQuestion, option)
  }

  const handleMultiToggle = (event: ChangeEvent<HTMLInputElement>, option: WizardOption) => {
    if (!currentQuestion) return
    toggleMulti(currentQuestion, option.value, event.target.checked)
  }

  if (!projectId || !productId || !product) {
    return null
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
            <button
              className="btn"
              type="button"
              onClick={() => navigate(`/projects/${projectId}/products/${productId}/results`)}
            >
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
