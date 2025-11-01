import { create } from 'zustand'
import { assertSupabase } from '@/auth/supabase'

type Doc = {
  id: string
  project_id: string
  kind: string
  title: string
  status: string
  payload: any
  created_at: string
  updated_at: string
}

type DocumentsState = {
  docs: Doc[]
  fetch: (projectId: string) => Promise<void>
  createDraft: (
    projectId: string,
    kind: string,
    title: string,
    payload: any
  ) => Promise<Doc>
  remove: (id: string) => Promise<void>
}

export const useDocuments = create<DocumentsState>((set, get) => ({
  docs: [],

  fetch: async projectId => {
    if (!projectId) {
      set({ docs: [] })
      return
    }

    try {
      const sb = assertSupabase()
      const { data, error } = await sb
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ docs: (data ?? []) as Doc[] })
    } catch (error) {
      console.error('Failed to fetch documents', error)
      set({ docs: [] })
      throw error
    }
  },

  createDraft: async (projectId, kind, title, payload) => {
    try {
      const sb = assertSupabase()
      const { data, error } = await sb
        .from('documents')
        .insert({ project_id: projectId, kind, title, payload, status: 'draft' })
        .select('*')
        .single()

      if (error) throw error
      const doc = data as Doc
      set({ docs: [doc, ...get().docs] })
      return doc
    } catch (error) {
      console.error('Failed to create draft document', error)
      throw error
    }
  },

  remove: async id => {
    try {
      const sb = assertSupabase()
      await sb.from('documents').delete().eq('id', id)
      set({ docs: get().docs.filter(doc => doc.id !== id) })
    } catch (error) {
      console.error('Failed to remove document', error)
      throw error
    }
  }
}))
