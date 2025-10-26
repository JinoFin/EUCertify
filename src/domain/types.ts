export type LegislationType = 'Directive' | 'Regulation' | 'Horizontal' | 'EPR'

export type AnswerValue = string | string[]
export type AnswerMap = Record<string, AnswerValue>

export type Condition =
  | { all?: string[]; any?: string[]; none?: string[] }
  | { whenAnswer?: string; equals?: string | string[] }

export type QuestionOption = {
  value: string
  label?: string
  next?: string
  addTags?: string[]
  explainHint?: string
  examples?: string[]
  exampleTitle?: string
  tooltip?: string
  end?: boolean
}

export type Question = {
  id: string
  step?: string
  prompt: string
  type: 'singleChoice' | 'multiSelect'
  helpText?: string
  options?: QuestionOption[]
  showIf?: Condition
  dynamicInsertAfter?: string
}

export type AppliesItem = { type: LegislationType; id: string }

export type Rule = {
  id: string
  ifAllTrue?: string[]
  ifAnyTrue?: string[]
  ifAnyFalse?: string[]
  applies: AppliesItem[]
  conformityPath?: { modules: string[] }
  outputs?: string[]
  rationale?: string
}

export type ExplainWhy = {
  id: string
  type: LegislationType
  because: string[]
  whatToDo: string[]
  evidenceNeeded: string[]
  confidence: number
}

export type DocProvider =
  | 'Manufacturer'
  | 'Importer'
  | 'Supplier'
  | 'Lab'
  | 'Notified Body'
  | 'Authority/PRO'
  | 'EUCertify'
export type DocStatus = 'exportable' | 'upload' | 'external'

export type DocumentRequirement = {
  docId: string
  name: string
  description: string
  requiredBy: string[]
  provider: DocProvider
  status: DocStatus
  exportAction?: 'generate' | 'template' | 'checklist'
  notes?: string[]
}

export type CountryRegistration = {
  id: string
  name: string
  authority: string
  description: string
  provider: DocProvider
  status: DocStatus
  requiredFor: string[]
}

export type CountryObligations = Record<string, CountryRegistration[]>

export type ReportSummary = {
  productSummary: {
    type: string
    role: string
    audience?: string
    use?: string
    markets: string[]
    detectedTags: string[]
  }
  rules: (AppliesItem & { confidence: number; reason: string[] })[]
  explain: ExplainWhy[]
  documents: DocumentRequirement[]
  countries: { code: string; name: string; registrations: CountryRegistration[] }[]
  outputs: string[]
  modules: string[]
  missingInfo: string[]
}

export function hasExamples(
  o: QuestionOption
): o is QuestionOption & { examples: string[] } {
  return Array.isArray((o as any).examples) && (o as any).examples.length > 0
}
