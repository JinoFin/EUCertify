import data from '@/data/eucertify.v1.json'
import type { Rule } from './types'

export const rules: Rule[] = Array.isArray((data as any).rules)
  ? (data as any).rules.map((rule: any) => ({
      id: rule.id,
      type: rule.type,
      requires: rule.requires ?? rule.all ?? [],
      any: rule.any ?? [],
      excludes: rule.excludes ?? rule.none ?? [],
      modules: rule.modules ?? rule.conformityModules ?? [],
      outputs: rule.outputs ?? rule.checklists ?? [],
      tags: rule.tags ?? []
    }))
  : []
