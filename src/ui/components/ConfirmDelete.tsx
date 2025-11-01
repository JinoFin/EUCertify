import { t } from '@/i18n'

type ConfirmDeleteProps = {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export default function ConfirmDelete({
  open,
  title = t('delete.title', 'Delete product?'),
  message,
  confirmLabel = t('delete.confirm', 'Delete'),
  cancelLabel = t('delete.cancel', 'Cancel'),
  pending = false,
  onCancel,
  onConfirm
}: ConfirmDeleteProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header>
          <h3>{title}</h3>
        </header>
        <p className="muted">{message}</p>
        <footer className="modal-actions">
          <button className="btn ghost" type="button" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </button>
          <button className="btn" type="button" onClick={onConfirm} disabled={pending}>
            {pending ? t('dashboard.project.deleting', 'Deleting…') : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}
