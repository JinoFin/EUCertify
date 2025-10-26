import { baseModules, baseOutputs } from '@/data'
import { resolveTags } from './tagResolver'
import { rules } from './rules'
import type { AnswerMap, Evaluation } from './types'

export const evaluate = (answers: AnswerMap): Evaluation => {
  const tags = resolveTags(answers)
  const applies: Evaluation['applies'] = []
  const outputs = new Set<string>()
  const modules = new Set<string>()

  rules.forEach(rule => {
    const required = rule.requires ?? []
    const any = rule.any ?? []
    const excludes = rule.excludes ?? []
    const hasRequired = required.every(tag => tags.includes(tag))
    const hasAny = any.length === 0 || any.some(tag => tags.includes(tag))
    const hasExcluded = excludes.some(tag => tags.includes(tag))
    if (hasRequired && hasAny && !hasExcluded) {
      applies.push({ id: rule.id, type: rule.type })
      rule.modules?.forEach(m => modules.add(m))
      rule.outputs?.forEach(o => outputs.add(o))
      rule.tags?.forEach(t => tags.includes(t) || tags.push(t))
    }
  })

  baseModules.forEach(m => modules.add(m))
  baseOutputs.forEach(o => outputs.add(o))

  const dedupedTags = Array.from(new Set(tags))

  return {
    tags: dedupedTags,
    applies,
    conformityModules: Array.from(modules),
    outputs: Array.from(outputs)
  }
}
