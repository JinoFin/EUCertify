import { create } from 'zustand'
import localforage from 'localforage'
import { getSupabase, hasSupabaseEnv } from '@/auth/supabase'
import { useAuth } from '@/state/useAuth'
import type { AnswerMap } from '@/domain/types'
import type { DocInstance, SelectionBlock } from '@/docs/types'
import { deriveTagsFromAnswers } from '@/domain/tags'
import { useProjectData } from '@/state/useProjectData'

const SELECTION_STORAGE_KEY = 'eucertify:resultsSelections'
const PROJECTS_STORAGE_KEY = 'eucertify:projects'

type ProjectRow = {
  id: string
  name: string
  created_at?: string | null
}

export type Project = {
  id: string
  name: string
  createdAt: string
}

type ProjectsState = {
  projects: Project[]
  selectedProjectId: string | null
  answersByProject: Record<string, AnswerMap>
  packsByProject: Record<string, DocInstance[] | undefined>
  selectionsByProject: Record<string, SelectionBlock | undefined>
  loading: boolean
  load: () => Promise<void>
  addProject: (project: Project) => void
  select: (id: string | null) => void
  saveAnswers: (projectId: string, answers: AnswerMap) => Promise<void>
  loadAnswers: (projectId: string) => Promise<AnswerMap>
  storePack: (projectId: string, _productId: string, pack: DocInstance[]) => void
  setResultsSelection: (projectId: string, _productId: string, selection: SelectionBlock) => void
}

const readProjectsFromLocalStorage = (): Project[] => {
  if (typeof window === 'undefined') return []
  const stored = window.localStorage.getItem(PROJECTS_STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(item => {
        const candidate = item as Partial<Project>
        if (!candidate || typeof candidate.id !== 'string' || typeof candidate.name !== 'string') {
          return null
        }
        const createdAt = typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString()
        return {
          id: candidate.id,
          name: candidate.name,
          createdAt
        }
      })
      .filter((project): project is Project => Boolean(project))
  } catch (error) {
    console.warn('Failed to parse stored projects', error)
    return []
  }
}

const persistProjectsToLocalStorage = (projects: Project[]) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
  } catch (error) {
    console.warn('Failed to persist projects locally', error)
  }
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
    if (get().projects.length) return
    set({ loading: true })
    const user = useAuth.getState().user
    const supabase = getSupabase()
    if (supabase) {
      if (!user) {
        set({ projects: [], selectedProjectId: null, loading: false })
        return
      }
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Failed to load projects', error)
        set({ loading: false })
        return
      }

      const rows = (data ?? []) as ProjectRow[]
      const projects = rows.map(project => ({
        id: project.id,
        name: project.name,
        createdAt: project.created_at ?? new Date().toISOString()
      }))
      set(state => ({
        projects,
        loading: false,
        selectedProjectId:
          state.selectedProjectId && projects.some(project => project.id === state.selectedProjectId)
            ? state.selectedProjectId
            : projects[0]?.id ?? null
      }))
      return
    }

    const projects = readProjectsFromLocalStorage()
    set(state => ({
      projects,
      loading: false,
      selectedProjectId:
        state.selectedProjectId && projects.some(project => project.id === state.selectedProjectId)
          ? state.selectedProjectId
          : projects[0]?.id ?? null
    }))
  },
  addProject: project => {
    set(state => {
      const exists = state.projects.some(item => item.id === project.id)
      const projects = exists
        ? state.projects.map(item => (item.id === project.id ? project : item))
        : [...state.projects, project]
      if (!hasSupabaseEnv()) {
        persistProjectsToLocalStorage(projects)
      }
      return {
        projects,
        selectedProjectId: project.id
      }
    })
  },
  select: id => {
    set({ selectedProjectId: id })
  },
  saveAnswers: async (projectId, answers) => {
    const tags = deriveTagsFromAnswers(answers)
    await useProjectData.getState().saveAnswersAndTags(projectId, answers, tags)
    set(state => ({
      answersByProject: { ...state.answersByProject, [projectId]: answers }
    }))
  },
  loadAnswers: async projectId => {
    await useProjectData.getState().load(projectId)
    const answers = useProjectData.getState().answers ?? {}
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
