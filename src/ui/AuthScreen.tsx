import { useState, type FormEvent } from 'react'
import { t } from '@/i18n'
import { useAuth } from '@/state/useAuth'

export default function AuthScreen() {
  const signIn = useAuth(state => state.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page auth-page">
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 360, margin: '0 auto' }}>
        <h1>{t('auth.title', 'Sign in to EUCertify')}</h1>
        <p className="muted">{t('auth.subtitle', 'Enter your credentials to continue.')}</p>
        <label className="stack" style={{ marginTop: 16 }}>
          <span className="muted">{t('auth.email', 'Email')}</span>
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="stack" style={{ marginTop: 12 }}>
          <span className="muted">{t('auth.password', 'Password')}</span>
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p className="error" role="alert">
            {t('auth.error', 'Unable to sign in: {message}').replace('{message}', error)}
          </p>
        ) : null}
        <button className="btn" type="submit" disabled={submitting} style={{ marginTop: 16 }}>
          {submitting ? t('auth.signingIn', 'Signing in…') : t('auth.signIn', 'Sign in')}
        </button>
      </form>
    </div>
  )
}
