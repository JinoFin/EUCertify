import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Outlet, useMatches } from 'react-router-dom'
import { t } from '@/i18n'
import {
  useSessionStore,
  selectActiveProject,
  selectActiveProduct
} from '@/state/useSession'
import LanguageSwitcher from './LanguageSwitcher'
import Onboarding from './onboarding/Onboarding'

const combineMatchesParams = (matches: ReturnType<typeof useMatches>) => {
  return matches.reduce<Record<string, string | undefined>>((acc, match) => {
    Object.entries(match.params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value
      }
    })
    return acc
  }, {})
}

export default function AuthenticatedLayout() {
  const user = useSessionStore(state => state.user)
  const activeProject = useSessionStore(state => selectActiveProject(state))
  const activeProduct = useSessionStore(state => selectActiveProduct(state))
  const setActiveProject = useSessionStore(state => state.setActiveProject)
  const setActiveProduct = useSessionStore(state => state.setActiveProduct)
  const logout = useSessionStore(state => state.logout)
  const ensureStarterProject = useSessionStore(state => state.ensureStarterProject)
  const onboardingSeen = useSessionStore(state => state.onboardingSeen)
  const markOnboardingSeen = useSessionStore(state => state.markOnboardingSeen)

  const matches = useMatches()
  const params = useMemo(() => combineMatchesParams(matches), [matches])
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (user) {
      ensureStarterProject()
    }
  }, [ensureStarterProject, user])

  useEffect(() => {
    const { projectId, productId } = params
    if (projectId) {
      setActiveProject(projectId)
      if (productId) {
        setActiveProduct(projectId, productId)
      }
    }
  }, [params, setActiveProduct, setActiveProject])

  useEffect(() => {
    if (user && !onboardingSeen) {
      setShowOnboarding(true)
    }
  }, [user, onboardingSeen])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const closeOnboarding = () => {
    setShowOnboarding(false)
    if (!onboardingSeen) {
      markOnboardingSeen()
    }
  }

  const contextLabel = useMemo(() => {
    if (!activeProject) return t('layout.context.empty', 'No project selected')
    if (!activeProduct) return activeProject.name
    return `${activeProject.name} • ${activeProduct.name}`
  }, [activeProduct, activeProject])

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="brand">
          <Link to="/" className="brand-link">
            <span className="brand-name">EUCertify</span>
          </Link>
          <span className="brand-context">{contextLabel}</span>
        </div>
        <nav className="shell-actions">
          <Link className="link" to="/">
            {t('layout.nav.projects', 'Projects')}
          </Link>
          <button className="btn ghost" type="button" onClick={() => setShowOnboarding(true)}>
            {t('layout.nav.help', 'Help')}
          </button>
          <LanguageSwitcher />
          <button className="btn ghost" type="button" onClick={() => logout()}>
            {t('layout.nav.logout', 'Sign out')}
          </button>
        </nav>
      </header>
      <main className="app-shell-main">
        <Outlet />
      </main>
      {showOnboarding ? <Onboarding onDone={closeOnboarding} /> : null}
    </div>
  )
}
