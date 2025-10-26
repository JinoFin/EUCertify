export type AnswerValue = string | string[]
export type AnswerMap = Record<string, AnswerValue>
export type LegislationType = 'Directive' | 'Regulation' | 'Horizontal' | 'EPR'

export type QuestionOption = {
  label: string
  value: string
  next?: string
  end?: boolean
  tooltip?: string
  examples?: string[]
  exampleTitle?: string
}

export function hasExamples(o: QuestionOption): o is QuestionOption & { examples: string[] } {
  return Array.isArray((o as any).examples) && (o as any).examples.length > 0
}

export type Rule = {
  id: string
  type: LegislationType
  requires?: string[]
  any?: string[]
  excludes?: string[]
  modules?: string[]
  outputs?: string[]
  tags?: string[]
}
export type Evaluation = {
  tags: string[]
  applies: { id: string; type: LegislationType }[]
  conformityModules: string[]
  outputs: string[]
}
