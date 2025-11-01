import { create } from 'zustand'
import { getSupabase } from '@/auth/supabase'

export type ProjectDocument = {
  id: string
  project_id: string
  kind: string
  title: string
  payload: Record<string, any> | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type DocumentPatch = Partial<Pick<ProjectDocument, 'title' | 'payload' | 'status'>>

type DocumentsState = {
  documentsByProject: Record<string, ProjectDocument[]>
  list: (projectId: string) => Promise<ProjectDocument[]>
  createDraft: (
    projectId: string,
    kind: string,
    title: string,
    payload: Record<string, any>
  ) => Promise<ProjectDocument | null>
  update: (id: string, patch: DocumentPatch) => Promise<ProjectDocument | null>
  remove: (id: string) => Promise<void>
}

const mapDocument = (row: Partial<ProjectDocument>): ProjectDocument => ({
  id: row.id ?? '',
  project_id: row.project_id ?? '',
  kind: row.kind ?? '',
  title: row.title ?? '',
  payload: (row.payload ?? null) as Record<string, any> | null,
  status: row.status ?? null,
  created_at: row.created_at ?? null,
  updated_at: row.updated_at ?? null
})

export const useDocuments = create<DocumentsState>(set => ({
  documentsByProject: {},

  list: async projectId => {
    const supabase = getSupabase()
    if (!projectId) return []
    if (!supabase) {
      console.warn('Supabase not configured; returning empty documents list.')
      set(state => ({
        documentsByProject: { ...state.documentsByProject, [projectId]: [] }
      }))
      return []
    }

    const { data, error } = await supabase
      .from('documents')
      .select('id, project_id, kind, title, payload, status, created_at, updated_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to load project documents', error)
      return []
    }

    const documents = (data ?? []).map(row => mapDocument(row as Partial<ProjectDocument>))
    set(state => ({
      documentsByProject: { ...state.documentsByProject, [projectId]: documents }
    }))
    return documents
  },

  createDraft: async (projectId, kind, title, payload) => {
    const supabase = getSupabase()
    if (!supabase) {
      console.warn('Supabase not configured; cannot create document drafts.')
      return null
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({ project_id: projectId, kind, title, payload, status: 'draft' })
      .select('id, project_id, kind, title, payload, status, created_at, updated_at')
      .single()

    if (error) {
      console.error('Failed to create document draft', error)
      return null
    }

    const document = mapDocument(data as Partial<ProjectDocument>)
    set(state => {
      const existing = state.documentsByProject[projectId] ?? []
      return {
        documentsByProject: {
          ...state.documentsByProject,
          [projectId]: [...existing, document]
        }
      }
    })
    return document
  },

  update: async (id, patch) => {
    const supabase = getSupabase()
    if (!supabase) {
      console.warn('Supabase not configured; cannot update documents.')
      return null
    }

    const { data, error } = await supabase
      .from('documents')
      .update(patch)
      .eq('id', id)
      .select('id, project_id, kind, title, payload, status, created_at, updated_at')
      .single()

    if (error) {
      console.error('Failed to update document', error)
      return null
    }

    const updated = mapDocument(data as Partial<ProjectDocument>)
    set(state => {
      const projectDocsEntry = Object.entries(state.documentsByProject).find(([, docs]) =>
        docs.some(doc => doc.id === id)
      )
      if (!projectDocsEntry) {
        return state
      }
      const [projectId, docs] = projectDocsEntry
      const nextDocs = docs.map(doc => (doc.id === id ? updated : doc))
      return {
        documentsByProject: {
          ...state.documentsByProject,
          [projectId]: nextDocs
        }
      }
    })
    return updated
  },

  remove: async id => {
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.from('documents').delete().eq('id', id)
      if (error) {
        console.error('Failed to remove document', error)
        return
      }
    } else {
      console.warn('Supabase not configured; removing document from local cache only.')
    }

    set(state => {
      const nextEntries = Object.entries(state.documentsByProject).map(([projectId, docs]) => [
        projectId,
        docs.filter(doc => doc.id !== id)
      ])
      return {
        documentsByProject: Object.fromEntries(nextEntries)
      }
    })
  }
}))
