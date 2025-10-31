import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/auth/supabase'

type AuthUser = {
  id: string
  email: string
}

type AuthState = {
  user: AuthUser | null
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initSession: () => Promise<void>
}

const toAuthUser = (user: { id: string; email?: string | null } | null): AuthUser | null => {
  if (!user) return null
  return { id: user.id, email: user.email ?? '' }
}

let listening = false

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
    set({ user: toAuthUser(data.user) })
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    set({ user: null })
  },
  initSession: async () => {
    if (useAuth.getState().initialized) return
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Failed to load session', error)
      }
      set({ user: toAuthUser(data.session?.user ?? null), initialized: true })
    } catch (err) {
      console.error('Failed to initialize auth session', err)
      set({ initialized: true })
    }
    if (!listening) {
      listening = true
      supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null })
          return
        }
        set({ user: toAuthUser(session?.user ?? null) })
      })
    }
  }
}))
