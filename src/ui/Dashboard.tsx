import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n'
import { getSupabase } from '@/auth/supabase'
import { useAuth } from '@/state/useAuth'
import { useProjects } from '@/state/useProjects'
import { computeProjectCompletion } from '@/state/useProjectData'
import OnboardingModal from './onboarding/OnboardingModal'
import NewProjectModal from './NewProjectModal'
import ProductCard from './components/ProductCard'

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
  const answersByProject = useProjects(state => state.answersByProject)
  const user = useAuth(state => state.user)

  const [showModal, setShowModal] = useState(false)
  const loading = useProjects(state => state.loading)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [projectCompletion, setProjectCompletion] = useState<Record<string, boolean | null>>({})
  const [statusesLoading, setStatusesLoading] = useState(false)

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
    if (!trimmedName) {
      throw new Error(t('dashboard.modal.required', 'Please enter a product name.'))
    }
    if (creating) return
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
    } catch (error) {
      console.error('Failed to create project', error)
      throw error
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (!projects.length) {
      setProjectCompletion({})
      setStatusesLoading(false)
      return
    }

    const supabase = getSupabase()
    let cancelled = false
    const ids = projects.map(project => project.id)

    const computeFromLocal = () => {
      const local: Record<string, boolean | null> = {}
      projects.forEach(project => {
        const answers = answersByProject[project.id]
        if (answers && Object.keys(answers).length > 0) {
          local[project.id] = computeProjectCompletion(answers)
        } else {
          local[project.id] = false
        }
      })
      if (!cancelled) {
        setProjectCompletion(local)
        setStatusesLoading(false)
      }
    }

    if (!supabase || ids.length === 0) {
      computeFromLocal()
      return
    }

    setStatusesLoading(true)
    void supabase
      .from('project_answers')
      .select('project_id,is_complete')
      .in('project_id', ids)
      .then(({ data, error }) => {
        if (cancelled) {
          return
        }
        if (error) {
          console.error('Failed to load project completion status', error)
          computeFromLocal()
          return
        }

        const rows = (data ?? []) as { project_id: string; is_complete: boolean | null }[]
        const remoteMap = new Map(rows.map(row => [row.project_id, row.is_complete]))
        const next: Record<string, boolean | null> = {}
        projects.forEach(project => {
          const value = remoteMap.get(project.id)
          if (typeof value === 'boolean') {
            next[project.id] = value
          } else {
            const answers = answersByProject[project.id]
            if (answers && Object.keys(answers).length > 0) {
              next[project.id] = computeProjectCompletion(answers)
            } else {
              next[project.id] = false
            }
          }
        })
        setProjectCompletion(next)
        setStatusesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [projects, answersByProject])

  return (
    <div className="page dashboard-page">
      <header className="page-header" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1>{t('dashboard.title', 'Products dashboard')}</h1>
          <p className="muted">{t('dashboard.subtitle', 'Manage compliance assessments for your products.')}</p>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn ghost" type="button" onClick={() => navigate('/docs')}>
            {t('dashboard.documents', 'Documents')}
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate('/docs/all')}>
            Alle DoCs
          </button>
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
          <div className="dashboard-empty" role="status">
            <h3>{t('dashboard.noProductsTitle', 'No products yet')}</h3>
            <p className="muted">
              {t(
                'dashboard.noProductsDesc',
                'Create your first product to start the compliance wizard.'
              )}
            </p>
          </div>
        ) : null}
        <div className="product-card-grid">
          {sortedProjects.map(project => {
            const hasStatus = Object.prototype.hasOwnProperty.call(projectCompletion, project.id)
            return (
              <ProductCard
                key={project.id}
                project={project}
                isActive={project.id === selectedProjectId}
                isComplete={hasStatus ? projectCompletion[project.id] ?? null : null}
                statusLoading={statusesLoading && !hasStatus}
              />
            )
          })}
        </div>
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
