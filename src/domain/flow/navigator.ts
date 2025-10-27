import type { Question } from '@/domain/types'
import { mergeMultiTags, mergeOptionTags } from './answerBus'

const buildIndex = (questions: Question[]): Map<string, number> => {
  const index = new Map<string, number>()
  questions.forEach((question, position) => {
    index.set(question.id, position)
  })
  return index
}

export function isVisible(question: Question, tagSet: Set<string>): boolean {
  if (!question.showIfTagsAny || question.showIfTagsAny.length === 0) {
    return true
  }
  return question.showIfTagsAny.some(tag => tagSet.has(tag))
}

const findNextVisible = (
  startId: string | null,
  questions: Question[],
  index: Map<string, number>,
  tagSet: Set<string>
): string | null => {
  let candidateId: string | null = startId
  const visited = new Set<string>()

  while (candidateId) {
    if (visited.has(candidateId)) {
      return null
    }
    visited.add(candidateId)

    const position = index.get(candidateId)
    if (position === undefined) {
      return null
    }

    const candidate = questions[position]
    if (isVisible(candidate, tagSet)) {
      return candidate.id
    }

    candidateId = position + 1 < questions.length ? questions[position + 1].id : null
  }

  return null
}

export function getNext(
  currentId: string,
  selectedValueOrValues: string | string[],
  questions: Question[],
  tagSet: Set<string>
): string | null {
  const index = buildIndex(questions)
  const position = index.get(currentId)
  if (position === undefined) {
    return null
  }

  const question = questions[position]
  if (!question) return null

  let nextId: string | null = null

  if (question.type === 'singleChoice') {
    const selectedValue = typeof selectedValueOrValues === 'string' ? selectedValueOrValues : ''
    const option = question.options.find(opt => opt.value === selectedValue)
    mergeOptionTags(option, tagSet)
    nextId = option?.next ?? null
  } else {
    const values = Array.isArray(selectedValueOrValues) ? selectedValueOrValues : []
    mergeMultiTags(question, values, tagSet)
    nextId = question.next ?? null
  }

  return findNextVisible(nextId, questions, index, tagSet)
}
