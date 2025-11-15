import { create } from 'zustand'
import { getSupabase } from '@/auth/supabase'

export type ProductRecord = {
  id: string
  name: string
  manufacturer_name?: string | null
  manufacturer_address?: string | null
  declaration_place?: string | null
  signatory_name?: string | null
  signatory_title?: string | null
  signatory_signature?: string | null
  declaration_date?: string | null
  derived_tags?: string[]
  laws?: string[]
  standards?: string[]
}

type ProductState = {
  productId: string | null
  product: ProductRecord | null
  loading: boolean
  error: string | null
  loadProject: (id: string) => Promise<void>
  updateProject: (updates: Partial<ProductRecord>) => Promise<void>
  setLocalFields: (updates: Partial<ProductRecord>) => void
}

const normalizeProduct = (record: Record<string, unknown>): ProductRecord => ({
  id: record.id as string,
  name: (record.name as string) ?? 'Product',
  manufacturer_name: (record.manufacturer_name as string) ?? null,
  manufacturer_address: (record.manufacturer_address as string) ?? null,
  declaration_place: (record.declaration_place as string) ?? null,
  signatory_name: (record.signatory_name as string) ?? null,
  signatory_title: (record.signatory_title as string) ?? null,
  signatory_signature: (record.signatory_signature as string) ?? null,
  declaration_date: (record.declaration_date as string) ?? null,
  derived_tags: Array.isArray(record.derived_tags)
    ? (record.derived_tags as string[])
    : [],
  laws: Array.isArray(record.laws) ? (record.laws as string[]) : [],
  standards: Array.isArray(record.standards) ? (record.standards as string[]) : []
})

export const useProductStore = create<ProductState>((set, get) => ({
  productId: null,
  product: null,
  loading: false,
  error: null,
  loadProject: async id => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error('Supabase client is not configured')
      }
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) {
        throw error ?? new Error('Project not found')
      }
      set({
        productId: id,
        product: normalizeProduct(data as Record<string, unknown>),
        loading: false
      })
    } catch (error) {
      console.error('Failed to load project', error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load project'
      })
    }
  },
  updateProject: async updates => {
    const { productId, product } = get()
    if (!productId) return
    const nextDeclarationDate = updates.declaration_date
      ? new Date(updates.declaration_date).toISOString().slice(0, 10)
      : undefined
    set({
      product: product ? { ...product, ...updates } : product
    })
    const supabase = getSupabase()
    if (!supabase) {
      console.warn('Supabase client missing; local state updated only')
      return
    }
    const payload = {
      ...updates,
      declaration_date: nextDeclarationDate
    }
    try {
      const { error } = await supabase.from('projects').update(payload).eq('id', productId)
      if (error) throw error
    } catch (error) {
      console.error('Failed to update project', error)
      set({
        error: error instanceof Error ? error.message : 'Unable to save project'
      })
    }
  },
  setLocalFields: updates => {
    set(state => ({
      product: state.product ? { ...state.product, ...updates } : state.product
    }))
  }
}))
