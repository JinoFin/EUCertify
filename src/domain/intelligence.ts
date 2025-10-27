import type { AnswerMap } from '@/domain/types'

export type Intelligence = { tags: string[] }

export function buildIntelligence(ctx: { answers: AnswerMap; tags: string[] }): Intelligence {
  return { tags: Array.from(new Set(ctx.tags)) }
}
