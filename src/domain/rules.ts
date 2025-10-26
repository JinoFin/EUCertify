import type { Rule } from './types'
import { rules as datasetRules } from '@/data'

export const rules: Rule[] = datasetRules.map(rule => ({
  id: rule.id,
  type: rule.type,
  requires: rule.requires ?? [],
  any: rule.any ?? [],
  excludes: rule.excludes ?? [],
  modules: rule.modules ?? [],
  outputs: rule.outputs ?? [],
  tags: rule.tags ?? []
}))
