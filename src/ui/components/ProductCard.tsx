import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n'
import type { Project } from '@/state/useProjects'
import { useProjects } from '@/state/useProjects'
import { ChecklistIcon, DocumentsIcon, LockIcon, MoreVerticalIcon, WizardIcon } from '@/ui/icons'

type ProductCardProps = {
  project: Project
  isActive?: boolean
  isComplete?: boolean | null
  statusLoading?: boolean
}

export default function ProductCard({ project, isActive, isComplete, statusLoading }: ProductCardProps) {
  const navigate = useNavigate()
  const select = useProjects(state => state.select)
  const remove = useProjects(state => state.remove)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [menuOpen])

  const docsLocked = statusLoading || isComplete !== true
  const statusLabel = useMemo(() => {
    if (statusLoading) {
      return t('dashboard.project.status.loading', 'Checking status…')
    }
    if (isComplete === true) {
      return t('dashboard.project.status.ready', 'Ready for documents')
    }
    return t('dashboard.project.status.incomplete', 'Questionnaire incomplete')
  }, [isComplete, statusLoading])

  const handleNavigate = (path: string) => {
    select(project.id)
    navigate(path)
  }

  const handleWizard = () => {
    handleNavigate(`/project/${project.id}/wizard`)
  }

  const handleDocuments = () => {
    if (docsLocked || deleting) return
    handleNavigate(`/project/${project.id}/docs`)
  }

  const handleChecklist = () => {
    if (docsLocked || deleting) return
    handleNavigate(`/project/${project.id}/checklist`)
  }

  const handleDelete = async () => {
    setMenuOpen(false)
    if (deleting) return
    const confirmed = window.confirm(
      t('dashboard.project.deleteConfirm', 'Delete {{name}}?').replace('{{name}}', project.name)
    )
    if (!confirmed) {
      return
    }
    setDeleting(true)
    try {
      await remove(project.id)
    } catch (error) {
      console.error('Failed to delete project', error)
      window.alert(t('dashboard.project.deleteError', 'Could not delete this product.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.article
      className={`product-card${isActive ? ' active' : ''}`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className="product-card-info">
        <h3>{project.name}</h3>
        <p className="product-card-status">{statusLabel}</p>
      </div>
      <div className="product-card-meta" ref={menuRef}>
        {docsLocked ? (
          <span
            className="product-card-lock"
            title={t(
              'dashboard.project.lockHint',
              'Finish the questionnaire to unlock document generation.'
            )}
          >
            <LockIcon width={16} height={16} />
            <span>{t('dashboard.project.locked', 'Locked')}</span>
          </span>
        ) : null}
        <div className="product-card-menu">
          <button
            className="product-card-menu-trigger"
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label={t('dashboard.project.menu', 'Product options')}
          >
            <MoreVerticalIcon width={18} height={18} />
          </button>
          {menuOpen ? (
            <div className="product-card-menu-popover" role="menu">
              <button
                type="button"
                role="menuitem"
                className="product-card-menu-item"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? t('dashboard.project.deleting', 'Deleting…')
                  : t('dashboard.project.delete', 'Delete')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="product-card-actions">
        <button
          className="product-card-action"
          type="button"
          onClick={handleWizard}
          disabled={deleting}
        >
          <WizardIcon width={18} height={18} />
          <span>{t('dashboard.project.openWizard', 'Wizard')}</span>
        </button>
        <button
          className="product-card-action"
          type="button"
          onClick={handleDocuments}
          disabled={docsLocked || deleting}
          title={docsLocked ? statusLabel : undefined}
        >
          <DocumentsIcon width={18} height={18} />
          <span>{t('dashboard.project.documents', 'Documents')}</span>
        </button>
        <button
          className="product-card-action"
          type="button"
          onClick={handleChecklist}
          disabled={docsLocked || deleting}
          title={docsLocked ? statusLabel : undefined}
        >
          <ChecklistIcon width={18} height={18} />
          <span>{t('dashboard.project.checklist', 'Checklist')}</span>
        </button>
      </div>
    </motion.article>
  )
}
