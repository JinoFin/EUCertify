import { create } from 'zustand'
import { getSupabase } from '@/auth/supabase'
import { deriveTagsFromAnswers } from '@/domain/tags'
import type { AnswerMap, AnswerValue } from '@/domain/types'
import { allQuestions, startQuestionId } from '@/data'
import type { WizardOption, WizardQuestion } from '@/data/questionsFlow'

export type Overrides = { legislation_ids: string[]; standard_codes: string[] }

type ProjectSnapshot = {
  answers: AnswerMap
  tags: string[]
  is_complete: boolean
  overrides?: Overrides
}

type ProjectDataState = {
  projectId: string | null
  answers: AnswerMap
  tags: string[]
  is_complete: boolean
  overrides?: Overrides
  load: (projectId: string) => Promise<void>
  saveAnswers: (projectId: string, answers: AnswerMap) => Promise<ProjectSnapshot>
  saveOverrides: (projectId: string, overrides: Overrides) => Promise<void>
  resetOverrides: (projectId: string) => Promise<void>
  setComplete: (projectId: string, complete: boolean) => Promise<void>
}

const uniqueStrings = (input: unknown): string[] => {
  if (!Array.isArray(input)) return []
  return Array.from(new Set(input.filter((item): item is string => typeof item === 'string' && item.length > 0)))
}

const computeCompletion = (answers: AnswerMap): boolean => {
  if (!startQuestionId) return false
  let currentId: string | null = startQuestionId
  const visited = new Set<string>()

  while (currentId) {
    if (visited.has(currentId)) {
      return false
    }
    visited.add(currentId)

    const question: WizardQuestion | undefined = allQuestions[currentId]
    if (!question) {
      return false
    }

    if (question.type === 'multiSelect') {
      const value = answers[currentId]
      if (!Array.isArray(value) || value.length === 0) {
        return false
      }
      currentId = question.next ?? null
      if (!currentId) {
        return true
      }
      continue
    }

    const value: AnswerValue | undefined = answers[currentId]
    if (typeof value !== 'string' || value.length === 0) {
      return false
    }

    const option: WizardOption | undefined = question.options?.find(
      (opt: WizardOption) => opt.value === value
    )
    if (!option) {
      return false
    }

    if (option.end || question.end || !option.next) {
      return true
    }

    currentId = option.next ?? null
  }

  return false
}

export const useProjectData = create<ProjectDataState>((set, get) => ({
  projectId: null,
  answers: {},
  tags: [],
  is_complete: false,
  overrides: undefined,

  load: async projectId => {
    const supabase = getSupabase()
    if (!projectId) return

    if (!supabase) {
      set({ projectId, answers: {}, tags: [], overrides: undefined, is_complete: false })
      return
    }

    try {
      const [{ data: answersData, error: answersError }, { data: overridesData, error: overridesError }] = await Promise.all([
        supabase
          .from('project_answers')
          .select('answers,tags,is_complete')
          .eq('project_id', projectId)
          .maybeSingle(),
        supabase
          .from('project_settings')
          .select('legislation_ids,standard_codes')
          .eq('project_id', projectId)
          .maybeSingle()
      ])

      if (answersError) {
        console.error('Failed to load project answers', answersError)
      }
      if (overridesError) {
        console.error('Failed to load project overrides', overridesError)
      }

      const answers = ((answersData as { answers?: AnswerMap } | null)?.answers ?? {}) as AnswerMap
      const rawTags = (answersData as { tags?: string[] } | null)?.tags
      const normalizedTags = uniqueStrings(rawTags)
      const tags = normalizedTags.length ? normalizedTags : deriveTagsFromAnswers(answers)
      const remoteComplete = (answersData as { is_complete?: boolean } | null)?.is_complete
      const is_complete = typeof remoteComplete === 'boolean' ? remoteComplete : computeCompletion(answers)

      const rawOverrides = overridesData as Overrides | null
      const overrides = rawOverrides
        ? {
            legislation_ids: uniqueStrings(rawOverrides.legislation_ids),
            standard_codes: uniqueStrings(rawOverrides.standard_codes)
          }
        : undefined

      set({ projectId, answers, tags, overrides, is_complete })
    } catch (error) {
      console.error('Failed to load project data', error)
      set({ projectId, answers: {}, tags: [], overrides: undefined, is_complete: false })
    }
  },

  saveAnswers: async (projectId, answers) => {
    const supabase = getSupabase()
    const computedTags = deriveTagsFromAnswers(answers)
    const normalizedTags = uniqueStrings(computedTags)
    const is_complete = computeCompletion(answers)
    const payload = {
      project_id: projectId,
      answers,
      tags: normalizedTags,
      is_complete
    }

    if (supabase) {
      const { error } = await supabase
        .from('project_answers')
        .upsert(payload, { onConflict: 'project_id' })
      if (error) {
        console.error('Failed to save project answers', error)
      }
    } else {
      console.warn('Missing Supabase env; answers stored in memory only.')
    }

    set({ projectId, answers, tags: normalizedTags, is_complete })
    const current = get()
    return {
      answers,
      tags: normalizedTags,
      is_complete,
      overrides: current.projectId === projectId ? current.overrides : undefined
    }
  },

  saveOverrides: async (projectId, overrides) => {
    const supabase = getSupabase()
    const normalized: Overrides = {
      legislation_ids: uniqueStrings(overrides.legislation_ids),
      standard_codes: uniqueStrings(overrides.standard_codes)
    }

    if (supabase) {
      const { error } = await supabase
        .from('project_settings')
        .upsert({
          project_id: projectId,
          legislation_ids: normalized.legislation_ids,
          standard_codes: normalized.standard_codes
        })
      if (error) {
        console.error('Failed to save project overrides', error)
      }
    } else {
      console.warn('Missing Supabase env; overrides stored in memory only.')
    }

    set({ projectId, overrides: normalized })
  },

  resetOverrides: async projectId => {
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.from('project_settings').delete().eq('project_id', projectId)
      if (error) {
        console.error('Failed to clear project overrides', error)
      }
    }
    set(state => {
      if (state.projectId !== projectId) return state
      return { ...state, overrides: undefined }
    })
  },

  setComplete: async (projectId, complete) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('project_answers')
          .update({ is_complete: complete })
          .eq('project_id', projectId)
          .select('project_id')
        if (error) {
          throw error
        }
        if (!data || data.length === 0) {
          const state = get()
          const payload = {
            project_id: projectId,
            answers: projectId === state.projectId ? state.answers : {},
            tags: projectId === state.projectId ? state.tags : [],
            is_complete: complete
          }
          const { error: upsertError } = await supabase
            .from('project_answers')
            .upsert(payload, { onConflict: 'project_id' })
          if (upsertError) {
            throw upsertError
          }
        }
      } catch (error) {
        console.error('Failed to update project completion', error)
      }
    }

    set(state => {
      if (state.projectId !== projectId) return state
      return { ...state, is_complete: complete }
    })
  }
}))
