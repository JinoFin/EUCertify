import { answerTags, staticTags } from '@/data'
import type { AnswerMap } from './types'

export const resolveTags = (answers: AnswerMap): string[] => {
  const map = answerTags
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
