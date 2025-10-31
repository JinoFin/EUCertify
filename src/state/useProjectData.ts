import { create } from 'zustand'
import { getSupabase } from '@/auth/supabase'
import { deriveTagsFromAnswers } from '@/domain/tags'
import type { AnswerMap } from '@/domain/types'

export type Overrides = { legislation_ids: string[]; standard_codes: string[] }

type ProjectDataState = {
  projectId: string | null
  answers: AnswerMap
  tags: string[]
  overrides?: Overrides
  load: (projectId: string) => Promise<void>
  saveAnswersAndTags: (projectId: string, answers: AnswerMap, tags: string[]) => Promise<void>
  saveOverrides: (projectId: string, overrides: Overrides) => Promise<void>
  resetOverrides: (projectId: string) => Promise<void>
}

const uniqueStrings = (input: unknown): string[] => {
  if (!Array.isArray(input)) return []
  return Array.from(new Set(input.filter((item): item is string => typeof item === 'string' && item.length > 0)))
}

export const useProjectData = create<ProjectDataState>(set => ({
  projectId: null,
  answers: {},
  tags: [],
  overrides: undefined,

  load: async projectId => {
    const supabase = getSupabase()
    if (!projectId) return

    if (!supabase) {
      set({ projectId, answers: {}, tags: [], overrides: undefined })
      return
    }

    try {
      const [{ data: answersData, error: answersError }, { data: overridesData, error: overridesError }] = await Promise.all([
        supabase.from('project_answers').select('answers,tags').eq('project_id', projectId).maybeSingle(),
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

      const rawOverrides = overridesData as Overrides | null
      const overrides = rawOverrides
        ? {
            legislation_ids: uniqueStrings(rawOverrides.legislation_ids),
            standard_codes: uniqueStrings(rawOverrides.standard_codes)
          }
        : undefined

      set({ projectId, answers, tags, overrides })
    } catch (error) {
      console.error('Failed to load project data', error)
      set({ projectId, answers: {}, tags: [], overrides: undefined })
    }
  },

  saveAnswersAndTags: async (projectId, answers, tags) => {
    const supabase = getSupabase()
    const normalizedTags = uniqueStrings(tags)
    const payload = {
      project_id: projectId,
      answers,
      tags: normalizedTags
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

    set({ projectId, answers, tags: normalizedTags })
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
  }
}))
