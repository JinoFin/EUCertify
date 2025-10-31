import { create } from 'zustand'
import localforage from 'localforage'
import { getSupabase } from '@/auth/supabase'
import { useAuth } from '@/state/useAuth'
import type { AnswerMap } from '@/domain/types'
import type { DocInstance, SelectionBlock } from '@/docs/types'

const SELECTION_STORAGE_KEY = 'eucertify:resultsSelections'

type ProjectRow = {
  id: string
  name: string
}

export type Project = {
  id: string
  name: string
}

type ProjectsState = {
  projects: Project[]
  selectedProjectId: string | null
  answersByProject: Record<string, AnswerMap>
  packsByProject: Record<string, DocInstance[] | undefined>
  selectionsByProject: Record<string, SelectionBlock | undefined>
  loading: boolean
  load: () => Promise<void>
  create: (name: string) => Promise<Project | null>
  select: (id: string | null) => void
  saveAnswers: (projectId: string, answers: AnswerMap) => Promise<void>
  loadAnswers: (projectId: string) => Promise<AnswerMap>
  storePack: (projectId: string, _productId: string, pack: DocInstance[]) => void
  setResultsSelection: (projectId: string, _productId: string, selection: SelectionBlock) => void
}

const useProjectsBase = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  answersByProject: {},
  packsByProject: {},
  selectionsByProject: {},
  loading: false,
  load: async () => {
    if (get().loading) return
    const user = useAuth.getState().user
    if (!user) {
      set({ projects: [], selectedProjectId: null, loading: false })
      return
    }
    if (get().projects.length) return
    set({ loading: true })
    const supabase = getSupabase()
    if (!supabase) {
      console.warn('Missing Supabase env; skipping remote project load.')
      set({ projects: [], selectedProjectId: null, loading: false })
      return
    }
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to load projects', error)
      set({ loading: false })
      return
    }

    const rows = (data ?? []) as ProjectRow[]
    const projects = rows.map(project => ({ id: project.id, name: project.name }))
    set(state => ({
      projects,
      loading: false,
      selectedProjectId:
        state.selectedProjectId && projects.some(project => project.id === state.selectedProjectId)
          ? state.selectedProjectId
          : projects[0]?.id ?? null
    }))
  },
  create: async (name: string) => {
    const user = useAuth.getState().user
    if (!user) return null
    const supabase = getSupabase()
    if (!supabase) {
      console.warn('Missing Supabase env; cannot create project.')
      return null
    }
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, user_id: user.id })
      .select('id, name')
      .single()

    if (error) {
      console.error('Failed to create project', error)
      return null
    }

    const row = data as ProjectRow
    const project = { id: row.id, name: row.name }
    set(state => ({
      projects: [...state.projects, project],
      selectedProjectId: project.id
    }))
    return project
  },
  select: id => {
    set({ selectedProjectId: id })
  },
  saveAnswers: async (projectId, answers) => {
    const supabase = getSupabase()
    if (supabase) {
      const payload = { project_id: projectId, answers }
      const { error } = await supabase.from('project_answers').upsert(payload, {
        onConflict: 'project_id'
      })
      if (error) {
        console.error('Failed to save answers', error)
      }
    } else {
      console.warn('Missing Supabase env; answers stored locally only.')
    }
    set(state => ({
      answersByProject: { ...state.answersByProject, [projectId]: answers }
    }))
  },
  loadAnswers: async projectId => {
    const cached = get().answersByProject[projectId]
    if (cached) return cached
    const supabase = getSupabase()
    if (!supabase) {
      console.warn('Missing Supabase env; returning empty answers.')
      return {}
    }
    const { data, error } = await supabase
      .from('project_answers')
      .select('answers')
      .eq('project_id', projectId)
      .maybeSingle()

    if (error) {
      console.error('Failed to load answers', error)
      return {}
    }

    const answers = ((data as { answers?: AnswerMap } | null)?.answers ?? {}) as AnswerMap
    set(state => ({
      answersByProject: { ...state.answersByProject, [projectId]: answers }
    }))
    return answers
  },
  storePack: (projectId, _productId, pack) => {
    set(state => ({
      packsByProject: { ...state.packsByProject, [projectId]: pack }
    }))
  },
  setResultsSelection: (projectId, _productId, selection) => {
    set(state => {
      const next = { ...state.selectionsByProject, [projectId]: selection }
      if (typeof window !== 'undefined') {
        void localforage.setItem(SELECTION_STORAGE_KEY, next).catch(error => {
          console.warn('Failed to persist selections', error)
        })
      }
      return { selectionsByProject: next }
    })
  }
}))

if (typeof window !== 'undefined') {
  void localforage
    .getItem<Record<string, SelectionBlock>>(SELECTION_STORAGE_KEY)
    .then(stored => {
      if (stored) {
        useProjectsBase.setState(state => ({
          selectionsByProject: { ...state.selectionsByProject, ...stored }
        }))
      }
    })
    .catch(error => {
      console.warn('Failed to hydrate stored selections', error)
    })
}

export const useProjects = useProjectsBase as typeof useProjectsBase & {
  current: () => Project | null
}

useProjects.current = () => {
  const state = useProjects.getState()
  if (!state.selectedProjectId) return null
  return state.projects.find(project => project.id === state.selectedProjectId) ?? null
}

export const selectProjectById = (state: ProjectsState, projectId: string) =>
  state.projects.find(project => project.id === projectId) ?? null

export const selectAnswersByProjectId = (state: ProjectsState, projectId: string) =>
  state.answersByProject[projectId] ?? {}

export const selectPackByProjectId = (state: ProjectsState, projectId: string) =>
  state.packsByProject[projectId]

export const selectSelectionByProjectId = (state: ProjectsState, projectId: string) =>
  state.selectionsByProject[projectId]
