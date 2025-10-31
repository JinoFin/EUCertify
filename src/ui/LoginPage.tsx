import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { t } from '@/i18n'
import { useSessionStore } from '@/state/useSession'
import LanguageSwitcher from './LanguageSwitcher'

export default function LoginPage() {
  const user = useSessionStore(state => state.user)
  const login = useSessionStore(state => state.login)
  const ensureStarterProject = useSessionStore(state => state.ensureStarterProject)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    login({ email: email.trim(), name: name.trim() || undefined })
    ensureStarterProject()
    navigate('/')
  }

  return (
    <div className="page auth-page">
      <header className="page-header" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>{t('auth.title', 'Sign in to EUCertify')}</h1>
          <p className="muted">{t('auth.subtitle', 'Create projects, run the adaptive wizard, and manage compliance docs.')}</p>
        </div>
        <LanguageSwitcher />
      </header>
      <form className="card auth-card" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t('auth.fields.email', 'Work email')}</span>
          <input
            type="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="field">
          <span>{t('auth.fields.name', 'Name (optional)')}</span>
          <input
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder={t('auth.fields.namePlaceholder', 'Team or personal name')}
          />
        </label>
        <button className="btn" type="submit">
          {t('auth.submit', 'Continue')}
        </button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 24 }}>
        {t('auth.disclaimer', 'Demo sign-in only. No external authentication required.')}
      </p>
    </div>
  )
}
