import { useMemo, useRef, useState } from 'react'
import questionsData from '@/data/questions.json'
import type { AnswerMap, Question, QuestionOption } from '@/domain/types'
import { AnswerBus } from '@/domain/flow/answerBus'
import { getNext, isVisible } from '@/domain/flow/navigator'
import { buildIntelligence } from '@/domain/intelligence'
import LanguageSelector from '@/components/LanguageSelector'
import { useLang } from '@/context/LanguageContext'

const questions = questionsData as Question[]

const toMap = (items: Question[]) =>
  new Map(items.map((question, index) => [question.id, { question, index }]))

const questionMap = toMap(questions)

const formatOptionLabel = (option: QuestionOption) => option.label ?? option.value

function OptionExamples({ option, label }: { option: QuestionOption; label: string }) {
  const [open, setOpen] = useState(false)

  if (!option.examples || option.examples.length === 0) {
    return null
  }

  return (
    <div className="opt-examples">
      <button
        type="button"
        className="link"
        aria-expanded={open}
        onClick={event => {
          event.stopPropagation()
          event.preventDefault()
          setOpen(value => !value)
        }}
      >
        {label} {open ? '▾' : '▸'}
      </button>
      {open && (
        <ul className="examples">
          {option.examples.map((example, index) => (
            <li key={index}>{example}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

const getFirstVisibleQuestion = (tagSet: Set<string>): Question | undefined => {
  for (const question of questions) {
    if (isVisible(question, tagSet)) {
      return question
    }
  }
  return undefined
}

const dedupe = (values: string[]): string[] => Array.from(new Set(values))

export default function Wizard() {
  const { t } = useLang()
  const busRef = useRef(new AnswerBus())
  const [currentId, setCurrentId] = useState<string | null>(getFirstVisibleQuestion(busRef.current.getTags())?.id ?? null)
  const [history, setHistory] = useState<string[]>([])
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [completed, setCompleted] = useState(false)
  const [intelligence, setIntelligence] = useState(() => buildIntelligence({ answers: {}, tags: [] }))

  const syncState = () => {
    const snapshot = busRef.current.getAnswers()
    setAnswers(snapshot)
  }

  const currentQuestion = currentId ? questionMap.get(currentId)?.question : undefined
  const currentSelection = currentQuestion ? answers[currentQuestion.id] : undefined

  const allowIds = (extra: string[] = []) => {
    const ids = new Set<string>()
    history.forEach(id => ids.add(id))
    if (currentId) ids.add(currentId)
    extra.forEach(id => ids.add(id))
    return ids
  }

  const pruneAnswers = (extra: string[] = []) => {
    busRef.current.retainQuestions(allowIds(extra))
    syncState()
  }

  const handleAdvance = (nextId: string | null) => {
    if (!currentQuestion) return
    const newHistory = [...history, currentQuestion.id]
    setHistory(newHistory)

    if (nextId) {
      setCurrentId(nextId)
      setCompleted(false)
      setIntelligence(buildIntelligence({ answers: busRef.current.getAnswers(), tags: Array.from(busRef.current.getTags()) }))
      return
    }

    setCompleted(true)
    setCurrentId(null)
    const snapshot = busRef.current.getAnswers()
    const snapshotTags = Array.from(busRef.current.getTags())
    setIntelligence(buildIntelligence({ answers: snapshot, tags: snapshotTags }))
  }

  const handleSingleChoice = (option: QuestionOption) => {
    if (!currentQuestion) return
    pruneAnswers()
    busRef.current.setSingleAnswer(currentQuestion, option)
    syncState()
    const nextId = getNext(currentQuestion.id, option.value, questions, busRef.current.getTags())
    handleAdvance(nextId)
  }

  const handleToggleMulti = (value: string, checked: boolean) => {
    if (!currentQuestion || currentQuestion.type !== 'multiSelect') return
    const existing = Array.isArray(currentSelection) ? currentSelection : []
    const nextValues = checked ? dedupe([...existing, value]) : existing.filter(item => item !== value)
    pruneAnswers()
    busRef.current.setMultiAnswer(currentQuestion, nextValues)
    syncState()
  }

  const handleNext = () => {
    if (!currentQuestion) return
    if (currentQuestion.type === 'multiSelect') {
      const values = Array.isArray(currentSelection) ? currentSelection : []
      const nextId = getNext(currentQuestion.id, values, questions, busRef.current.getTags())
      handleAdvance(nextId)
    }
  }

  const handleBack = () => {
    if (history.length === 0) return
    const previousId = history[history.length - 1]
    const nextHistory = history.slice(0, -1)
    setHistory(nextHistory)
    setCompleted(false)
    setIntelligence(buildIntelligence({ answers: busRef.current.getAnswers(), tags: Array.from(busRef.current.getTags()) }))
    setCurrentId(previousId)
    busRef.current.retainQuestions(new Set([...nextHistory, previousId]))
    syncState()
  }

  const handleRestart = () => {
    busRef.current.reset()
    const first = getFirstVisibleQuestion(busRef.current.getTags())
    setHistory([])
    setAnswers({})
    setCompleted(false)
    setIntelligence(buildIntelligence({ answers: {}, tags: [] }))
    setCurrentId(first?.id ?? null)
  }

  const questionsAnswered = useMemo(() => Object.keys(answers).length, [answers])
  const totalQuestions = questions.length

  if (!currentQuestion && !completed) {
    return (
      <div className="page">
        <div className="page-header">
          <LanguageSelector />
        </div>
        <p>{t('wizard.loading')}</p>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="page-header">
          <LanguageSelector />
        </div>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>{t('wizard.completed.title')}</h2>
            <p className="muted">{t('wizard.completed.subtitle')}</p>
          </div>
          <button className="btn ghost" onClick={handleRestart}>
            {t('wizard.completed.restart')}
          </button>
        </header>
        <section>
          <h3>{t('wizard.completed.detectedTags')}</h3>
          <div className="chips">
            {intelligence.tags.length ? (
              intelligence.tags.map(tag => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))
            ) : (
              <span className="muted">{t('wizard.completed.noTags')}</span>
            )}
          </div>
        </section>
        <section>
          <h3>{t('wizard.completed.answersSnapshot')}</h3>
          <ul className="card-list">
            {Object.entries(answers).map(([questionId, value]) => {
              const question = questionMap.get(questionId)?.question
              if (!question) return null
              const values = Array.isArray(value) ? value.join(', ') : value
              return (
                <li key={questionId} className="card">
                  <strong>{question.prompt}</strong>
                  <div className="muted">{values || '—'}</div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  const selection = currentSelection
  const isMulti = currentQuestion.type === 'multiSelect'
  const hasSelection = isMulti
    ? Array.isArray(selection) && selection.length > 0
    : typeof selection === 'string' && selection.length > 0

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header">
        <LanguageSelector />
      </div>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.7 }}>
          {(currentQuestion.step ?? t('wizard.questionLabel'))} · {questionsAnswered + 1} / {totalQuestions}
        </span>
        <h2>{currentQuestion.prompt}</h2>
        {currentQuestion.helpText && <p className="question-help">{currentQuestion.helpText}</p>}
      </header>
      {currentQuestion.type === 'singleChoice' && (
        <div className="option-grid">
          {currentQuestion.options.map(option => {
            const isSelected = selection === option.value
            return (
              <div key={option.value} className="choice-with-examples">
                <button
                  className={`choice ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSingleChoice(option)}
                  type="button"
                >
                  <span>{formatOptionLabel(option)}</span>
                  {option.explainHint && <small className="muted">{option.explainHint}</small>}
                  {isSelected && <span className="choice-check">✓</span>}
                </button>
                <OptionExamples option={option} label={t('wizard.examples')} />
              </div>
            )
          })}
        </div>
      )}
      {currentQuestion.type === 'multiSelect' && (
        <div className="option-grid">
          {currentQuestion.options.map(option => {
            const values = Array.isArray(selection) ? selection : []
            const checked = values.includes(option.value)
            return (
              <div key={option.value} className="choice-with-examples">
                <label className={`choice checkbox ${checked ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={event => handleToggleMulti(option.value, event.target.checked)}
                  />
                  <span>{formatOptionLabel(option)}</span>
                  {option.explainHint && <small className="muted">{option.explainHint}</small>}
                </label>
                <OptionExamples option={option} label={t('wizard.examples')} />
              </div>
            )
          })}
        </div>
      )}
      <footer className="wizard-actions">
        <div className="left">
          <button className="btn ghost" onClick={handleBack} disabled={history.length === 0}>
            {t('wizard.actions.back')}
          </button>
          <button className="btn ghost" onClick={handleRestart}>
            {t('wizard.actions.restart')}
          </button>
        </div>
        {isMulti ? (
          <button className="btn" onClick={handleNext} disabled={!hasSelection}>
            {t('wizard.actions.next')}
          </button>
        ) : (
          <span className="muted">{t('wizard.selectOption')}</span>
        )}
      </footer>
    </div>
  )
}
