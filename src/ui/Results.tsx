import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import localforage from 'localforage'
import { buildReport } from '@/domain/engine'
import { useWizard } from '@/state/useWizard'
import { exportPdf } from '@/ui/pdf'
import { requirementsLibrary, explainers, allQuestions } from '@/data'
import type { ReportSummary } from '@/domain/types'
import type { DocKind } from '@/docs/types'
import { makeDocContext } from '@/docs/context'
import { buildCompliancePack } from '@/docs/packBuilder'
import { loadDrafts, saveDrafts } from '@/docs/generator'
import LanguageSelector from '@/components/LanguageSelector'
import { useLang } from '@/context/LanguageContext'

const NEXT_STEPS_KEY = 'eucertify:nextSteps'

type NextStep = {
  id: string
  label: string
  description?: string
}

type NextStepGroup = {
  id: string
  title: string
  steps: NextStep[]
}

const DOC_TEMPLATE_MAP: Partial<Record<string, DocKind>> = {
  doc_eu_doc: 'EU_DoC',
  doc_risk: 'Risk_Register',
  doc_tech_file: 'TechFile_Checklist',
  label_ce_trace: 'Labels_Checklist',
  epr_weee_reg: 'EPR_Info_Sheet',
  epr_battery_reg: 'EPR_Info_Sheet',
  epr_packaging_reg: 'EPR_Info_Sheet',
  doc_user_manual: 'User_Manual_Starter'
}

const toFlag = (code: string) =>
  code
    .toUpperCase()
    .replace(/[A-Z]/g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))

