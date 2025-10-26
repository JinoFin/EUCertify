import { useMemo } from 'react'
import { evaluate } from '@/domain/engine'
import { useWizard } from '@/state/useWizard'
import type { WizardOption } from '@/data/questionsFlow'

const formatOptionLabel = (option: WizardOption) => option.label ?? option.value

export default function Wizard() {
  const {
    currentQuestion,
    history,
    answers,
    progress,
    completed,
    answerSingle,
    toggleMulti,
    next,
    back,
    restart,
    countriesInfo
  } = useWizard()

  const selection = currentQuestion ? answers[currentQuestion.id] : undefined
  const isMulti = currentQuestion?.type === 'multiSelect'
  const canAdvance = isMulti
    ? Array.isArray(selection) && selection.length > 0
    : typeof selection === 'string' && selection.length > 0

  const results = useMemo(() => evaluate(answers), [answers])
  const selectedRules = results.applies
  const tags = results.tags
  const countries = countriesInfo()

  if (!currentQuestion && completed) {
    return (
      <div className="page">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>EUCertify Wizard v2</h2>
            <p style={{ opacity: 0.7 }}>Here is what we learned from your answers.</p>
          </div>
          <button className="btn ghost" onClick={restart}>
            Restart wizard
          </button>
        </header>
        <section style={{ marginTop: 24 }}>
          <h3>Detected product tags</h3>
          <div className="chips">
            {tags.length ? tags.map(tag => (
              <span key={tag} className="chip">
                {tag}
              </span>
            )) : <span style={{ opacity: 0.7 }}>No tags resolved yet.</span>}
          </div>
        </section>
        <section style={{ marginTop: 24 }}>
          <h3>Applicable EU rules</h3>
          {selectedRules.length ? (
            <ul className="card-list">
              {selectedRules.map(rule => (
                <li key={rule.id} className="card">
                  <strong>{rule.id}</strong>
                  <div style={{ opacity: 0.7 }}>{rule.type}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.7 }}>Select more answers to see applicable legislation.</p>
          )}
        </section>
        {results.conformityModules.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3>Suggested conformity modules</h3>
            <ul>
              {results.conformityModules.map(module => (
                <li key={module}>{module}</li>
              ))}
            </ul>
          </section>
        )}
        {results.outputs.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3>Recommended outputs & documentation</h3>
            <ul>
              {results.outputs.map(output => (
                <li key={output}>{output}</li>
              ))}
            </ul>
          </section>
        )}
        {countries.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3>Country nuances</h3>
            <ul className="card-list">
              {countries.map(([code, note]) => (
                <li key={code} className="card">
                  <strong>{code}</strong>
                  <div style={{ opacity: 0.75 }}>{note || 'No additional requirements logged.'}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="page">
        <p>Loading wizard…</p>
      </div>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="progress">
        <div className="progress-meta">
          <span>Question {progress.current} of {progress.total}</span>
          <span>{progress.percent}% complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-value" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.7 }}>
          Step {currentQuestion.step} · Interactive wizard
        </span>
        <h2>{currentQuestion.prompt}</h2>
      </header>
      {currentQuestion.type === 'singleChoice' && (
        <div className="option-grid">
          {currentQuestion.options?.map(option => {
            const isSelected = selection === option.value
            return (
              <button
                key={option.value}
                className={`choice ${isSelected ? 'selected' : ''}`}
                onClick={() => answerSingle(currentQuestion, option)}
                title={option.tooltip}
              >
                <span>{formatOptionLabel(option)}</span>
                {isSelected && <span className="choice-check">✓</span>}
              </button>
            )
          })}
        </div>
      )}
      {currentQuestion.type === 'multiSelect' && (
        <div className="option-grid">
          {currentQuestion.options?.map(option => {
            const currentValues = Array.isArray(selection) ? selection : []
            const checked = currentValues.includes(option.value)
            return (
              <label key={option.value} className={`choice checkbox ${checked ? 'selected' : ''}`} title={option.tooltip}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={event => toggleMulti(currentQuestion, option.value, event.target.checked)}
                />
                <span>{formatOptionLabel(option)}</span>
              </label>
            )
          })}
        </div>
      )}
      <footer className="wizard-actions">
        <div className="left">
          <button className="btn ghost" onClick={back} disabled={history.length === 0}>
            Back
          </button>
          <button className="btn ghost" onClick={restart}>
            Restart
          </button>
        </div>
        <button className="btn" onClick={next} disabled={!canAdvance && isMulti}>
          Next
        </button>
      </footer>
    </div>
  )
}
