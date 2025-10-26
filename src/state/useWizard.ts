import { create } from 'zustand'
import localforage from 'localforage'
import type { WizardOption, WizardQuestion } from '@/data/questionsFlow'
import { allQuestions, countryNuances, startQuestionId } from '@/data'

export type AnswerValue = string | string[]
export type AnswerMap = Record<string, AnswerValue>

const STORAGE_KEY = 'eucertify:v2'

type Progress = {
  current: number
  total: number
  percent: number
}

type WizardState = {
  currentId: string | null
  history: string[]
  answers: AnswerMap
  completed: boolean
  completedMulti: string[]
  progress: Progress
  currentQuestion: WizardQuestion | undefined
  answerSingle: (_question: WizardQuestion, _option: WizardOption) => void
  toggleMulti: (_question: WizardQuestion, _value: string, _checked: boolean) => void
  next: () => void
  back: () => void
  restart: () => void
  countriesInfo: () => [string, string][]
  loadExample: () => void
  goTo: (_questionId: string) => void
}

const hasSelection = (value: AnswerValue | undefined) =>
  Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.length > 0

const computeTotalQuestions = () => {
  const visited = new Set<string>()
  const visit = (id?: string | null) => {
    if (!id || visited.has(id)) return
    const question = allQuestions[id]
    if (!question) return
    visited.add(id)
    if (question.type === 'multiSelect') {
      visit(question.next ?? null)
    }
    question.options?.forEach(opt => visit(opt.next))
  }
  visit(startQuestionId)
  return visited.size
}

const deriveState = (answers: AnswerMap, completedMulti: Set<string>) => {
  const history: string[] = []
  let currentId: string | null = startQuestionId || null
  let completed = false

  while (currentId) {
    const question = allQuestions[currentId]
    if (!question) break

    if (question.type === 'multiSelect') {
      const value = answers[currentId]
      if (!hasSelection(value)) break
      if (!completedMulti.has(currentId)) break
      history.push(currentId)
      if (!question.next) {
        completed = true
        currentId = null
        break
      }
      currentId = question.next
      continue
    }

    const answer = answers[currentId]
    if (typeof answer !== 'string' || !answer.length) break
    const option = question.options?.find(opt => opt.value === answer)
    if (!option) break
    history.push(currentId)
    if (option.end || question.end || !option.next) {
      completed = true
      currentId = null
      break
    }
    currentId = option.next
  }

  const allowed = new Set<string>([...history])
  if (currentId) allowed.add(currentId)
  const prunedAnswers: AnswerMap = {}
  Object.entries(answers).forEach(([key, value]) => {
    if (allowed.has(key)) prunedAnswers[key] = value
  })

  return { currentId, history, completed, answers: prunedAnswers }
}

const totalQuestions = computeTotalQuestions()

const computeProgress = (history: string[], completed: boolean): Progress => {
  const currentIndex = completed ? totalQuestions : Math.min(history.length + 1, totalQuestions)
  const percent = totalQuestions === 0 ? 100 : Math.round((currentIndex / totalQuestions) * 100)
  return { current: currentIndex, total: totalQuestions, percent }
}

const buildState = (answers: AnswerMap, completedMulti: string[]) => {
  const derived = deriveState(answers, new Set(completedMulti))
  const filteredCompleted = derived.history.filter(id => allQuestions[id]?.type === 'multiSelect')
  const progress = computeProgress(derived.history, derived.completed)
  return {
    currentId: derived.currentId,
    history: derived.history,
    answers: derived.answers,
    completed: derived.completed,
    completedMulti: filteredCompleted,
    progress,
    currentQuestion: derived.currentId ? allQuestions[derived.currentId] : undefined
  }
}

const exampleAnswers: AnswerMap = {
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
  target_countries: ['DE', 'FR'],
  existing_docs: 'no',
  needs_docs: 'generate'
}

const saveAnswers = async (answers: AnswerMap) => {
  await localforage.setItem(STORAGE_KEY, answers)
}

const loadAnswers = async (): Promise<AnswerMap> => {
  return (await localforage.getItem<AnswerMap>(STORAGE_KEY)) || {}
}

export const useWizard = create<WizardState>((set, get) => {
  const initialState = buildState({}, [])

  loadAnswers().then(answers => {
    const multiFromAnswers: string[] = []
    const derived = buildState(answers, multiFromAnswers)
    set({
      ...derived
    })
  })

  return {
    ...initialState,
    answerSingle: (question, option) => {
      if (!question) return
      const answers = { ...get().answers, [question.id]: option.value }
      const completedMulti = get().completedMulti
      const derived = buildState(answers, completedMulti)
      set(derived)
      saveAnswers(derived.answers)
    },
    toggleMulti: (question, value, checked) => {
      const current = get().answers[question.id]
      const existing = Array.isArray(current) ? current : []
      const nextValues = new Set(existing)
      if (checked) nextValues.add(value)
      else nextValues.delete(value)
      const answers = { ...get().answers, [question.id]: Array.from(nextValues) }
      const derived = buildState(answers, get().completedMulti)
      set(derived)
      saveAnswers(derived.answers)
    },
    next: () => {
      const { currentQuestion, answers, completedMulti } = get()
      if (!currentQuestion) return
      if (currentQuestion.type === 'multiSelect') {
        const selection = answers[currentQuestion.id]
        if (!hasSelection(selection)) return
        const updatedCompleted = Array.from(new Set([...completedMulti, currentQuestion.id]))
        const derived = buildState(answers, updatedCompleted)
        set(derived)
        saveAnswers(derived.answers)
      } else if (currentQuestion.type === 'singleChoice') {
        const value = answers[currentQuestion.id]
        if (!hasSelection(value)) return
        const option = currentQuestion.options?.find(opt => opt.value === value)
        if (option) {
          const derived = buildState(answers, completedMulti)
          set(derived)
          saveAnswers(derived.answers)
        }
      }
    },
    back: () => {
      const { history, answers } = get()
      if (!history.length) return
      const newAnswers = { ...answers }
      const currentId = history[history.length - 1]
      const trimmedHistory = history.slice(0, -1)
      const completedMulti = trimmedHistory.filter(id => allQuestions[id]?.type === 'multiSelect')
      const derived = buildState(newAnswers, completedMulti)
      if (derived.currentId !== currentId) {
        derived.currentId = currentId
        derived.currentQuestion = allQuestions[currentId]
        derived.history = trimmedHistory
        derived.progress = computeProgress(trimmedHistory, false)
      }
      set(derived)
      saveAnswers(derived.answers)
    },
    restart: () => {
      const derived = buildState({}, [])
      set({ ...derived })
      saveAnswers({})
    },
    countriesInfo: () => {
      const selection = get().answers['target_countries']
      const countries = Array.isArray(selection) ? selection : []
      return countries.map(code => {
        const nuance = countryNuances[code]
        const info = nuance ? Object.values(nuance).join(' ') : ''
        return [code, info] as [string, string]
      })
    },
    loadExample: () => {
      const derived = buildState(exampleAnswers, ['target_countries'])
      set({ ...derived })
      saveAnswers(derived.answers)
    },
    goTo: questionId => {
      const question = allQuestions[questionId]
      if (!question) return
      const { answers, completedMulti } = get()
      const derived = buildState(answers, completedMulti)
      set({
        ...derived,
        currentId: questionId,
        currentQuestion: question,
        completed: false,
        progress: computeProgress(derived.history, false)
      })
    }
  }
})
