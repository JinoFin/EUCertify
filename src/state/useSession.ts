import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnswerMap } from '@/domain/types'
import type { DocInstance } from '@/docs/types'

export type SessionUser = {
  id: string
  email: string
  name: string
}

export type SessionProduct = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  answers: AnswerMap
  lastVisited?: string
  lastPack?: DocInstance[]
}

export type SessionProject = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  products: SessionProduct[]
}

type SessionState = {
  user: SessionUser | null
  projects: SessionProject[]
  activeProjectId: string | null
  activeProductId: string | null
  onboardingSeen: boolean
  login: (payload: { email: string; name?: string }) => void
  logout: () => void
  markOnboardingSeen: () => void
  ensureStarterProject: () => void
  createProject: (name: string) => SessionProject
  renameProject: (projectId: string, name: string) => void
  deleteProject: (projectId: string) => void
  createProduct: (projectId: string, name: string) => SessionProduct | null
  renameProduct: (projectId: string, productId: string, name: string) => void
  deleteProduct: (projectId: string, productId: string) => void
  setActiveProject: (projectId: string | null) => void
  setActiveProduct: (projectId: string, productId: string | null) => void
  updateProductAnswers: (projectId: string, productId: string, answers: AnswerMap) => void
  storePack: (projectId: string, productId: string, pack: DocInstance[]) => void
}

const generateId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id_${Math.random().toString(36).slice(2, 10)}`)

const stamp = () => new Date().toISOString()

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      projects: [],
      activeProjectId: null,
      activeProductId: null,
      onboardingSeen: false,
      login: ({ email, name }) => {
        const id = generateId()
        set({ user: { id, email, name: name || email.split('@')[0] || 'User' } })
      },
      logout: () => set({ user: null, activeProjectId: null, activeProductId: null }),
      markOnboardingSeen: () => set({ onboardingSeen: true }),
      ensureStarterProject: () => {
        const state = get()
        if (state.projects.length > 0) return
        const projectId = generateId()
        const productId = generateId()
        const now = stamp()
        const starter: SessionProject = {
          id: projectId,
          name: 'My First Project',
          createdAt: now,
          updatedAt: now,
          products: [
            {
              id: productId,
              name: 'Bluetooth Speaker',
              createdAt: now,
              updatedAt: now,
              answers: {},
            }
          ]
        }
        set({
          projects: [starter],
          activeProjectId: projectId,
          activeProductId: productId,
        })
      },
      createProject: (name: string) => {
        const id = generateId()
        const now = stamp()
        const project: SessionProject = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          products: []
        }
        set(state => ({
          projects: [...state.projects, project],
          activeProjectId: id,
          activeProductId: null
        }))
        return project
      },
      renameProject: (projectId, name) => {
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? { ...project, name, updatedAt: stamp() }
              : project
          )
        }))
      },
      deleteProject: projectId => {
        set(state => {
          const projects = state.projects.filter(project => project.id !== projectId)
          const activeProjectId = state.activeProjectId === projectId ? (projects[0]?.id ?? null) : state.activeProjectId
          const activeProductId = state.activeProjectId === projectId ? (projects[0]?.products[0]?.id ?? null) : state.activeProductId
          return { projects, activeProjectId, activeProductId }
        })
      },
      createProduct: (projectId, name) => {
        const state = get()
        const project = state.projects.find(item => item.id === projectId)
        if (!project) return null
        const now = stamp()
        const product: SessionProduct = {
          id: generateId(),
          name,
          createdAt: now,
          updatedAt: now,
          answers: {}
        }
        set({
          projects: state.projects.map(item =>
            item.id === projectId
              ? { ...item, products: [...item.products, product], updatedAt: stamp() }
              : item
          ),
          activeProjectId: projectId,
          activeProductId: product.id
        })
        return product
      },
      renameProduct: (projectId, productId, name) => {
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  updatedAt: stamp(),
                  products: project.products.map(product =>
                    product.id === productId
                      ? { ...product, name, updatedAt: stamp() }
                      : product
                  )
                }
              : project
          )
        }))
      },
      deleteProduct: (projectId, productId) => {
        set(state => {
          const projects = state.projects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  updatedAt: stamp(),
                  products: project.products.filter(product => product.id !== productId)
                }
              : project
          )
          const activeProjectId = state.activeProjectId
          let activeProductId = state.activeProductId
          if (activeProjectId === projectId && activeProductId === productId) {
            const nextProject = projects.find(p => p.id === projectId)
            activeProductId = nextProject?.products[0]?.id ?? null
          }
          return { projects, activeProductId }
        })
      },
      setActiveProject: projectId => {
        set(state => {
          const project = projectId ? state.projects.find(item => item.id === projectId) : null
          const activeProductId = project?.products[0]?.id ?? null
          return {
            activeProjectId: projectId,
            activeProductId
          }
        })
      },
      setActiveProduct: (projectId, productId) => {
        set({ activeProjectId: projectId, activeProductId: productId })
      },
      updateProductAnswers: (projectId, productId, answers) => {
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  updatedAt: stamp(),
                  products: project.products.map(product =>
                    product.id === productId
                      ? { ...product, answers, updatedAt: stamp() }
                      : product
                  )
                }
              : project
          )
        }))
      },
      storePack: (projectId, productId, pack) => {
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  products: project.products.map(product =>
                    product.id === productId
                      ? { ...product, lastPack: pack ?? [], updatedAt: stamp() }
                      : product
                  )
                }
              : project
          )
        }))
      }
    }),
    {
      name: 'eucertify:session',
      partialize: state => ({
        user: state.user,
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        activeProductId: state.activeProductId,
        onboardingSeen: state.onboardingSeen
      })
    }
  )
)

export const selectActiveProject = (state: SessionState) =>
  state.projects.find(project => project.id === state.activeProjectId) ?? null

export const selectActiveProduct = (state: SessionState) => {
  const project = selectActiveProject(state)
  if (!project) return null
  return project.products.find(product => product.id === state.activeProductId) ?? null
}

export const selectProjectById = (state: SessionState, projectId: string) =>
  state.projects.find(project => project.id === projectId) ?? null

export const selectProductById = (state: SessionState, projectId: string, productId: string) => {
  const project = selectProjectById(state, projectId)
  if (!project) return null
  return project.products.find(product => product.id === productId) ?? null
}
