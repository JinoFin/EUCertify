import questionsData from '@/data/questions.json'
import { AnswerBus } from '@/domain/flow/answerBus'
import type { AnswerMap as FlowAnswerMap, Question } from '@/domain/types'

export type AnswerMap = Record<string, any>

const QUESTIONS = questionsData as Question[]

export function deriveTagsFromAnswers(answers: AnswerMap | FlowAnswerMap): string[] {
  const tagSet = new Set<string>()
  const bus = new AnswerBus()

  const flowAnswers = answers as FlowAnswerMap

  QUESTIONS.forEach(question => {
    const value = flowAnswers?.[question.id]
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

  bus.getTags().forEach(tag => tagSet.add(tag))

  const record = answers as AnswerMap

  if (record.productType === 'EEE') tagSet.add('EEE')
  if (record.hasRadio === true) tagSet.add('RED')
  if (record.power === 'mains' || record.power === 'battery') tagSet.add('LVD')
  if (record.power) tagSet.add('EMC')
  if (record.hasLiBattery) tagSet.add('BATTERY')
  if (record.ageGroup === 'children') tagSet.add('TOY')
  if (record.isFoodContact) tagSet.add('FOOD_CONTACT')

  tagSet.add('GPSR')

  return Array.from(tagSet)
}
