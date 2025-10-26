import type { Rule } from './types'
import { rules as datasetRules } from '@/data'

export const rules: Rule[] = datasetRules.map(rule => ({
  id: rule.id,
  ifAllTrue: rule.ifAllTrue ?? [],
  ifAnyTrue: rule.ifAnyTrue ?? [],
  ifAnyFalse: rule.ifAnyFalse ?? [],
  applies: rule.applies,
  conformityPath: rule.conformityPath,
  outputs: rule.outputs ?? [],
  rationale: rule.rationale
}))
