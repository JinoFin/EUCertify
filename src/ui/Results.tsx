import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import localforage from 'localforage'
import { buildReport } from '@/domain/engine'
import { buildIntelligence } from '@/domain/intelligence'
import { useWizard } from '@/state/useWizard'
import { useSessionStore, selectProductById } from '@/state/useSession'
import { exportPdf } from '@/ui/pdf'
import { requirementsLibrary, explainers, allQuestions } from '@/data'
import type { AnswerMap, ReportSummary } from '@/domain/types'
import type { DocKind } from '@/docs/types'
import { makeDocContext } from '@/docs/context'
import { buildCompliancePack } from '@/docs/buildCompliancePack'
import { t } from '@/i18n'

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

const confidenceLabel = (value: number) => {
  if (value >= 0.75) return { key: 'results.confidence.high', fallback: 'High', className: 'badge high' }
  if (value >= 0.5) return { key: 'results.confidence.medium', fallback: 'Medium', className: 'badge medium' }
  return { key: 'results.confidence.low', fallback: 'Low', className: 'badge low' }
}

const toFlag = (code: string) =>
  code
    .toUpperCase()
    .replace(/[A-Z]/g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))

const buildHumanSummary = (report: ReportSummary, answers: AnswerMap): string | null => {
  const tags = new Set(report.productSummary.detectedTags ?? [])
  const descriptors: { text: string; joiner?: 'with' | 'plain' }[] = []

  const hasBatteries =
    answers['battery'] === 'yes' ||
    answers['battery_type'] === 'rechargeable' ||
    answers['battery_type'] === 'both' ||
    tags.has('feature:battery') ||
    tags.has('feature:lithium')
  if (hasBatteries) descriptors.push({ text: t('results.productSummary.summary.batteries', 'batteries'), joiner: 'with' })

  const hasWireless =
    answers['wireless'] === 'yes' ||
    (Array.isArray(answers['wireless_band']) ? (answers['wireless_band'] as string[]).length > 0 : Boolean(answers['wireless_band'])) ||
    tags.has('feature:wireless') ||
    Array.from(tags).some(tag => tag.startsWith('Radio:'))
  if (hasWireless) descriptors.push({ text: t('results.productSummary.summary.bluetooth', 'Bluetooth') })

  const hasMains = answers['power_source'] === 'mains' || tags.has('Mains')
  if (hasMains) descriptors.push({ text: t('results.productSummary.summary.mains', 'mains-powered') })

  const hasOutdoor = answers['outdoor_use'] === 'yes' || tags.has('use:outdoor')
  if (hasOutdoor) descriptors.push({ text: t('results.productSummary.summary.outdoor', 'outdoor use'), joiner: 'with' })

  let summary = report.productSummary.type?.trim() ?? ''
  if (descriptors.length) {
    const [first, ...rest] = descriptors
    const prefix = first.joiner === 'with' ? ` ${t('results.productSummary.summary.with', 'with')} ${first.text}` : ` ${first.text}`
    summary = summary ? summary + prefix : first.joiner === 'with' ? `${t('results.productSummary.summary.withCapitalized', 'With')} ${first.text}` : first.text
    rest.forEach(descriptor => {
      const join = descriptor.joiner === 'with'
        ? `, ${t('results.productSummary.summary.with', 'with')} ${descriptor.text}`
        : `, ${descriptor.text}`
      summary += join
    })
  }

  const audience: string[] = []
  if (answers['child_use'] === 'yes' || tags.has('audience:children')) {
    audience.push(t('results.productSummary.summary.children', 'for children under 14'))
  }
  if (answers['skin_contact'] === 'yes' || tags.has('use:skin_contact')) {
    audience.push(t('results.productSummary.summary.skin', 'for skin contact'))
  }

  if (audience.length) {
    summary = summary ? `${summary}, ${audience.join(', ')}` : audience.join(', ')
  }

  return summary || null
}

