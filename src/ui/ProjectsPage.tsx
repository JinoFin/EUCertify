import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n'
import {
  useSessionStore,
  selectActiveProject,
  selectActiveProduct,
  type SessionProject,
  type SessionProduct
} from '@/state/useSession'

const formatDate = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(iso))
  } catch (error) {
    return iso
  }
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const projects = useSessionStore(state => state.projects)
  const activeProject = useSessionStore(state => selectActiveProject(state))
  const activeProduct = useSessionStore(state => selectActiveProduct(state))
  const setActiveProject = useSessionStore(state => state.setActiveProject)
  const setActiveProduct = useSessionStore(state => state.setActiveProduct)
  const createProject = useSessionStore(state => state.createProject)
  const createProduct = useSessionStore(state => state.createProduct)
  const renameProject = useSessionStore(state => state.renameProject)
  const renameProduct = useSessionStore(state => state.renameProduct)

  const projectSummary = useMemo(() => {
    if (!activeProject) return t('projects.summary.empty', 'Select a project to see details.')
    const products = activeProject.products.length
    if (products === 0) {
      return t('projects.summary.noProducts', 'No products yet. Add one to start answering the wizard.')
    }
    if (products === 1) {
      return t('projects.summary.single', '1 product in this project.')
    }
    const template = t('projects.summary.multi', '{count} products in this project.')
    return template.replace('{count}', String(products))
  }, [activeProject])

  const handleCreateProject = () => {
    const name = window.prompt(t('projects.actions.promptProject', 'Project name'))?.trim()
    if (!name) return
    const project = createProject(name)
    if (project) {
      setActiveProject(project.id)
    }
  }

  const handleCreateProduct = (project: SessionProject) => {
    const name = window.prompt(t('projects.actions.promptProduct', 'Product name'))?.trim()
    if (!name) return
    const product = createProduct(project.id, name)
    if (product) {
      setActiveProduct(project.id, product.id)
    }
  }

  const handleRenameProject = (project: SessionProject) => {
    const name = window.prompt(t('projects.actions.renameProject', 'Rename project'), project.name)?.trim()
    if (!name) return
    renameProject(project.id, name)
  }

  const handleRenameProduct = (project: SessionProject, product: SessionProduct) => {
    const name = window.prompt(t('projects.actions.renameProduct', 'Rename product'), product.name)?.trim()
    if (!name) return
    renameProduct(project.id, product.id, name)
  }

  const goToProductRoute = (project: SessionProject, product: SessionProduct, path: 'wizard' | 'results' | 'docs') => {
    setActiveProject(project.id)
    setActiveProduct(project.id, product.id)
    const base = `/projects/${project.id}/products/${product.id}`
    navigate(path === 'docs' ? `${base}/docs` : `${base}/${path}`)
  }

  return (
    <div className="page projects-page">
      <header className="page-header" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1>{t('dashboard.title', 'Projects & products')}</h1>
          <p className="muted">{t('projects.subtitle', 'Organize compliance assessments per project and product.')}</p>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" type="button" onClick={handleCreateProject}>
            {t('dashboard.newProject', 'New project')}
          </button>
          {activeProject ? (
            <button className="btn ghost" type="button" onClick={() => handleCreateProduct(activeProject)}>
              {t('dashboard.newProduct', 'New product')}
            </button>
          ) : null}
        </div>
      </header>

      <div className="projects-layout">
        <section className="card projects-list">
          <header className="section-header">
            <h2>{t('projects.list.title', 'Projects')}</h2>
            {projects.length === 0 ? (
              <>
                <p className="muted">{t('projects.empty', 'No projects yet. Create one to begin.')}</p>
                <p className="muted" style={{ fontSize: 12 }}>
                  {t('dashboard.emptyHelp', 'Create a project to start the compliance wizard.')}
                </p>
              </>
            ) : null}
          </header>
          <ul className="stack">
            {projects.map(project => {
              const isActive = activeProject?.id === project.id
              return (
                <li key={project.id} className={`stack-item${isActive ? ' active' : ''}`}>
                  <button
                    type="button"
                    className="link"
                    onClick={() => setActiveProject(project.id)}
                  >
                    <strong>{project.name}</strong>
                  </button>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {t('projects.list.updated', 'Updated {date}').replace('{date}', formatDate(project.updatedAt))}
                  </div>
                  <div className="row" style={{ gap: 6, marginTop: 8 }}>
                    <button className="btn ghost" type="button" onClick={() => handleRenameProject(project)}>
                      {t('projects.actions.rename', 'Rename')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card products-list">
          <header className="section-header">
            <h2>{t('projects.products.title', 'Products in project')}</h2>
            <p className="muted">{projectSummary}</p>
          </header>
          {activeProject ? (
            <ul className="stack">
              {activeProject.products.map(product => {
                const isActive = activeProduct?.id === product.id
                return (
                  <li key={product.id} className={`stack-item${isActive ? ' active' : ''}`}>
                    <div className="stack-item-header">
                      <strong>{product.name}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {t('projects.products.updated', 'Updated {date}').replace(
                          '{date}',
                          formatDate(product.updatedAt)
                        )}
                      </span>
                    </div>
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn" type="button" onClick={() => goToProductRoute(activeProject, product, 'wizard')}>
                        {(
                          product.answers && Object.keys(product.answers).length
                            ? t('wizard.resume', 'Resume wizard')
                            : t('wizard.start', 'Start wizard')
                        )}
                      </button>
                      <button className="btn ghost" type="button" onClick={() => goToProductRoute(activeProject, product, 'results')}>
                        {t('projects.products.actions.results', 'View results')}
                      </button>
                      <button className="btn ghost" type="button" onClick={() => goToProductRoute(activeProject, product, 'docs')}>
                        {t('projects.products.actions.docs', 'Documents')}
                      </button>
                      <button className="btn ghost" type="button" onClick={() => handleRenameProduct(activeProject, product)}>
                        {t('projects.actions.rename', 'Rename')}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">{t('projects.products.empty', 'Select a project to manage its products.')}</p>
          )}
        </section>
      </div>
    </div>
  )
}
