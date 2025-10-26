import { beforeEach, describe, expect, it, vi } from 'vitest'
import { questionsFlow, allQuestions } from '@/data'
import { resolveTags } from '@/domain/tagResolver'
import { useWizard } from '@/state/useWizard'
import type { AnswerMap } from '@/state/useWizard'

vi.mock('localforage', () => {
  const store = new Map<string, any>()
  return {
    default: {
      setItem: vi.fn((key: string, value: any) => {
        store.set(key, value)
        return Promise.resolve(value)
      }),
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key)))
    }
  }
})

describe('EUCertify wizard flow', () => {
  beforeEach(() => {
    useWizard.getState().restart()
  })

  it('has valid next pointers for every node', () => {
    const ids = new Set(questionsFlow.map(question => question.id))
    questionsFlow.forEach(question => {
      if (question.next) {
        expect(ids.has(question.next)).toBe(true)
      }
      question.options?.forEach(option => {
        if (option.next) {
          expect(ids.has(option.next)).toBe(true)
        }
      })
    })
  })

  it('resolves tags for an electronic device path', () => {
    const answers: AnswerMap = {
      product_type: 'electronic',
      power_need: 'yes',
      battery: 'yes',
      battery_type: 'rechargeable',
      wireless: 'yes',
      power_source: 'low_voltage',
      user_role: 'manufacturer',
      child_use: 'no',
      moving_parts: 'yes',
      food_contact: 'no',
      chemical_content: 'no',
      skin_contact: 'no',
      outdoor_use: 'no',
      target_countries: ['DE'],
      existing_docs: 'no',
      needs_docs: 'generate'
    }
    const tags = resolveTags(answers)
    expect(tags).toEqual(
      expect.arrayContaining([
        'product:electrical',
        'feature:electrical',
        'feature:battery',
        'feature:lithium',
        'feature:wireless',
        'feature:low_voltage',
        'scope:ce',
        'role:manufacturer',
        'risk:mechanical',
        'market:DE',
        'obligation:epr',
        'support:generate'
      ])
    )
  })

  it('resolves tags for a toy importer path', () => {
    const answers: AnswerMap = {
      product_type: 'toy',
      power_need: 'no',
      user_role: 'importer',
      child_use: 'yes',
      toy_play: 'yes',
      moving_parts: 'no',
      food_contact: 'no',
      chemical_content: 'no',
      skin_contact: 'no',
      outdoor_use: 'no',
      target_countries: ['ES'],
      existing_docs: 'yes',
      needs_docs: 'verify'
    }
    const tags = resolveTags(answers)
    expect(tags).toEqual(
      expect.arrayContaining([
        'product:toy',
        'audience:children',
        'feature:non_powered',
        'role:importer',
        'market:ES',
        'doc:exists',
        'support:review'
      ])
    )
  })

  it('resolves tags for a chemical wearable path', () => {
    const answers: AnswerMap = {
      product_type: 'chemical',
      chemical_content: 'yes',
      skin_contact: 'yes',
      outdoor_use: 'yes',
      target_countries: ['FR', 'PL'],
      existing_docs: 'no',
      needs_docs: 'generate'
    }
    const tags = resolveTags(answers)
    expect(tags).toEqual(
      expect.arrayContaining([
        'product:chemical',
        'feature:chemicals',
        'use:skin_contact',
        'use:outdoor',
        'market:FR',
        'market:PL',
        'obligation:epr',
        'support:generate'
      ])
    )
  })

  it('marks the wizard complete when reaching an end node', () => {
    const store = useWizard.getState()
    const answer = (id: string, value: string) => {
      const question = allQuestions[id]
      expect(question).toBeDefined()
      const option = question?.options?.find(opt => opt.value === value)
      expect(option).toBeDefined()
      if (question && option) {
        store.answerSingle(question, option)
      }
    }

    answer('product_type', 'electronic')
    answer('power_need', 'yes')
    answer('battery', 'yes')
    answer('battery_type', 'rechargeable')
    answer('wireless', 'yes')
    answer('power_source', 'low_voltage')
    answer('user_role', 'manufacturer')
    answer('child_use', 'no')
    answer('moving_parts', 'yes')
    answer('food_contact', 'no')
    answer('chemical_content', 'no')
    answer('skin_contact', 'no')
    answer('outdoor_use', 'no')

    const target = allQuestions['target_countries']
    expect(target?.type).toBe('multiSelect')
    if (target) {
      store.toggleMulti(target, 'DE', true)
      store.next()
    }

    answer('existing_docs', 'no')
    answer('needs_docs', 'generate')

    const finalState = useWizard.getState()
    expect(finalState.completed).toBe(true)
    expect(finalState.currentQuestion).toBeUndefined()
  })
})
