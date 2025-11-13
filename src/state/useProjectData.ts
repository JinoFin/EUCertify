import { create } from 'zustand'
import { getSupabase } from '@/auth/supabase'
import type { Tag } from '@/wizard/schema'

export type ProjectData = {
  answers: Record<string, unknown>
  derivedTags: Tag[]
  lawOverrides?: string[]
  standardOverrides?: string[]
}

type State = {
  cache: Record<string, ProjectData>
  loading: Record<string, boolean>
  savingAnswers: Record<string, boolean>
  load: (projectId: string) => Promise<ProjectData>
  getCached: (projectId: string) => ProjectData | undefined
  saveAnswers: (projectId: string, answers: Record<string, unknown>) => Promise<void>
  saveDerivedTags: (projectId: string, tags: Tag[], opts?: { markComplete?: boolean }) => Promise<void>
  setLawOverrides: (projectId: string, laws: string[]) => Promise<void>
  setStandardOverrides: (projectId: string, standards: string[]) => Promise<void>
  isSavingAnswers: (projectId: string) => boolean
}

type ProjectAnswersRow = {
  answers?: Record<string, unknown> | null
  tags?: string[] | null
}

type ProjectSettingsRow = {
  legislation_ids?: string[] | null
  standard_codes?: string[] | null
}

const ensureProjectData = (input?: Partial<ProjectData>): ProjectData => ({
  answers: input?.answers ?? {},
  derivedTags: Array.isArray(input?.derivedTags)
    ? (input.derivedTags.filter((tag): tag is Tag => typeof tag === 'string') as Tag[])
    : [],
  lawOverrides: input?.lawOverrides?.filter(item => typeof item === 'string' && item.trim().length > 0),
  standardOverrides: input?.standardOverrides?.filter(item => typeof item === 'string' && item.trim().length > 0)
})

const uniqueStrings = (values?: (string | null)[] | null): string[] => {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0)))
}

const debouncedTimers = new Map<string, ReturnType<typeof setTimeout>>()

const schedulePersist = (projectId: string, persist: () => Promise<void>) => {
  const current = debouncedTimers.get(projectId)
  if (current) {
    clearTimeout(current)
  }
  const timer = setTimeout(() => {
    debouncedTimers.delete(projectId)
    void persist()
  }, 500)
  debouncedTimers.set(projectId, timer)
}

async function persistAnswers(projectId: string, answers: Record<string, unknown>) {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    await supabase
      .from('project_answers')
      .upsert(
        { project_id: projectId, answers, updated_at: new Date().toISOString() },
        { onConflict: 'project_id' }
      )
  } catch (error) {
    console.error('Failed to persist answers', error)
  }
}

async function persistSettings(
  projectId: string,
  patch: Partial<{ legislation_ids: string[]; standard_codes: string[] }>
) {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    await supabase
      .from('project_settings')
      .upsert(
        {
          project_id: projectId,
          updated_at: new Date().toISOString(),
          ...patch
        },
        { onConflict: 'project_id' }
      )
  } catch (error) {
    console.error('Failed to persist project settings', error)
  }
}

export const useProjectData = create<State>((set, get) => ({
  cache: {},
  loading: {},
  savingAnswers: {},

  async load(projectId) {
    if (!projectId) {
      throw new Error('projectId is required')
    }
    const cached = get().cache[projectId]
    if (cached) return cached

    set(state => ({ loading: { ...state.loading, [projectId]: true } }))

    const supabase = getSupabase()
    if (!supabase) {
      const fallback = ensureProjectData()
      set(state => ({
        cache: { ...state.cache, [projectId]: fallback },
        loading: { ...state.loading, [projectId]: false }
      }))
      return fallback
    }

    try {
      const [{ data: answersRow, error: answersError }, { data: settingsRow, error: settingsError }] =
        await Promise.all([
          supabase
            .from('project_answers')
            .select('answers,tags')
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
        console.error('Failed to load project settings', settingsError)
      }

      const answers = ((answersRow as ProjectAnswersRow | null)?.answers ?? {}) as Record<string, unknown>
      const tags = uniqueStrings((answersRow as ProjectAnswersRow | null)?.tags ?? []) as Tag[]
      const lawOverrides = uniqueStrings((settingsRow as ProjectSettingsRow | null)?.legislation_ids ?? [])
      const standardOverrides = uniqueStrings((settingsRow as ProjectSettingsRow | null)?.standard_codes ?? [])

      const next = ensureProjectData({ answers, derivedTags: tags as Tag[], lawOverrides, standardOverrides })
      set(state => ({
        cache: { ...state.cache, [projectId]: next },
        loading: { ...state.loading, [projectId]: false }
      }))
      return next
    } catch (error) {
      console.error('Failed to load project data', error)
      const fallback = ensureProjectData()
      set(state => ({
        cache: { ...state.cache, [projectId]: fallback },
        loading: { ...state.loading, [projectId]: false }
      }))
      return fallback
    }
  },

  getCached(projectId) {
    return get().cache[projectId]
  },

  async saveAnswers(projectId, answers) {
    set(state => ({
      cache: {
        ...state.cache,
        [projectId]: ensureProjectData({ ...state.cache[projectId], answers })
      },
      savingAnswers: { ...state.savingAnswers, [projectId]: true }
    }))

    schedulePersist(projectId, async () => {
      await persistAnswers(projectId, answers)
      set(state => ({
        savingAnswers: { ...state.savingAnswers, [projectId]: false }
      }))
    })
  },

  async saveDerivedTags(projectId, tags, opts) {
    const unique = Array.from(new Set(tags)) as Tag[]
    set(state => ({
      cache: {
        ...state.cache,
        [projectId]: ensureProjectData({ ...state.cache[projectId], derivedTags: unique })
      }
    }))

    const supabase = getSupabase()
    if (!supabase) return
    try {
      await supabase
        .from('project_answers')
        .upsert(
          {
            project_id: projectId,
            tags: unique,
            ...(opts?.markComplete ? { is_complete: true } : {}),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'project_id' }
        )
    } catch (error) {
      console.error('Failed to persist derived tags', error)
    }
  },

  async setLawOverrides(projectId, laws) {
    const normalized = uniqueStrings(laws)
    set(state => ({
      cache: {
        ...state.cache,
        [projectId]: ensureProjectData({ ...state.cache[projectId], lawOverrides: normalized })
      }
    }))
    await persistSettings(projectId, { legislation_ids: normalized })
  },

  async setStandardOverrides(projectId, standards) {
    const normalized = uniqueStrings(standards)
    set(state => ({
      cache: {
        ...state.cache,
        [projectId]: ensureProjectData({ ...state.cache[projectId], standardOverrides: normalized })
      }
    }))
    await persistSettings(projectId, { standard_codes: normalized })
  },

  isSavingAnswers(projectId) {
    return Boolean(get().savingAnswers[projectId])
  }
}))
