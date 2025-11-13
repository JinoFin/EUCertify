import { create } from 'zustand'
import { assertSupabase } from '@/auth/supabase'

export type Doc = {
  id: string
  project_id: string
  kind: string
  title: string
  status: string
  payload: unknown
  created_at: string
  updated_at: string
}

type DocumentsState = {
  docs: Doc[]
  loadForProject: (projectId: string) => Promise<void>
  addOrUpdate: (doc: Omit<Doc, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<Doc>
  remove: (id: string) => Promise<void>
}

const sortDocs = (docs: Doc[]) =>
  [...docs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

export const useDocuments = create<DocumentsState>((set, get) => ({
  docs: [],

  async loadForProject(projectId) {
    if (!projectId) {
      set({ docs: [] })
      return
    }
    const sb = assertSupabase()
    const { data, error } = await sb
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Failed to load documents', error)
      throw error
    }
    set({ docs: (data ?? []) as Doc[] })
  },

  async addOrUpdate(docInput) {
    const sb = assertSupabase()
    const base = {
      project_id: docInput.project_id,
      kind: docInput.kind,
      title: docInput.title,
      status: docInput.status,
      payload: docInput.payload,
      updated_at: new Date().toISOString()
    }

    let doc: Doc
    if (docInput.id) {
      const { data, error } = await sb
        .from('documents')
        .update(base)
        .eq('id', docInput.id)
        .select('*')
        .single()
      if (error || !data) {
        throw error ?? new Error('Failed to update document')
      }
      doc = data as Doc
    } else {
      const { data, error } = await sb
        .from('documents')
        .insert({ ...base, created_at: new Date().toISOString() })
        .select('*')
        .single()
      if (error || !data) {
        throw error ?? new Error('Failed to insert document')
      }
      doc = data as Doc
    }

    set(state => {
      const others = state.docs.filter(existing => existing.id !== doc.id)
      return { docs: sortDocs([doc, ...others]) }
    })
    return doc
  },

  async remove(id) {
    const sb = assertSupabase()
    const { error } = await sb.from('documents').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete document', error)
      throw error
    }
    set(state => ({ docs: state.docs.filter(doc => doc.id !== id) }))
  }
}))
