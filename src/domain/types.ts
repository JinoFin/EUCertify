export type AnswerValue = string | string[]
export type AnswerMap = Record<string, AnswerValue>
export type LegislationType = 'Directive' | 'Regulation' | 'Horizontal' | 'EPR'
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
