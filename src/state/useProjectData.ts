import { create } from 'zustand'
import { assertSupabase } from '@/auth/supabase'
import { deriveTagsFromAnswers, type AnswerMap } from '@/domain/tags'
import { isQuestionnaireComplete } from '@/domain/questionnaire'
import type { AnswerMap as FlowAnswerMap } from '@/domain/types'

export type Overrides = { legislation_ids: string[]; standard_codes: string[] }

export type ProjectSnapshot = {
  answers: AnswerMap
  tags: string[]
  isComplete: boolean
  overrides?: Overrides
}

type ProjectDataState = {
  projectId: string | null
  answers: AnswerMap
  tags: string[]
  isComplete: boolean
  is_complete: boolean
  overrides?: Overrides
  load: (projectId: string) => Promise<void>
  saveAnswers: (projectId: string, answers: AnswerMap) => Promise<ProjectSnapshot>
  setComplete: (projectId: string, complete: boolean) => Promise<void>
  saveOverrides: (projectId: string, overrides: Overrides) => Promise<void>
  clearOverrides: (projectId: string) => Promise<void>
  resetOverrides: (projectId: string) => Promise<void>
}

const uniqueStrings = (input: unknown): string[] => {
  if (!Array.isArray(input)) return []
  const set = new Set<string>()
  input.forEach(item => {
    if (typeof item === 'string' && item.trim().length > 0) {
      set.add(item)
    }
  })
  return Array.from(set)
}

let supabaseWarningLogged = false
const getClient = () => {
  try {
    return assertSupabase()
  } catch (error) {
    if (!supabaseWarningLogged) {
      console.warn('Missing Supabase env (VITE_SB_URL / VITE_SB_ANON_KEY); using in-memory project data only.')
      supabaseWarningLogged = true
    }
    return null
  }
}

export const computeProjectCompletion = (answers: AnswerMap): boolean => {
  const flowAnswers = answers as FlowAnswerMap
  return isQuestionnaireComplete(flowAnswers)
}

export const useProjectData = create<ProjectDataState>((set, get) => ({
  projectId: null,
  answers: {},
  tags: [],
  isComplete: false,
  is_complete: false,
  overrides: undefined,

  load: async projectId => {
    if (!projectId) {
      set({ projectId: null, answers: {}, tags: [], overrides: undefined, isComplete: false, is_complete: false })
      return
    }

    const supabase = getClient()
    if (!supabase) {
      set({ projectId, answers: {}, tags: [], overrides: undefined, isComplete: false, is_complete: false })
      return
    }

    try {
      const [{ data: answersRow, error: answersError }, { data: settingsRow, error: settingsError }] = await Promise.all([
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
      if (settingsError) {
        console.error('Failed to load project overrides', settingsError)
      }

      const answers = ((answersRow as { answers?: AnswerMap } | null)?.answers ?? {}) as AnswerMap
      const storedTags = uniqueStrings((answersRow as { tags?: string[] } | null)?.tags)
      const tags = storedTags.length > 0 ? storedTags : deriveTagsFromAnswers(answers)
      const storedComplete = (answersRow as { is_complete?: boolean } | null)?.is_complete
      const isComplete = typeof storedComplete === 'boolean' ? storedComplete : computeProjectCompletion(answers)

      const overrides = settingsRow
        ? {
            legislation_ids: uniqueStrings((settingsRow as { legislation_ids?: string[] }).legislation_ids),
            standard_codes: uniqueStrings((settingsRow as { standard_codes?: string[] }).standard_codes)
          }
        : undefined

      set({ projectId, answers, tags, overrides, isComplete, is_complete: isComplete })
    } catch (error) {
      console.error('Failed to load project data', error)
      set({ projectId, answers: {}, tags: [], overrides: undefined, isComplete: false, is_complete: false })
    }
  },

  saveAnswers: async (projectId, answers) => {
    const supabase = getClient()
    const tags = deriveTagsFromAnswers(answers)
    const isComplete = computeProjectCompletion(answers)

    if (supabase) {
      try {
        await supabase
          .from('project_answers')
          .upsert(
            { project_id: projectId, answers, tags, is_complete: isComplete },
            { onConflict: 'project_id' }
          )
      } catch (error) {
        console.error('Failed to save project answers', error)
      }
    }

    set(state => ({
      ...state,
      projectId,
      answers,
      tags,
      isComplete,
      is_complete: isComplete
    }))

    const snapshot: ProjectSnapshot = {
      answers,
      tags,
      isComplete,
      overrides: get().projectId === projectId ? get().overrides : undefined
    }

    return snapshot
  },

  setComplete: async (projectId, complete) => {
    const supabase = getClient()
    if (supabase) {
      try {
        await supabase
          .from('project_answers')
          .upsert({ project_id: projectId, is_complete: complete }, { onConflict: 'project_id' })
      } catch (error) {
        console.error('Failed to update project completion', error)
      }
    }

    set(state => ({
      ...state,
      projectId,
      isComplete: complete,
      is_complete: complete
    }))
  },

  saveOverrides: async (projectId, overrides) => {
    const supabase = getClient()
    const normalized: Overrides = {
      legislation_ids: uniqueStrings(overrides.legislation_ids),
      standard_codes: uniqueStrings(overrides.standard_codes)
    }

    if (supabase) {
      try {
        await supabase
          .from('project_settings')
          .upsert(
            {
              project_id: projectId,
              legislation_ids: normalized.legislation_ids,
              standard_codes: normalized.standard_codes
            },
            { onConflict: 'project_id' }
          )
      } catch (error) {
        console.error('Failed to save project overrides', error)
      }
    }

    set(state => ({
      ...state,
      projectId,
      overrides: normalized
    }))
  },

  clearOverrides: async projectId => {
    const supabase = getClient()
    if (supabase) {
      try {
        await supabase.from('project_settings').delete().eq('project_id', projectId)
      } catch (error) {
        console.error('Failed to clear project overrides', error)
      }
    }

    set(state => {
      if (state.projectId !== projectId) return state
      return { ...state, overrides: undefined }
    })
  },

  resetOverrides: async projectId => {
    await get().clearOverrides(projectId)
  }
}))
