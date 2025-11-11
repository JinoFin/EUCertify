import { create } from 'zustand'
import { assertSupabase } from '@/auth/supabase'

type Doc = {
  id: string
  project_id: string
  kind: string
  title: string
  status: string
  content: string | null
  created_at: string
  updated_at: string
}

type CreateDraftInput = {
  projectId: string
  kind: string
  title: string
}

type DocumentsState = {
  docs: Doc[]
  fetch: (projectId: string) => Promise<void>
  createDraft: (input: CreateDraftInput) => Promise<string>
  saveContent: (id: string, content: string) => Promise<void>
  saveFinalDoC: (projectId: string, html: string, title: string) => Promise<string>
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

  createDraft: async ({ projectId, kind, title }) => {
    try {
      const sb = assertSupabase()
      const now = new Date().toISOString()
      const { data, error } = await sb
        .from('documents')
        .insert({
          project_id: projectId,
          kind,
          title,
          status: 'draft',
          content: null,
          created_at: now,
          updated_at: now
        })
        .select('*')
        .single()

      if (error) throw error
      const doc = data as Doc
      set({ docs: [doc, ...get().docs.filter(existing => existing.id !== doc.id)] })
      return doc.id
    } catch (error) {
      console.error('Failed to create draft document', error)
      throw error
    }
  },

  saveContent: async (id, content) => {
    try {
      const sb = assertSupabase()
      const updatedAt = new Date().toISOString()
      const { error } = await sb
        .from('documents')
        .update({ content, updated_at: updatedAt })
        .eq('id', id)

      if (error) throw error
      set({
        docs: get().docs.map(doc =>
          doc.id === id ? { ...doc, content, updated_at: updatedAt } : doc
        )
      })
    } catch (error) {
      console.error('Failed to save document content', error)
      throw error
    }
  },

  saveFinalDoC: async (projectId, html, title) => {
    try {
      const sb = assertSupabase()
      const now = new Date().toISOString()
      const { data, error } = await sb
        .from('documents')
        .insert({
          project_id: projectId,
          kind: 'doc_eu_declaration',
          title,
          content: html,
          status: 'ready',
          created_at: now,
          updated_at: now
        })
        .select('*')
        .single()

      if (error) throw error
      const doc = data as Doc
      set({ docs: [doc, ...get().docs.filter(existing => existing.id !== doc.id)] })
      return doc.id
    } catch (error) {
      console.error('Failed to save final document', error)
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
