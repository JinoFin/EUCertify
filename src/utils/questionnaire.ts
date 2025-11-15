import { lawMapping, type LawCode } from './lawMapping'

export type AnswerValue = string | number | boolean | string[] | null | undefined
export type AnswerMap = Record<string, AnswerValue>

export type SkipCondition = {
  field: string
  equals?: AnswerValue
  notEquals?: AnswerValue
  includes?: string
  excludes?: string
  requiresTags?: string[]
  forbiddenTags?: string[]
}

export type QuestionDefinition = {
  id: string
  addTags?: string[]
  skipLogic?: SkipCondition[]
}

export type QuestionnaireResult = {
  tags: string[]
  derived_tags: string[]
  laws: LawCode[]
  standards: string[]
}

const toArray = (value: AnswerValue): string[] => {
  if (Array.isArray(value)) return value.map(String)
  if (value == null) return []
  return [String(value)]
}

const shouldSkipByCondition = (
  condition: SkipCondition,
  answers: AnswerMap,
  activeTags: string[]
): boolean => {
  const answer = answers[condition.field]
  if (condition.equals !== undefined && answer === condition.equals) return true
  if (condition.notEquals !== undefined && answer !== condition.notEquals) return true
  if (condition.includes) {
    const arr = toArray(answer)
    if (arr.includes(condition.includes)) return true
  }
  if (condition.excludes) {
    const arr = toArray(answer)
    if (!arr.includes(condition.excludes)) return true
  }
  if (condition.requiresTags?.length) {
    return !condition.requiresTags.every(tag => activeTags.includes(tag))
  }
  if (condition.forbiddenTags?.length) {
    return condition.forbiddenTags.some(tag => activeTags.includes(tag))
  }
  return false
}

export const evaluateSkipLogic = (
  question: QuestionDefinition,
  answers: AnswerMap,
  activeTags: string[] = []
): boolean => {
  if (!question.skipLogic?.length) return false
  return question.skipLogic.some(condition => shouldSkipByCondition(condition, answers, activeTags))
}

export const collectQuestionTags = (
  questions: QuestionDefinition[],
  answers: AnswerMap
): string[] => {
  const tags = new Set<string>()
  questions.forEach(question => {
    const shouldSkip = evaluateSkipLogic(question, answers, Array.from(tags))
    if (shouldSkip) return
    question.addTags?.forEach(tag => tags.add(tag))
    const answer = answers[question.id]
    if (typeof answer === 'string' && answer.startsWith('tag:')) {
      tags.add(answer.replace('tag:', ''))
    } else if (Array.isArray(answer)) {
      answer.filter(Boolean).forEach(value => tags.add(String(value)))
    }
  })
  return Array.from(tags)
}

export const computeDerivedTags = (tags: string[]): string[] => {
  const derived = new Set<string>(tags)
  const hasRadio = tags.some(tag => ['radio', 'bluetooth', 'wifi'].includes(tag))
  if (hasRadio) {
    derived.add('radio')
    derived.add('wireless')
  }
  const hasBattery = tags.some(tag => tag.includes('battery'))
  if (hasBattery) {
    derived.add('battery')
  }
  const hasMains = tags.some(tag => tag.includes('mains') || tag.includes('charger'))
  if (hasMains) {
    derived.add('mains_powered')
  }
  const hasMedical = tags.some(tag => tag.includes('medical'))
  if (hasMedical) {
    derived.add('medical_device')
  }
  if (!tags.length) {
    derived.add('general_product')
  }
  return Array.from(derived)
}

const tagToLaw: Record<string, LawCode[]> = {
  radio: ['RED', 'EMC', 'RoHS'],
  wireless: ['RED', 'EMC', 'RoHS'],
  battery: ['RoHS'],
  mains_powered: ['LVD', 'EMC', 'RoHS'],
  medical_device: ['MDR', 'RoHS', 'EMC'],
  general_product: ['GPSR']
}

export const deriveApplicableLaws = (derivedTags: string[]): LawCode[] => {
  const laws = new Set<LawCode>(['GPSR'])
  derivedTags.forEach(tag => {
    const linked = tagToLaw[tag]
    linked?.forEach(law => laws.add(law))
  })
  return Array.from(laws)
}

export const deriveStandardsFromLaws = (laws: LawCode[]): string[] => {
  const standards = new Set<string>()
  laws.forEach(law => {
    lawMapping[law].forEach(standard => standards.add(standard))
  })
  return Array.from(standards)
}