const buildNextSteps = (report: ReportSummary, t: (_path: string) => string): NextStepGroup[] => {
  const documentsById = new Map(report.documents.map(doc => [doc.docId, doc]))
  const testingDocs = ['test_emc', 'test_lvd', 'test_red_rf']
  const testingSteps = testingDocs
    .map(id => documentsById.get(id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
    .map(doc => ({
      id: `testing:${doc.docId}`,
      label: `${t('results.nextSteps.testingActionPrefix')} ${doc.name}`,
      description: doc.description
    }))

  const exportableDocs = report.documents.filter(doc => doc.status === 'exportable')
  const generateSteps = exportableDocs.map(doc => ({
    id: `generate:${doc.docId}`,
    label: `${t('results.nextSteps.generateActionPrefix')} ${doc.name}`,
    description: doc.description
  }))

  const uploadDocs = report.documents.filter(doc => doc.status === 'upload')
  const uploadSteps = uploadDocs.map(doc => ({
    id: `upload:${doc.docId}`,
    label: `${t('results.nextSteps.collectActionPrefix')} ${doc.name}`,
    description: doc.description
  }))

  const countrySteps: NextStep[] = []
  report.countries.forEach(country => {
    country.registrations.forEach(reg => {
      countrySteps.push({
        id: `country:${country.code}:${reg.id}`,
        label: `${country.name}: ${reg.name}`,
        description: reg.description
      })
    })
  })

  const groups: NextStepGroup[] = []
  if (testingSteps.length) {
    groups.push({ id: 'testing', title: t('results.nextSteps.groups.testing'), steps: testingSteps })
  }
  if (generateSteps.length) {
    groups.push({ id: 'generate', title: t('results.nextSteps.groups.generate'), steps: generateSteps })
  }
  if (uploadSteps.length) {
    groups.push({ id: 'upload', title: t('results.nextSteps.groups.upload'), steps: uploadSteps })
  }
  if (countrySteps.length) {
    groups.push({ id: 'countries', title: t('results.nextSteps.groups.countries'), steps: countrySteps })
  }
  return groups
}

const limit = (items: string[], count: number) => items.slice(0, count)

export default function Results() {
  const { t } = useLang()
  const { answers, goTo } = useWizard()
  const navigate = useNavigate()
  const report = useMemo(() => buildReport(answers), [answers])
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const [modalDoc, setModalDoc] = useState<ReportSummary['documents'][number] | null>(null)

  const statusDisplay = useMemo(
    () => ({
      exportable: { icon: '🟢', label: t('results.documents.status.exportable') },
      upload: { icon: '🟡', label: t('results.documents.status.upload') },
      external: { icon: '🔴', label: t('results.documents.status.external') }
    }),
    [t]
  )

  const confidenceLabel = (value: number) => {
    if (value >= 0.75) return { label: t('results.confidence.high'), className: 'badge high' }
    if (value >= 0.5) return { label: t('results.confidence.medium'), className: 'badge medium' }
    return { label: t('results.confidence.low'), className: 'badge low' }
  }

  const nextSteps = useMemo(() => buildNextSteps(report, t), [report, t])

  useEffect(() => {
    localforage.getItem<Record<string, boolean>>(NEXT_STEPS_KEY).then(stored => {
      if (stored) {
        setChecked(stored)
      }
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    const next: Record<string, boolean> = {}
    nextSteps.forEach(group => {
      group.steps.forEach(step => {
        next[step.id] = checked[step.id] ?? false
      })
    })
    setChecked(next)
  }, [nextSteps, loaded])

  useEffect(() => {
    if (!loaded) return
    localforage.setItem(NEXT_STEPS_KEY, checked)
  }, [checked, loaded])

  const handleToggle = (stepId: string, value: boolean) => {
    setChecked(prev => ({ ...prev, [stepId]: value }))
  }

  const onExportPdf = () => {
    exportPdf({ answers, report })
  }

  const handleGeneratePack = async () => {
    const ctx = await makeDocContext(answers)
    const pack = buildCompliancePack(ctx)
    const existing = await loadDrafts()
    const merged = existing.filter(item => !pack.some(doc => doc.kind === item.kind)).concat(pack)
    await saveDrafts(merged)
    localStorage.setItem('eucertify:lastPack', JSON.stringify(pack))
    navigate('/docs/pack')
  }

  return (
    <div className="page results-v2">
      <div className="page-header">
        <LanguageSelector />
      </div>
      <header className="results-header">
        <div>
          <h2>{t('results.title')}</h2>
          <p className="muted">{t('results.subtitle')}</p>
        </div>
        <button className="btn" onClick={onExportPdf}>
          {t('results.exportPdf')}
        </button>
      </header>

      <section className="card summary-card">
        <h3>{t('results.productSummary.title')}</h3>
        <div className="summary-grid">
          <div>
            <h4>{t('results.productSummary.type')}</h4>
            <p>{report.productSummary.type}</p>
          </div>
          <div>
            <h4>{t('results.productSummary.role')}</h4>
            <p>{report.productSummary.role}</p>
          </div>
          <div>
            <h4>{t('results.productSummary.markets')}</h4>
            {report.productSummary.markets.length ? (
              <ul className="flag-list">
                {report.productSummary.markets.map(code => (
                  <li key={code}>
                    <span aria-hidden>{toFlag(code)}</span> {code}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{t('results.productSummary.noMarkets')}</p>
            )}
          </div>
          <div>
            <h4>{t('results.productSummary.features')}</h4>
            <div className="chips">
              {report.productSummary.detectedTags.length ? (
                report.productSummary.detectedTags.map(tag => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="muted">{t('results.productSummary.noFeatures')}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>{t('results.rules.title')}</h3>
        <div className="rules-list">
          {report.explain.map(entry => {
            const confidence = confidenceLabel(entry.confidence)
            const library = requirementsLibrary[entry.id]
            const title = library?.title ?? entry.id
            const actions = explainers[entry.id]?.whatToDo ?? entry.whatToDo
            const evidence = entry.evidenceNeeded
            return (
              <article key={entry.id} className="rule-card">
                <header>
                  <div>
                    <h4>{title}</h4>
                    <span className={`rule-type type-${entry.type.toLowerCase()}`}>{entry.type}</span>
                  </div>
                  <span className={confidence.className}>{confidence.label}</span>
                </header>
                <div className="rule-body">
                  <div>
                    <strong>{t('results.rules.why')}</strong>
                    <ul>
                      {limit(entry.because, 2).map(reason => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  {actions?.length ? (
                    <div>
                      <strong>{t('results.rules.actions')}</strong>
                      <ul>
                        {actions.map(action => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {evidence.length ? (
                    <div>
                      <strong>{t('results.rules.evidence')}</strong>
                      <ul>
                        {evidence.map(item => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h3>{t('results.documents.title')}</h3>
        <div className="documents">
          {report.documents.map(doc => {
            const status = statusDisplay[doc.status]
            const templateKind = DOC_TEMPLATE_MAP[doc.docId]
            let actionButton: ReactNode = null
            if (templateKind && doc.status === 'exportable') {
              if (doc.docId === 'doc_eu_doc') {
                actionButton = (
                  <div className="document-actions">
                    <button className="btn" type="button" onClick={() => navigate(`/docs/new/${templateKind}`)}>
                      {t('results.documents.generateAction')}
                    </button>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => navigate('/docs/new/EU_DoC', { state: { openPicker: true } })}
                    >
                      {t('results.documents.customizeAction')}
                    </button>
                  </div>
                )
              } else {
                actionButton = (
                  <button className="btn" type="button" onClick={() => navigate(`/docs/new/${templateKind}`)}>
                    {t('results.documents.generateAction')}
                  </button>
                )
              }
            } else if (templateKind && doc.status === 'upload') {
              actionButton = (
                <button className="btn ghost" type="button" onClick={() => navigate(`/docs/new/${templateKind}`)}>
                  {t('results.documents.openChecklist')}
                </button>
              )
            } else if (doc.status === 'external') {
              actionButton = (
                <button className="btn ghost" type="button" onClick={() => setModalDoc(doc)}>
                  {t('results.documents.learnHow')}
                </button>
              )
            }
            return (
              <div key={doc.docId} className="document-row">
                {doc.status === 'external' ? <span className="external-ribbon">{t('results.documents.externalRibbon')}</span> : null}
                <div className="document-main">
                  <h4>{doc.name}</h4>
                  <p className="muted">{doc.description}</p>
                  {doc.notes?.length ? (
                    <ul className="notes">
                      {doc.notes.map(note => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="document-meta">
                  <span className="status">
                    <span className="status-icon" aria-hidden>
                      {status.icon}
                    </span>
                    {status.label}
                  </span>
                  <div className="provider">{t('results.documents.providerPrefix')} {doc.provider}</div>
                  {actionButton}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card pack-callout">
        <h3>{t('results.pack.title')}</h3>
        <p className="muted">{t('results.pack.description')}</p>
        <button className="btn generate-pack-btn" type="button" onClick={handleGeneratePack}>
          🧾 {t('results.pack.button')}
        </button>
      </section>

      <section className="card">
        <h3>{t('results.countries.title')}</h3>
        {report.countries.length === 0 ? (
          <p className="muted">{t('results.countries.none')}</p>
        ) : (
          <div className="country-grid">
            {report.countries.map(country => {
              const groups = country.registrations.reduce<Record<string, typeof country.registrations>>((acc, reg) => {
                reg.requiredFor.forEach(key => {
                  if (!acc[key]) acc[key] = []
                  acc[key].push(reg)
                })
                return acc
              }, {})
              return (
                <article key={country.code} className="country-card">
                  <header>
                    <h4>
                      {toFlag(country.code)} {country.name}
                    </h4>
                  </header>
                  <div className="country-body">
                    {Object.entries(groups).map(([group, regs]) => (
                      <div key={group} className="country-group">
                        <strong>{group}</strong>
                        <ul>
                          {regs.map(item => (
                            <li key={item.id}>
                              <span>{item.name}</span>
                              <span className="muted"> · {item.status === 'external' ? t('results.countries.external') : t('results.countries.internal')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="card">
        <h3>{t('results.nextSteps.title')}</h3>
        {nextSteps.length === 0 ? (
          <p className="muted">{t('results.nextSteps.none')}</p>
        ) : (
          <div className="next-steps">
            {nextSteps.map(group => (
              <div key={group.id} className="next-step-group">
                <h4>{group.title}</h4>
                <ul>
                  {group.steps.map(step => (
                    <li key={step.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked[step.id] ?? false}
                          onChange={event => handleToggle(step.id, event.target.checked)}
                        />
                        <span>
                          {step.label}
                          {step.description ? <span className="muted"> — {step.description}</span> : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {report.missingInfo.length > 0 && (
        <section className="card warning">
          <h3>{t('results.missing.title')}</h3>
          <p className="muted">{t('results.missing.subtitle')}</p>
          <ul>
            {report.missingInfo.map(questionId => (
              <li key={questionId}>
                <button className="link" onClick={() => goTo(questionId)}>
                  {allQuestions[questionId]?.prompt ?? questionId}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {modalDoc ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header>
              <h3>{modalDoc.name}</h3>
              <button className="link" type="button" onClick={() => setModalDoc(null)}>
                {t('results.modal.close')}
              </button>
            </header>
            <p className="muted">{modalDoc.description}</p>
            <p>{t('results.modal.guidance').replace('{provider}', modalDoc.provider.toLowerCase())}</p>
            {modalDoc.notes?.length ? (
              <ul className="notes">
                {modalDoc.notes.map(note => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
