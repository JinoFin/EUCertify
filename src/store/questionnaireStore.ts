import { create } from 'zustand'
import type {
  QuestionDefinition,
  AnswerMap,
  QuestionnaireResult,
  AnswerValue
} from '@/utils/questionnaire'
import {
  collectQuestionTags,
  computeDerivedTags,
  deriveApplicableLaws,
  deriveStandardsFromLaws
} from '@/utils/questionnaire'
import { useProductStore } from './productStore'

const toAnswerMap = (rawAnswers: Record<string, unknown>): AnswerMap => {
  const answerEntries: [string, AnswerValue][] = Object.entries(rawAnswers).map(
    ([key, value]) => [key, value as AnswerValue]
  )
  return Object.fromEntries(answerEntries) as AnswerMap
}

type QuestionnaireState = {
  answers: AnswerMap
  tags: string[]
  derived_tags: string[]
  laws: QuestionnaireResult['laws']
  standards: string[]
  setAnswer: (questionId: string, value: AnswerValue, emittedTags?: string[]) => void
  process: (questions: QuestionDefinition[]) => QuestionnaireResult
  recomputeFromTags: (tags: string[]) => QuestionnaireResult
  persistDerivedData: () => Promise<void>
  reset: () => void
}

export const useQuestionnaireStore = create<QuestionnaireState>((set, get) => ({
  answers: {},
  tags: [],
  derived_tags: [],
  laws: [],
  standards: [],
  setAnswer: (questionId, value, emittedTags = []) => {
    set(state => {
      const rawAnswers = { ...state.answers, [questionId]: value }
      const nextAnswers = toAnswerMap(rawAnswers)
      const nextTags = Array.from(new Set([...state.tags, ...emittedTags]))
      return { answers: nextAnswers, tags: nextTags }
    })
  },
  process: questions => {
    const answers = get().answers
    const tags = collectQuestionTags(questions, answers)
    const derived = computeDerivedTags(tags)
    const laws = deriveApplicableLaws(derived)
    const standards = deriveStandardsFromLaws(laws)
    set({ tags, derived_tags: derived, laws, standards })
    return { tags, derived_tags: derived, laws, standards }
  },
  recomputeFromTags: tags => {
    const derived = computeDerivedTags(tags)
    const laws = deriveApplicableLaws(derived)
    const standards = deriveStandardsFromLaws(laws)
    set({ tags, derived_tags: derived, laws, standards })
    return { tags, derived_tags: derived, laws, standards }
  },
  persistDerivedData: async () => {
    const { derived_tags, laws, standards } = get()
    await useProductStore.getState().updateProject({ derived_tags, laws, standards })
  },
  reset: () => set({ answers: {}, tags: [], derived_tags: [], laws: [], standards: [] })
}))
