import { describe, expect, it } from 'vitest'
import questionsData from '@/data/questions.json'
import type { Question } from '@/domain/types'
import { AnswerBus } from '@/domain/flow/answerBus'
import { getNext, isVisible } from '@/domain/flow/navigator'

const questions = questionsData as Question[]
const questionMap = new Map(questions.map(question => [question.id, question]))

const findFirstQuestion = (tagSet: Set<string>): Question | undefined => {
  return questions.find(question => isVisible(question, tagSet))
}

const simulate = (steps: Record<string, string | string[]>) => {
  const bus = new AnswerBus()
  let currentQuestion = findFirstQuestion(bus.getTags())

  while (currentQuestion) {
    const answer = steps[currentQuestion.id]
    if (answer === undefined) {
      break
    }

    if (currentQuestion.type === 'singleChoice') {
      const option = currentQuestion.options.find(opt => opt.value === answer)
      expect(option).toBeDefined()
      bus.setSingleAnswer(currentQuestion, option)
      const nextId = getNext(currentQuestion.id, answer, questions, bus.getTags())
      if (!nextId) break
      currentQuestion = questionMap.get(nextId)
    } else {
      const values = Array.isArray(answer) ? answer : [answer]
      bus.setMultiAnswer(currentQuestion, values)
      const nextId = getNext(currentQuestion.id, values, questions, bus.getTags())
      if (!nextId) break
      currentQuestion = questionMap.get(nextId)
    }
  }

  return bus.getTags()
}

describe('adaptive questionnaire tags', () => {
  it('collects tags for an electrical importer path with DE and FR markets', () => {
    const tags = simulate({
      q_product_category: 'electrical',
      q_electrical_power: 'rechargeable',
      q_radio: 'yes_radio',
      q_import_role: 'importer',
      q_markets: ['DE', 'FR'],
      q_docs_state: 'no_docs',
      q_help_mode: 'generate'
    })

    expect(Array.from(tags)).toEqual(
      expect.arrayContaining([
        'EEE',
        'electrical',
        'Battery',
        'Batteries',
        'wireless',
        'Radio',
        'RED',
        'EMC',
        'role:importer',
        'DE',
        'FR',
        'EPR',
        'WEEE',
        'Packaging'
      ])
    )
  })

  it('collects tags for a manual toy path', () => {
    const tags = simulate({
      q_product_category: 'toy',
      q_toy_powered: 'toy_manual'
    })

    expect(Array.from(tags)).toEqual(expect.arrayContaining(['Toy', 'ToySafety', 'GPSR']))
  })

  it('hides electrical power question when product is not tagged as electrical', () => {
    const bus = new AnswerBus()
    const firstQuestion = questionMap.get('q_product_category')
    expect(firstQuestion).toBeDefined()
    const toyOption = firstQuestion?.options.find(opt => opt.value === 'toy')
    expect(toyOption).toBeDefined()
    if (!firstQuestion || !toyOption) {
      throw new Error('Failed to locate initial question or option')
    }

    bus.setSingleAnswer(firstQuestion, toyOption)
    const electricalPowerQuestion = questionMap.get('q_electrical_power')
    expect(electricalPowerQuestion).toBeDefined()
    if (!electricalPowerQuestion) {
      throw new Error('Missing q_electrical_power question')
    }

    expect(isVisible(electricalPowerQuestion, bus.getTags())).toBe(false)
  })
})
