import { create } from 'zustand'
import { getSupabase } from '@/auth/supabase'
import type { Tag } from '@/wizard/schema'

export type ProjectData = {
  answers: Record<string, unknown>
  derivedTags: Tag[]
  lawOverrides?: string[]
}

interface State {
  cache: Record<string, ProjectData>
  load: (projectId: string) => Promise<ProjectData>
  saveAnswers: (projectId: string, answers: Record<string, unknown>) => Promise<void>
  saveDerivedTags: (projectId: string, tags: Tag[]) => Promise<void>
  setLawOverrides: (projectId: string, laws: string[]) => Promise<void>
  getAnswers: (projectId: string) => Record<string, unknown> | undefined
}

type PersistFn = (projectId: string, data: ProjectData) => Promise<void>

type DebouncedSaver = ((projectId: string) => void) & { flush: () => Promise<void> }

const createDebouncedSaver = (getState: () => State, persist: PersistFn): DebouncedSaver => {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: string | null = null

  const run = async () => {
    const projectId = pending
    pending = null
    if (!projectId) return
    const data = getState().cache[projectId]
    if (!data) return
    await persist(projectId, data)
  }

  const schedule = (projectId: string) => {
    pending = projectId
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      void run()
    }, 400)
  }

  schedule.flush = async () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    await run()
  }

  return schedule as DebouncedSaver
}

const ensureProjectData = (input: Partial<ProjectData> | undefined): ProjectData => ({
  answers: input?.answers ?? {},
  derivedTags: Array.isArray(input?.derivedTags) ? (input?.derivedTags as Tag[]) : [],
  lawOverrides: Array.isArray(input?.lawOverrides) ? [...(input?.lawOverrides as string[])] : []
})

const persistToSupabase: PersistFn = async (projectId, data) => {
  const supabase = getSupabase()
  if (!supabase) return

  try {
    await supabase
      .from('project_data')
      .upsert(
        {
          project_id: projectId,
          answers: data.answers ?? {},
          derived_tags: data.derivedTags ?? [],
          law_overrides: data.lawOverrides && data.lawOverrides.length ? data.lawOverrides : null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'project_id' }
      )
  } catch (error) {
    console.error('Failed to persist project data', error)
  }
}

export const useProjectData = create<State>((set, get) => {
  const debouncedSave = createDebouncedSaver(get, persistToSupabase)

  return {
    cache: {},
    async load(projectId) {
      const cached = get().cache[projectId]
      if (cached) return cached

      const supabase = getSupabase()
      if (!supabase) {
        const fallback = ensureProjectData(undefined)
        set(state => ({ cache: { ...state.cache, [projectId]: fallback } }))
        return fallback
      }

      try {
        const { data, error } = await supabase
          .from('project_data')
          .select('answers,derived_tags,law_overrides')
          .eq('project_id', projectId)
          .maybeSingle()

        if (error) {
          console.error('Failed to load project data', error)
          const fallback = ensureProjectData(undefined)
          set(state => ({ cache: { ...state.cache, [projectId]: fallback } }))
          return fallback
        }

        const loaded: ProjectData = {
          answers: (data?.answers as Record<string, unknown>) ?? {},
          derivedTags: Array.isArray(data?.derived_tags)
            ? (data?.derived_tags.filter((tag: unknown): tag is Tag => typeof tag === 'string') as Tag[])
            : [],
          lawOverrides: Array.isArray(data?.law_overrides)
            ? (data?.law_overrides.filter((value: unknown): value is string => typeof value === 'string') as string[])
            : []
        }

        set(state => ({ cache: { ...state.cache, [projectId]: loaded } }))
        return loaded
      } catch (error) {
        console.error('Failed to load project data', error)
        const fallback = ensureProjectData(undefined)
        set(state => ({ cache: { ...state.cache, [projectId]: fallback } }))
        return fallback
      }
    },
    async saveAnswers(projectId, answers) {
      set(state => ({
        cache: {
          ...state.cache,
          [projectId]: {
            ...(state.cache[projectId] ?? ensureProjectData(undefined)),
            answers
          }
        }
      }))
      debouncedSave(projectId)
    },
    async saveDerivedTags(projectId, tags) {
      set(state => ({
        cache: {
          ...state.cache,
          [projectId]: {
            ...(state.cache[projectId] ?? ensureProjectData(undefined)),
            derivedTags: [...new Set(tags)]
          }
        }
      }))
      await debouncedSave.flush()
      debouncedSave(projectId)
    },
    async setLawOverrides(projectId, laws) {
      set(state => ({
        cache: {
          ...state.cache,
          [projectId]: {
            ...(state.cache[projectId] ?? ensureProjectData(undefined)),
            lawOverrides: [...new Set(laws)]
          }
        }
      }))
      await debouncedSave.flush()
      debouncedSave(projectId)
    },
    getAnswers(projectId) {
      return get().cache[projectId]?.answers as Record<string, unknown> | undefined
    }
  }
})
