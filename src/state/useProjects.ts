import { create } from 'zustand'
import localforage from 'localforage'
import { nanoid } from 'nanoid'
import { getSupabase, hasSupabaseEnv } from '@/auth/supabase'
import { useAuth } from '@/state/useAuth'
import type { AnswerMap } from '@/domain/types'
import type { DocInstance, SelectionBlock } from '@/docs/types'
import { useProjectData } from '@/state/useProjectData'
import { normalizeName, supaErrorToMessage } from '@/utils/supaErrors'

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
  list: Project[]
  projects: Project[]
  selectedProjectId: string | null
  answersByProject: Record<string, AnswerMap>
  packsByProject: Record<string, DocInstance[] | undefined>
  selectionsByProject: Record<string, SelectionBlock | undefined>
  loading: boolean
  load: (options?: { force?: boolean }) => Promise<void>
  create: (name: string) => Promise<Project>
  remove: (projectId: string) => Promise<void>
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
  list: [],
  projects: [],
  selectedProjectId: null,
  answersByProject: {},
  packsByProject: {},
  selectionsByProject: {},
  loading: false,
  load: async options => {
    const force = options?.force ?? false
    if (get().loading) return
    if (!force && get().list.length) return
    set({ loading: true })
    const user = useAuth.getState().user
    const supabase = getSupabase()
    if (supabase) {
      if (!user) {
        set({ list: [], projects: [], selectedProjectId: null, loading: false })
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
        list: projects,
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
      list: projects,
      projects,
      loading: false,
      selectedProjectId:
        state.selectedProjectId && projects.some(project => project.id === state.selectedProjectId)
          ? state.selectedProjectId
          : projects[0]?.id ?? null
    }))
  },
  create: async rawName => {
    const supabase = getSupabase()
    const name = normalizeName(rawName)
    if (!name) {
      throw new Error('Please enter a product name.')
    }

    const userState = useAuth.getState().user
    let project: Project

    if (supabase) {
      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (userErr) {
        throw new Error(supaErrorToMessage(userErr))
      }
      const user = userRes?.user ?? userState
      if (!user) {
        throw new Error('You are not signed in. Please sign in again.')
      }
      const { data, error } = await supabase
        .from('projects')
        .insert({ name, user_id: user.id })
        .select('id, name, created_at')
        .single()
      if (error) {
        throw new Error(supaErrorToMessage(error))
      }
      const created = (data ?? {}) as ProjectRow
      project = {
        id: created.id,
        name: created.name,
        createdAt: created.created_at ?? new Date().toISOString()
      }
    } else {
      project = {
        id: nanoid(),
        name,
        createdAt: new Date().toISOString()
      }
    }

    set(state => {
      const exists = state.list.some(item => item.id === project.id)
      const list = exists ? state.list.map(item => (item.id === project.id ? project : item)) : [...state.list, project]
      if (!hasSupabaseEnv()) {
        persistProjectsToLocalStorage(list)
      }
      return {
        list,
        projects: list,
        selectedProjectId: project.id
      }
    })

    return project
  },
  remove: async projectId => {
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.from('projects').delete().eq('id', projectId)
      if (error) {
        throw error
      }
    }

    set(state => {
      const list = state.list.filter(project => project.id !== projectId)
      const answersByProject = { ...state.answersByProject }
      const packsByProject = { ...state.packsByProject }
      const selectionsByProject = { ...state.selectionsByProject }
      delete answersByProject[projectId]
      delete packsByProject[projectId]
      delete selectionsByProject[projectId]
      if (!hasSupabaseEnv()) {
        persistProjectsToLocalStorage(list)
      }
      const selectedProjectId =
        state.selectedProjectId === projectId ? list[0]?.id ?? null : state.selectedProjectId
      return {
        list,
        projects: list,
        answersByProject,
        packsByProject,
        selectionsByProject,
        selectedProjectId
      }
    })

    if (supabase) {
      await get().load({ force: true })
    }
  },
  select: id => {
    set({ selectedProjectId: id })
  },
  saveAnswers: async (projectId, answers) => {
    await useProjectData.getState().saveAnswers(projectId, answers)
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
  return state.list.find(project => project.id === state.selectedProjectId) ?? null
}

export const selectProjectById = (state: ProjectsState, projectId: string) =>
  state.list.find(project => project.id === projectId) ?? null

export const selectAnswersByProjectId = (state: ProjectsState, projectId: string) =>
  state.answersByProject[projectId] ?? {}

export const selectPackByProjectId = (state: ProjectsState, projectId: string) =>
  state.packsByProject[projectId]

export const selectSelectionByProjectId = (state: ProjectsState, projectId: string) =>
  state.selectionsByProject[projectId]
