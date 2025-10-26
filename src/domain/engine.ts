import { baseModules, baseOutputs, requirementsLibrary, explainers, allQuestions } from '@/data'
import { DOCUMENT_CATALOG } from '@/data/documentCatalog'
import { COUNTRY_OBLIGATIONS } from '@/data/countryObligations'
import type { AnswerMap, ReportSummary, ExplainWhy, AppliesItem } from './types'
import { resolveTagsDetailed } from './tagResolver'
import { rules } from './rules'

const DOCUMENT_MAP = new Map(DOCUMENT_CATALOG.map(doc => [doc.docId, doc]))

const hasSelection = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return typeof value === 'string' && value.length > 0
}

const dedupe = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)))

const getOptionLabel = (questionId: string, value: string | undefined): string => {
  if (!value) return ''
  const question = allQuestions[questionId]
  const option = question?.options?.find(opt => opt.value === value)
  return option?.label ?? value
}

const evaluateCondition = (
  condition: any,
  tags: string[],
  answers: AnswerMap
): boolean => {
  if (!condition) return true
  if ('whenAnswer' in condition) {
    const expected = condition.equals
    const value = answers[condition.whenAnswer]
    if (Array.isArray(expected)) {
      const selected = Array.isArray(value) ? value : value ? [value] : []
      return expected.some(item => selected.includes(item))
    }
    return value === expected
  }

  const { all, any, none } = condition
  if (all && !all.every((tag: string) => tags.includes(tag))) {
    return false
  }
  if (any && any.length > 0 && !any.some((tag: string) => tags.includes(tag))) {
    return false
  }
  if (none && none.some((tag: string) => tags.includes(tag))) {
    return false
  }
  return true
}

const computeMissingInfo = (answers: AnswerMap, tags: string[]): string[] => {
  const missing: string[] = []
  Object.values(allQuestions).forEach(question => {
    if (!question?.showIf) return
    const visible = evaluateCondition(question.showIf, tags, answers)
    if (!visible) return
    const response = answers[question.id]
    if (!hasSelection(response)) {
      missing.push(question.id)
    }
  })
  return missing
}

const followUpStatsForRule = (
  rule: (typeof rules)[number],
  answers: AnswerMap
): { count: number; answered: number } => {
  const needsWirelessDetail = [...(rule.ifAllTrue ?? []), ...(rule.ifAnyTrue ?? [])].includes('feature:wireless')
  const needsBatteryDetail = [...(rule.ifAllTrue ?? []), ...(rule.ifAnyTrue ?? [])].includes('feature:battery')
  const needsPowerDetail = [...(rule.ifAllTrue ?? []), ...(rule.ifAnyTrue ?? [])].includes('feature:low_voltage')

  const wirelessAnswered = hasSelection(answers['wireless_band'])
  const batteryTypeAnswered = hasSelection(answers['battery_type'])
  const powerAnswered = hasSelection(answers['power_source'])

  const checks: boolean[] = []
  if (needsWirelessDetail) checks.push(wirelessAnswered)
  if (needsBatteryDetail) checks.push(batteryTypeAnswered)
  if (needsPowerDetail) checks.push(powerAnswered)

  if (checks.length === 0) {
    return {
      count: 0,
      answered: wirelessAnswered || batteryTypeAnswered || powerAnswered ? 1 : 0
    }
  }

  return {
    count: checks.length,
    answered: checks.filter(Boolean).length
  }
}

const computeConfidence = (rule: (typeof rules)[number], answers: AnswerMap, tags: string[]): number => {
  const all = rule.ifAllTrue ?? []
  const any = rule.ifAnyTrue ?? []
  const none = rule.ifAnyFalse ?? []
  const hasAll = all.every(tag => tags.includes(tag))
  const hasAny = any.length === 0 || any.some(tag => tags.includes(tag))
  const hasNone = none.some(tag => tags.includes(tag))
  if (!hasAll || !hasAny || hasNone) return 0

  let confidence = 0.6
  if (all.length > 0) confidence += 0.2
  if (!hasNone && (rule.ifAnyFalse ?? []).length > 0) confidence += 0.1
  const followUps = followUpStatsForRule(rule, answers)
  if (followUps.answered > 0) confidence += 0.1
  else if (followUps.count > 0) confidence -= 0.2
  return Math.max(0, Math.min(1, confidence))
}

const buildExplainEntry = (
  apply: ExplainWhy,
  tagReasons: Record<string, string[]>,
  rule: (typeof rules)[number],
  answers: AnswerMap
): ExplainWhy => {
  const library = requirementsLibrary[apply.id]
  const explainer = explainers[apply.id] ?? { why: [], whatToDo: [], evidence: [] }
  const because = dedupe([...(library?.summary ?? []), ...(explainer.why ?? []), ...(tagReasons[apply.id] ?? []), rule.rationale ?? ''])
  const whatToDo = dedupe([...(explainer.whatToDo ?? []), ...(library?.summary ?? [])])
  const existingDocsYes = answers['existing_docs'] === 'yes'
  const evidenceDocuments = (library?.documents ?? []).filter(doc => !(existingDocsYes && doc.have))
  const evidenceNames = evidenceDocuments
    .map(item => DOCUMENT_MAP.get(item.docId)?.name ?? item.docId)
  const evidence = dedupe([...(explainer.evidence ?? []), ...evidenceNames])

  return {
    ...apply,
    because,
    whatToDo,
    evidenceNeeded: evidence,
    confidence: apply.confidence
  }
}

