import { allQuestions, startQuestionId } from '@/data'
import type { WizardQuestion } from '@/data/questionsFlow'
import type { AnswerMap } from '@/domain/types'

const visitedNext = (question: WizardQuestion | undefined, value: unknown): string | null => {
  if (!question) return null

  if (question.type === 'multiSelect') {
    return question.next ?? null
  }

  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const option = question.options?.find(opt => opt.value === value)
  if (!option) {
    return null
  }

  if (option.end || question.end) {
    return null
  }

  return option.next ?? null
}

export const hasAnswer = (questionId: string, answers: AnswerMap): boolean => {
  const value = answers[questionId]
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return typeof value === 'string' && value.length > 0
}

export const deriveRequiredQuestionIds = (answers: AnswerMap): string[] => {
  if (!startQuestionId) return []

  const required: string[] = []
  const seen = new Set<string>()
  let currentId: string | null = startQuestionId

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId)
    required.push(currentId)

    const question = allQuestions[currentId] as WizardQuestion | undefined
    if (!question) {
      break
    }

    if (question.type === 'multiSelect') {
      if (!hasAnswer(currentId, answers)) {
        break
      }
      currentId = question.next ?? null
      continue
    }

    if (!hasAnswer(currentId, answers)) {
      break
    }

    const nextId = visitedNext(question, answers[currentId])
    if (!nextId) {
      break
    }

    currentId = nextId
  }

  return required
}

export const countAnsweredRequired = (answers: AnswerMap) => {
  const required = deriveRequiredQuestionIds(answers)
  const answered = required.filter(questionId => hasAnswer(questionId, answers)).length
  return { required, answered }
}

export const isQuestionnaireComplete = (answers: AnswerMap): boolean =>
  deriveRequiredQuestionIds(answers).every(questionId => hasAnswer(questionId, answers))