const buildNextSteps = (report: ReportSummary): NextStepGroup[] => {
  const documentsById = new Map(report.documents.map(doc => [doc.docId, doc]))
  const testingDocs = ['test_emc', 'test_lvd', 'test_red_rf']
  const testingSteps = testingDocs
    .map(id => documentsById.get(id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
    .map(doc => ({
      id: `testing:${doc.docId}`,
      label: t('results.nextSteps.book', 'Book {document}').replace('{document}', doc.name),
      description: doc.description
    }))

  const exportableDocs = report.documents.filter(doc => doc.status === 'exportable')
  const generateSteps = exportableDocs.map(doc => ({
    id: `generate:${doc.docId}`,
    label: t('results.nextSteps.create', 'Create {document}').replace('{document}', doc.name),
    description: doc.description
  }))

  const uploadDocs = report.documents.filter(doc => doc.status === 'upload')
  const uploadSteps = uploadDocs.map(doc => ({
    id: `upload:${doc.docId}`,
    label: t('results.nextSteps.collect', 'Collect {document}').replace('{document}', doc.name),
    description: doc.description
  }))

  const countrySteps: NextStep[] = []
  report.countries.forEach(country => {
    country.registrations.forEach(reg => {
      countrySteps.push({
        id: `country:${country.code}:${reg.id}`,
        label: t('results.nextSteps.country', '{country}: {registration}')
          .replace('{country}', country.name)
          .replace('{registration}', reg.name),
        description: reg.description
      })
    })
  })

  const groups: NextStepGroup[] = []
  if (testingSteps.length) {
    groups.push({
      id: 'testing',
      title: t('results.nextSteps.testing', 'Arrange testing & lab work'),
      steps: testingSteps
    })
  }
  if (generateSteps.length) {
    groups.push({
      id: 'generate',
      title: t('results.nextSteps.generate', 'Generate compliance documents'),
      steps: generateSteps
    })
  }
  if (uploadSteps.length) {
    groups.push({
      id: 'upload',
      title: t('results.nextSteps.upload', 'Upload supplier evidence'),
      steps: uploadSteps
    })
  }
  if (countrySteps.length) {
    groups.push({
      id: 'countries',
      title: t('results.nextSteps.countries', 'Complete country registrations'),
      steps: countrySteps
    })
  }
  return groups
}

const limit = (items: string[], count: number) => items.slice(0, count)

const buildProductProfile = (tags: string[]): string | null => {
  const tagSet = new Set(tags)
  const baseOrder: { tag: string; label: string }[] = [
    { tag: 'Toy', label: t('results.profile.base.toy', 'Toy') },
    { tag: 'EEE', label: t('results.profile.base.eee', 'Electronic product') },
    { tag: 'machinery', label: t('results.profile.base.machinery', 'Machinery') },
    { tag: 'FoodContact', label: t('results.profile.base.food', 'Food-contact product') },
    { tag: 'Chemicals', label: t('results.profile.base.chemicals', 'Chemical product') },
    { tag: 'OtherProduct', label: t('results.profile.base.consumer', 'Consumer product') }
  ]

  const base = baseOrder.find(entry => tagSet.has(entry.tag))?.label ?? ''

  const descriptors: string[] = []
  if (tagSet.has('Batteries') || tagSet.has('Battery')) {
    descriptors.push(t('results.profile.descriptor.batteries', 'with batteries'))
  }
  if (tagSet.has('Bluetooth')) {
    descriptors.push(t('results.profile.descriptor.bluetooth', 'Bluetooth'))
  } else if (tagSet.has('Radio') || tagSet.has('wireless')) {
    descriptors.push(t('results.profile.descriptor.wireless', 'wireless connectivity'))
  }

  const audience: string[] = []
  if (tagSet.has('Under14')) {
    audience.push(t('results.profile.audience.children', 'for children under 14'))
  }
  if (tagSet.has('Outdoor')) {
    audience.push(t('results.profile.audience.outdoor', 'for outdoor use'))
  }

  let summary = base
  if (descriptors.length) {
    const [first, ...rest] = descriptors
    summary = summary ? `${summary} ${first}` : first
    if (rest.length) {
      summary += `, ${rest.join(', ')}`
    }
  }
  if (audience.length) {
    summary = summary ? `${summary}, ${audience.join(', ')}` : audience.join(', ')
  }

  return summary || null
}

export default function Results() {
  const sanitizeKey = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'entry'

  const { projectId, productId } = useParams<{ projectId: string; productId: string }>()
  const product = useSessionStore(state =>
    projectId && productId ? selectProductById(state, projectId, productId) : null
  )
  const hydrate = useWizard(state => state.hydrate)
  const { answers, goTo } = useWizard()
  const navigate = useNavigate()
  const storePack = useSessionStore(state => state.storePack)

  useEffect(() => {
    if (!projectId || !productId || !product) {
      navigate('/', { replace: true })
      return
    }
    hydrate(product.answers ?? {})
  }, [hydrate, navigate, product, productId, projectId])

  if (!projectId || !productId || !product) {
    return null
  }
  const report = useMemo(() => buildReport(answers), [answers])
  const intelligence = useMemo(() => buildIntelligence({ answers: answers as AnswerMap }), [answers])
  const productProfile = useMemo(() => buildProductProfile(intelligence.tags), [intelligence.tags])
  const humanSummary = useMemo(() => buildHumanSummary(report, answers), [report, answers])
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const [modalDoc, setModalDoc] = useState<ReportSummary['documents'][number] | null>(null)
  const choseGenerate = answers['q_help_mode'] === 'generate'

  const nextSteps = useMemo(() => buildNextSteps(report), [report])
  const ruleGroups = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; label: string; items: ReportSummary['explain'][number][] }
    >()
    report.explain.forEach(entry => {
      const rawKind = ((entry as unknown as { kind?: string }).kind ?? entry.type ?? 'Other').toString()
      const key = rawKind.toLowerCase()
      if (!groups.has(key)) {
        groups.set(key, { key, label: rawKind, items: [] })
      }
      groups.get(key)?.items.push(entry)
    })
    return Array.from(groups.values())
  }, [report])

  const getRuleGroupLabel = (raw: string) => {
    const normalized = raw.toLowerCase()
    if (normalized.includes('directive')) {
      return t('results.rules.group.directive', 'Directives')
    }
    if (normalized.includes('regulation')) {
      return t('results.rules.group.regulation', 'Regulations')
    }
    if (normalized.includes('horizontal')) {
      return t('results.rules.group.horizontal', 'Horizontal requirements')
    }
    if (normalized.includes('epr') || normalized.includes('responsibility')) {
      return t('results.rules.group.epr', 'Producer responsibility')
    }
    if (normalized.includes('standard')) {
      return t('results.rules.group.standard', 'Standards & guidance')
    }
    return raw
  }

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
    exportPdf({ answers, report, productName: product.name })
  }

  const handleGenerateDocs = async () => {
    const intelligence = buildIntelligence({ answers: answers as AnswerMap })
    const ctx = makeDocContext({
      ...(answers as AnswerMap),
      intelligence
    } as AnswerMap & { intelligence: ReturnType<typeof buildIntelligence> })
    const pack = buildCompliancePack(ctx)
    const scopedPack = pack.map(item => ({ ...item, scope: { projectId, productId } }))
    storePack(projectId, productId, scopedPack)
    navigate(`/projects/${projectId}/products/${productId}/docs/pack`)
  }

  return (
    <div className="page results-v2">
      <header className="results-header">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2>{t('results.header.title', 'Compliance Summary')}</h2>
            <p className="muted">{t('results.header.subtitle', 'Your tailored EU compliance roadmap based on the wizard.')}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {choseGenerate ? (
              <button
                className="btn"
                type="button"
                onClick={() => navigate(`/projects/${projectId}/products/${productId}/docs/pack`)}
              >
                {t('results.header.generate', 'Generate documents')}
              </button>
            ) : null}
          </div>
        </div>
        <button className="btn" onClick={onExportPdf}>
          {t('results.header.exportPdf', 'Export Compliance Report (PDF)')}
        </button>
      </header>

      <section className="card summary-card">
        <h3>{t('results.productSummary.title', 'Product summary')}</h3>
        <div className="summary-grid">
          <div>
            <h4>{t('results.productSummary.type', 'Product type')}</h4>
            <p>{report.productSummary.type}</p>
          </div>
          <div>
            <h4>{t('results.productSummary.role', 'Your role')}</h4>
            <p>{report.productSummary.role}</p>
          </div>
          <div>
            <h4>{t('results.productSummary.markets', 'Markets')}</h4>
            {report.productSummary.markets.length ? (
              <ul className="flag-list">
                {report.productSummary.markets.map(code => (
                  <li key={code}>
                    <span aria-hidden>{toFlag(code)}</span> {code}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{t('results.productSummary.noMarkets', 'No markets selected yet.')}</p>
            )}
          </div>
          <div>
            <h4>{t('results.productSummary.features', 'Detected features')}</h4>
            {productProfile ? (
              <p className="muted" style={{ marginBottom: 8 }}>
                {t('results.productSummary.profilePrefix', 'Product profile')}: {productProfile}.
              </p>
            ) : null}
            <div className="chips">
              {report.productSummary.detectedTags.length ? (
                report.productSummary.detectedTags.map(tag => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="muted">{t('results.productSummary.noFeatures', 'No features detected')}</span>
              )}
            </div>
            {humanSummary ? (
              <p className="muted" style={{ marginTop: 8 }}>
                {t('results.productSummary.humanSummary', humanSummary)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card">
        <h3>{t('results.rules.title', 'Applicable EU rules')}</h3>
        <div className="rule-groups">
          {ruleGroups.map(group => (
            <div key={group.key} className="rule-group">
              <header className="rule-group-header">
                <h4>{getRuleGroupLabel(group.label)}</h4>
                <span className="muted">
                  {group.items.length} {t('results.rules.group.countLabel', 'items')}
                </span>
              </header>
              <div className="rules-list">
                {group.items.map(entry => {
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
                        <span className={confidence.className}>{t(confidence.key, confidence.fallback)}</span>
                      </header>
                      <div className="rule-body">
                        <div>
                          <strong>{t('results.rules.why', 'Why it applies')}</strong>
                          <ul>
                            {limit(entry.because, 2).map(reason => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                        {actions?.length ? (
                          <div>
                            <strong>{t('results.rules.what', 'What to do')}</strong>
                            <ul>
                              {actions.map(action => (
                                <li key={action}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {evidence.length ? (
                          <div>
                            <strong>{t('results.rules.evidence', 'Evidence needed')}</strong>
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
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>{t('results.documents.title', 'Required documentation')}</h3>
        <div className="documents-legend">
          <span className="badge status status-exportable">
            {t('docs.status.exportable', '🟢 Generated by EUCertify')}
          </span>
          <span className="badge status status-upload">
            {t('docs.status.upload', '🟡 Upload evidence')}
          </span>
          <span className="badge status status-external">
            {t('docs.status.external', '🔴 External requirement')}
          </span>
        </div>
        <div className="documents">
          {report.documents.map(doc => {
            const statusLabel =
              doc.status === 'exportable'
                ? t('docs.status.exportable', '🟢 Generated by EUCertify')
                : doc.status === 'upload'
                ? t('docs.status.upload', '🟡 Upload evidence')
                : t('docs.status.external', '🔴 External requirement')
            const statusDetail =
              doc.status === 'exportable'
                ? t('results.documents.detail.exportable', 'Available as template in EUCertify')
                : doc.status === 'upload'
                ? t('results.documents.detail.upload', 'Checklist available; upload test reports')
                : t('results.documents.detail.external', 'Handled by external provider')
            const templateKind = DOC_TEMPLATE_MAP[doc.docId]
            let actionButton: ReactNode = null
            if (templateKind && doc.status === 'exportable') {
              if (doc.docId === 'doc_eu_doc') {
                actionButton = (
                  <div className="document-actions">
                    <button
                      className="btn"
                      type="button"
                      onClick={() =>
                        navigate(`/projects/${projectId}/products/${productId}/docs/new/${templateKind}`)
                      }
                    >
                      {t('results.documents.generate', 'Generate in EUCertify')}
                    </button>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() =>
                        navigate(`/projects/${projectId}/products/${productId}/docs/new/EU_DoC`, {
                          state: { openPicker: true }
                        })
                      }
                    >
                      {t('results.documents.customize', 'Customize legislation & standards')}
                    </button>
                  </div>
                )
              } else {
                actionButton = (
                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      navigate(`/projects/${projectId}/products/${productId}/docs/new/${templateKind}`)
                    }
                  >
                    {t('results.documents.generate', 'Generate in EUCertify')}
                  </button>
                )
              }
            } else if (templateKind && doc.status === 'upload') {
              actionButton = (
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() =>
                    navigate(`/projects/${projectId}/products/${productId}/docs/new/${templateKind}`)
                  }
                >
                  {t('results.documents.checklist', 'Open checklist/template')}
                </button>
              )
            } else if (doc.status === 'external') {
              actionButton = (
                <button className="btn ghost" type="button" onClick={() => setModalDoc(doc)}>
                  {t('results.documents.learn', 'Learn how')}
                </button>
              )
            }
            const statusClass =
              doc.status === 'exportable'
                ? 'badge status status-exportable'
                : doc.status === 'upload'
                ? 'badge status status-upload'
                : 'badge status status-external'
            return (
              <div key={doc.docId} className="document-row">
                {doc.status === 'external' ? (
                  <span className="external-ribbon">
                    {t('results.documents.externalRibbon', 'External requirement')}
                  </span>
                ) : null}
                <header className="document-header">
                  <div>
                    <h4>{doc.name}</h4>
                    <p className="document-hint">{statusDetail}</p>
                  </div>
                  <span className={statusClass}>{statusLabel}</span>
                </header>
                <p className="muted">{doc.description}</p>
                {doc.notes?.length ? (
                  <ul className="notes">
                    {doc.notes.map(note => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
                <footer className="document-footer">
                  <div className="provider">
                    {t('results.documents.provider', 'Provided by')} {doc.provider}
                  </div>
                  {actionButton}
                </footer>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h3>{t('results.nextSteps.title', 'Next steps checklist')}</h3>
        {nextSteps.length === 0 ? (
          <p className="muted">{t('results.nextSteps.empty', 'No follow-up tasks generated yet.')}</p>
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

      <section className="card pack-callout">
        <h3>{t('results.pack.title', 'Generate your compliance pack')}</h3>
        <p className="muted">
          {t(
            'results.pack.description',
            'Create editable drafts of the DoC, risk register, tech file checklist, labels checklist, EPR info sheet, and manual starter—pre-filled using your answers.'
          )}
        </p>
        <button className="btn generate-pack-btn" type="button" onClick={handleGenerateDocs}>
          {t('results.pack.cta', '🧾 Generate My Compliance Pack')}
        </button>
      </section>

      <section className="card">
        <h3>{t('results.countries.title', 'Country-specific obligations')}</h3>
        {report.countries.length === 0 ? (
          <p className="muted">{t('results.countries.empty', 'Select markets to see registration tasks.')}</p>
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
                              <span className="muted">
                                {' '}
                                ·{' '}
                                {item.status === 'external'
                                  ? t('results.countries.external', 'External authority')
                                  : t('results.countries.internal', 'In-app')}
                              </span>
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

      {report.missingInfo.length > 0 && (
        <section className="card warning">
          <h3>{t('results.missing.title', 'We’re missing details')}</h3>
          <p className="muted">{t('results.missing.subtitle', 'Answer these follow-up questions to boost confidence:')}</p>
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
      {choseGenerate ? (
        <div className="sticky-cta">
          <span className="muted">{t('results.sticky.prompt', 'Ready to generate your documents?')}</span>
          <button className="btn primary" onClick={handleGenerateDocs}>
            {t('results.sticky.cta', 'Generate documents')}
          </button>
        </div>
      ) : null}
      {modalDoc ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header>
              <h3>{modalDoc.name}</h3>
              <button className="link" type="button" onClick={() => setModalDoc(null)}>
                {t('results.modal.close', 'Close')}
              </button>
            </header>
            <p className="muted">{modalDoc.description}</p>
            <p>
              {t('results.modal.guidance', 'Work with your {provider} or an accredited lab/authority to produce this evidence. They can advise on testing scope and reporting format.').replace(
                '{provider}',
                modalDoc.provider.toLowerCase()
              )}
            </p>
            {modalDoc.notes?.length ? (
              <ul className="notes">
                {modalDoc.notes.map((note, index) => (
                  <li key={note}>
                    {t(
                      `results.modal.note.${sanitizeKey(note)}.${index}`,
                      note
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