const mapRuleApplications = (
  matches: { apply: AppliesItem; confidence: number; rule: (typeof rules)[number] }[],
  tagReasons: Record<string, string[]>,
  answers: AnswerMap
): { rules: ReportSummary['rules']; explain: ExplainWhy[] } => {
  const combined = new Map<string, ExplainWhy>()
  const basic: ReportSummary['rules'] = []

  matches.forEach(({ apply, confidence, rule }) => {
    const existing = combined.get(apply.id)
    const entry: ExplainWhy = existing ?? {
      id: apply.id,
      type: apply.type,
      because: [],
      whatToDo: [],
      evidenceNeeded: [],
      confidence
    }
    entry.confidence = Math.max(entry.confidence, confidence)
    combined.set(apply.id, buildExplainEntry(entry, tagReasons, rule, answers))
  })

  combined.forEach(value => {
    basic.push({ id: value.id, type: value.type, confidence: value.confidence, reason: value.because })
  })

  return { rules: basic, explain: Array.from(combined.values()) }
}

const collectDocuments = (appliedIds: Set<string>): ReportSummary['documents'] => {
  const seen = new Map<string, typeof DOCUMENT_CATALOG[number]>()
  DOCUMENT_CATALOG.forEach(doc => {
    if (doc.requiredBy.some(id => appliedIds.has(id))) {
      seen.set(doc.docId, doc)
    }
  })
  const priority = { exportable: 0, upload: 1, external: 2 } as const
  return Array.from(seen.values()).sort((a, b) => {
    const statusDelta = (priority[a.status] ?? 3) - (priority[b.status] ?? 3)
    if (statusDelta !== 0) return statusDelta
    return a.name.localeCompare(b.name)
  })
}

const collectCountries = (markets: string[]): ReportSummary['countries'] => {
  const question = allQuestions['target_countries']
  const nameMap = new Map<string, string>(
    (question?.options ?? []).map(option => [option.value, option.label ?? option.value])
  )
  return markets.map(code => ({
    code,
    name: nameMap.get(code) ?? code,
    registrations: COUNTRY_OBLIGATIONS[code] ?? []
  }))
}

const deriveProductSummary = (answers: AnswerMap, tags: string[]): ReportSummary['productSummary'] => {
  const type = getOptionLabel('product_type', answers['product_type'] as string) || 'Unknown product'
  const role = getOptionLabel('user_role', answers['user_role'] as string) || 'Unspecified role'
  const audience = tags.includes('audience:children')
    ? 'Primarily for children'
    : tags.includes('audience:general')
    ? 'General consumers'
    : undefined
  const use = tags.includes('use:food_contact')
    ? 'Food contact'
    : tags.includes('use:skin_contact')
    ? 'Skin contact'
    : tags.includes('use:outdoor')
    ? 'Outdoor use'
    : undefined
  const markets = Array.isArray(answers['target_countries'])
    ? [...(answers['target_countries'] as string[])]
    : []
  return {
    type,
    role,
    audience,
    use,
    markets,
    detectedTags: tags
  }
}

export const buildReport = (answers: AnswerMap): ReportSummary => {
  const { tags, reasons: tagReasons } = resolveTagsDetailed(answers)
  const appliedIds = new Set<string>()
  const outputs = new Set<string>(baseOutputs)
  const modules = new Set<string>(baseModules)
  const matches: { apply: AppliesItem; confidence: number; rule: (typeof rules)[number] }[] = []

  rules.forEach(rule => {
    const confidence = computeConfidence(rule, answers, tags)
    if (confidence <= 0) return
    rule.outputs?.forEach(output => outputs.add(output))
    rule.conformityPath?.modules?.forEach(module => modules.add(module))
    rule.applies.forEach(apply => {
      appliedIds.add(apply.id)
      matches.push({ apply, confidence, rule })
    })
  })

  const { rules: summarizedRules, explain } = mapRuleApplications(matches, tagReasons, answers)
  const documents = collectDocuments(appliedIds)
  const productSummary = deriveProductSummary(answers, tags)
  const markets = productSummary.markets
  const countries = collectCountries(markets)
  const missingInfo = computeMissingInfo(answers, tags)

  return {
    productSummary,
    rules: summarizedRules,
    explain,
    documents,
    countries,
    outputs: Array.from(outputs),
    modules: Array.from(modules),
    missingInfo
  }
}

type LegacyEvaluation = {
  tags: string[]
  applies: { id: string; type: ExplainWhy['type'] }[]
  conformityModules: string[]
  outputs: string[]
}

export const evaluate = (answers: AnswerMap): LegacyEvaluation => {
  const report = buildReport(answers)
  return {
    tags: report.productSummary.detectedTags,
    applies: report.rules.map(rule => ({ id: rule.id, type: rule.type })),
    conformityModules: report.modules,
    outputs: report.outputs
  }
}
