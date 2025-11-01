import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n'
import { useAuth } from '@/state/useAuth'
import { useProjects } from '@/state/useProjects'
import OnboardingModal from './onboarding/OnboardingModal'
import NewProjectModal from './NewProjectModal'

type ToastState = {
  message: string
  variant: 'success' | 'error'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const projects = useProjects(state => state.list)
  const load = useProjects(state => state.load)
  const createProject = useProjects(state => state.create)
  const select = useProjects(state => state.select)
  const selectedProjectId = useProjects(state => state.selectedProjectId)
  const user = useAuth(state => state.user)

  const [showModal, setShowModal] = useState(false)
  const loading = useProjects(state => state.loading)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    load().catch(err => {
      console.error('Failed to load projects', err)
    })
  }, [load])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (!user) {
      setShowOnboarding(false)
      return
    }
    const key = `eucertify:onboarded:${user.id}`
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true)
    }
  }, [user])

  const handleCloseOnboarding = () => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`eucertify:onboarded:${user.id}`, '1')
    }
    setShowOnboarding(false)
  }

  const sortedProjects = useMemo(() => projects.slice().sort((a, b) => a.name.localeCompare(b.name)), [projects])

  const openModal = () => {
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  useEffect(() => {
    if (!toast || typeof window === 'undefined') return
    const timeout = window.setTimeout(() => {
      setToast(null)
    }, 4000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [toast])

  const handleCreateProduct = async (name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName || creating) return false
    setCreating(true)
    try {
      const project = await createProject(trimmedName)
      select(project.id)
      setShowModal(false)
      navigate(`/project/${project.id}/wizard`)
      setToast({
        message: t('dashboard.toast.success', '✅ Product {{name}} created!').replace('{{name}}', project.name),
        variant: 'success'
      })
      return true
    } catch (error) {
      console.error('Failed to create project', error)
      setToast({ message: t('dashboard.toast.error', '⚠️ Could not create product.'), variant: 'error' })
      return false
    } finally {
      setCreating(false)
    }
  }

  const handleOpenProject = (projectId: string) => {
    select(projectId)
    navigate(`/project/${projectId}/wizard`)
  }

  return (
    <div className="page dashboard-page">
      <header className="page-header" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1>{t('dashboard.title', 'Products dashboard')}</h1>
          <p className="muted">{t('dashboard.subtitle', 'Manage compliance assessments for your products.')}</p>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn ghost" type="button" onClick={() => setShowOnboarding(true)}>
            {t('layout.help', 'Help')}
          </button>
          <button className="btn" type="button" onClick={openModal}>
            {t('dashboard.newProduct', 'New Product')}
          </button>
        </div>
      </header>

      <section className="card">
        {loading ? <p>{t('dashboard.loading', 'Loading your products…')}</p> : null}
        {!loading && sortedProjects.length === 0 ? (
          <p className="muted">{t('dashboard.empty', 'No products yet. Create one to begin.')}</p>
        ) : null}
        <ul className="stack">
          {sortedProjects.map(project => (
            <li key={project.id} className={`stack-item${project.id === selectedProjectId ? ' active' : ''}`}>
              <div className="stack-item-header">
                <strong>{project.name}</strong>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn" type="button" onClick={() => handleOpenProject(project.id)}>
                  {t('dashboard.openWizard', 'Open wizard')}
                </button>
                <button className="btn ghost" type="button" onClick={() => navigate(`/project/${project.id}/results`)}>
                  {t('dashboard.viewResults', 'View results')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <NewProjectModal open={showModal} onClose={closeModal} onSubmit={handleCreateProduct} submitting={creating} />

      {showOnboarding ? <OnboardingModal onClose={handleCloseOnboarding} /> : null}

      {toast ? (
        <div
          role="status"
          className="card"
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            maxWidth: 320,
            background: toast.variant === 'success' ? '#ecfdf5' : '#fffbeb',
            color: toast.variant === 'success' ? '#065f46' : '#92400e',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
            border: '1px solid rgba(15, 23, 42, 0.08)'
          }}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}
