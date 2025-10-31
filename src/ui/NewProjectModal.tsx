import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { t } from '@/i18n'

type NewProjectModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<boolean>
  submitting?: boolean
}

export default function NewProjectModal({ open, onClose, onSubmit, submitting = false }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [internalSubmitting, setInternalSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setName('')
      setError(null)
      setInternalSubmitting(false)
      return
    }

    if (typeof window === 'undefined') {
      inputRef.current?.focus()
      return
    }

    const focusId = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusId)
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
    if (!trimmed) {
      setError(t('dashboard.modal.required', 'Please name the product.'))
      return
    }
    if (internalSubmitting || submitting) return
    setError(null)
    setInternalSubmitting(true)
    try {
      const success = await onSubmit(trimmed)
      if (success) {
        setName('')
      } else {
        setError(t('dashboard.modal.error', 'Could not create product.'))
      }
    } catch (err) {
      console.error('Failed to submit new project', err)
      setError(t('dashboard.modal.error', 'Could not create product.'))
    } finally {
      setInternalSubmitting(false)
    }
  }

  if (!open) return null

  const isValid = name.trim().length > 0
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
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost" type="button" onClick={onClose} disabled={isBusy}>
              {t('dashboard.modal.cancel', 'Cancel')}
            </button>
            <button className="btn" type="submit" disabled={!isValid || isBusy}>
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
