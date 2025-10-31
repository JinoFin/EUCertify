import { Outlet } from 'react-router-dom'
import { t } from '@/i18n'
import { useAuth } from '@/state/useAuth'
import Gate from './Gate'
import LanguageSwitcher from './LanguageSwitcher'

function AppShell() {
  const user = useAuth(state => state.user)
  const signOut = useAuth(state => state.signOut)

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="brand">
          <span className="brand-name">EUCertify</span>
          {user ? <span className="brand-context">{user.email}</span> : null}
        </div>
        <nav className="shell-actions">
          <LanguageSwitcher />
          <button className="btn ghost" type="button" onClick={() => signOut()}>
            {t('layout.nav.logout', 'Sign out')}
          </button>
        </nav>
      </header>
      <main className="app-shell-main">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Gate>
      <AppShell />
    </Gate>
  )
}
