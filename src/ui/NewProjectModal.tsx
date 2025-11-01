import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { t } from '@/i18n'
import { getSupabase } from '@/auth/supabase'

type NewProjectModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (_name: string) => Promise<void>
  submitting?: boolean
}

export default function NewProjectModal({ open, onClose, onSubmit, submitting = false }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [internalSubmitting, setInternalSubmitting] = useState(false)
  const [loggedIn, setLoggedIn] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setName('')
      setError(null)
      setInternalSubmitting(false)
      setLoggedIn(true)
      return
    }

    let mounted = true
    let focusId: number | undefined
    if (typeof window === 'undefined') {
      inputRef.current?.focus()
    } else {
      focusId = window.setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }

    ;(async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) {
          if (mounted) setLoggedIn(true)
          return
        }
        const { data } = await supabase.auth.getSession()
        if (mounted) {
          setLoggedIn(Boolean(data?.session?.user))
        }
      } catch {
        if (mounted) {
          setLoggedIn(false)
        }
      }
    })()

    return () => {
      mounted = false
      if (typeof window !== 'undefined' && typeof focusId === 'number') {
        window.clearTimeout(focusId)
      }
    }
  }, [open])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
    if (error && event.target.value.trim()) {
      setError(null)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError(t('dashboard.modal.required', 'Please enter a product name.'))
      return
    }
    if (internalSubmitting || submitting || !loggedIn) return
    setError(null)
    setInternalSubmitting(true)
    try {
      await onSubmit(trimmed)
      setName('')
    } catch (err) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message
      setError(message ?? 'Unexpected error. Please try again.')
    } finally {
      setInternalSubmitting(false)
    }
  }

  if (!open) return null

  const isValid = name.trim().length >= 2
  const isBusy = submitting || internalSubmitting

  return (
    <div className="modal-backdrop">
      <div className="modal card" role="dialog" aria-modal="true">
        <form onSubmit={handleSubmit} className="stack">
          <h2>{t('dashboard.modal.title', 'Create a new product')}</h2>
          <p className="muted">{t('dashboard.modal.subtitle', 'Name your product to start the compliance wizard.')}</p>
          <label className="stack">
            <span className="muted">{t('dashboard.modal.name', 'Product name')}</span>
            <input
              ref={inputRef}
              value={name}
              onChange={handleChange}
              required
              placeholder={t('dashboard.modal.namePlaceholder', 'My great product')}
            />
          </label>
          {!loggedIn ? (
            <p className="error" role="alert">
              {t(
                'dashboard.modal.signedOutHint',
                'You are signed out. Please sign in again to create a product.'
              )}
            </p>
          ) : null}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost" type="button" onClick={onClose} disabled={isBusy}>
              {t('dashboard.modal.cancel', 'Cancel')}
            </button>
            <button className="btn" type="submit" disabled={!isValid || isBusy || !loggedIn}>
              {isBusy
                ? t('dashboard.modal.creating', 'Creating…')
                : t('dashboard.modal.create', 'Create product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
