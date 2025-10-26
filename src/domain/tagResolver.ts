import data from '@/data/eucertify.v1.json'
import type { AnswerMap } from './types'

export const resolveTags = (answers: AnswerMap): string[] => {
  const map = ((data as any).answerTags ?? (data as any).tags ?? {}) as Record<string, Record<string, string[]>>
  const staticTags: string[] = Array.isArray((data as any).staticTags) ? (data as any).staticTags : []
  const tags = new Set<string>(staticTags)
  Object.entries(map).forEach(([questionId, values]) => {
    const answer = answers[questionId]
    if (!answer) return
    const selected = Array.isArray(answer) ? answer : [answer]
    selected.forEach(v => {
      const resolved = values?.[v]
      if (resolved) resolved.forEach(tag => tags.add(tag))
    })
  })
  return Array.from(tags)
}
