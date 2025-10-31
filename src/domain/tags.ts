import questionsData from '@/data/questions.json'
import { AnswerBus } from '@/domain/flow/answerBus'
import type { AnswerMap, Question } from '@/domain/types'

const QUESTIONS = questionsData as Question[]

export function deriveTagsFromAnswers(answers: AnswerMap): string[] {
  const bus = new AnswerBus()

  QUESTIONS.forEach(question => {
    const value = answers?.[question.id]
    if (value === undefined || value === null) {
      return
    }

    if (question.type === 'singleChoice') {
      const option = question.options.find(opt => opt.value === value)
      if (option) {
        bus.setSingleAnswer(question, option)
      }
      return
    }

    const selected = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : typeof value === 'string'
      ? [value]
      : []

    bus.setMultiAnswer(question, selected)
  })

  return Array.from(bus.getTags())
}
