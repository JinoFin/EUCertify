import { create } from 'zustand'
import { assertSupabase } from '@/auth/supabase'

export interface Profile {
  id: string
  company_name: string
  address_text: string | null
  created_at: string
}

interface State {
  items: Profile[]
  fetch: () => Promise<void>
  create: (name: string, address: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useProfiles = create<State>((set, get) => ({
  items: [],
  fetch: async () => {
    try {
      const sb = assertSupabase()
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ items: (data ?? []) as Profile[] })
    } catch (error) {
      console.error('Failed to fetch profiles', error)
      set({ items: [] })
      throw error
    }
  },
  create: async (name, address) => {
    try {
      const sb = assertSupabase()
      const { error } = await sb
        .from('profiles')
        .insert({ company_name: name, address_text: address })

      if (error) throw error
      await get().fetch()
    } catch (error) {
      console.error('Failed to create profile', error)
      throw error
    }
  },
  remove: async id => {
    try {
      const sb = assertSupabase()
      const { error } = await sb.from('profiles').delete().eq('id', id)
      if (error) throw error
      await get().fetch()
    } catch (error) {
      console.error('Failed to remove profile', error)
      throw error
    }
  }
}))
