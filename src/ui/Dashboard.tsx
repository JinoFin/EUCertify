import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n'
import { useProjects } from '@/state/useProjects'
import OnboardingModal from './onboarding/OnboardingModal'

export default function Dashboard() {
  const navigate = useNavigate()
  const projects = useProjects(state => state.projects)
  const load = useProjects(state => state.load)
  const create = useProjects(state => state.create)
  const select = useProjects(state => state.select)
  const selectedProjectId = useProjects(state => state.selectedProjectId)

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loading = useProjects(state => state.loading)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    load().catch(err => {
      console.error('Failed to load projects', err)
    })
  }, [load])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (!localStorage.getItem('eucertify:onboarded')) {
      setShowOnboarding(true)
      localStorage.setItem('eucertify:onboarded', '1')
    }
  }, [])

  const sortedProjects = useMemo(() => projects.slice().sort((a, b) => a.name.localeCompare(b.name)), [projects])

  const openModal = () => {
    setName('')
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      setError(t('dashboard.modal.required', 'Please name the product.'))
      return
    }
    setError(null)
    const project = await create(name.trim())
    if (project) {
      select(project.id)
      setShowModal(false)
      navigate(`/project/${project.id}/wizard`)
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

      {showModal ? (
        <div className="modal-backdrop">
          <div className="modal card" role="dialog" aria-modal="true">
            <form onSubmit={handleCreate} className="stack">
              <h2>{t('dashboard.modal.title', 'Create a new product')}</h2>
              <p className="muted">{t('dashboard.modal.subtitle', 'Name your product to start the compliance wizard.')}</p>
              <label className="stack">
                <span className="muted">{t('dashboard.modal.name', 'Product name')}</span>
                <input value={name} onChange={event => setName(event.target.value)} required autoFocus />
              </label>
              {error ? (
                <p className="error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn ghost" type="button" onClick={closeModal}>
                  {t('dashboard.modal.cancel', 'Cancel')}
                </button>
                <button className="btn" type="submit">
                  {t('dashboard.modal.create', 'Create product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showOnboarding ? <OnboardingModal onClose={() => setShowOnboarding(false)} /> : null}
    </div>
  )
}
