import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '@/auth/supabase'
import { t } from '@/i18n'
import { useAuth } from '@/state/useAuth'

type Mode = 'signin' | 'signup'

export default function AuthScreen() {
  const navigate = useNavigate()
  const signIn = useAuth(state => state.signIn)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email])
  const passwordValid = useMemo(() => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password), [password])
  const confirmValid = useMemo(
    () => mode === 'signin' || confirmPassword === password,
    [mode, confirmPassword, password]
  )
  const formValid = emailValid && passwordValid && confirmValid

  const resetError = () => setError(null)

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode)
    resetError()
    setConfirmPassword('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitting) return
    resetError()

    if (!formValid) {
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        return
      }

      const supabase = getSupabase()
      if (!supabase) {
        setError(
          t(
            'auth.supabaseMissing',
            'Configuration missing. Please set VITE_SB_URL and VITE_SB_ANON_KEY.'
          )
        )
        return
      }

      const { error: signUpErr } = await supabase.auth.signUp({ email, password })
      if (signUpErr) {
        if (/already/i.test(signUpErr.message)) {
          switchMode('signin')
          setError(t('auth.exists', 'Account exists. Please sign in.'))
          return
        }
        throw signUpErr
      }

      try {
        await signIn(email, password)
      } catch (signInErr) {
        const message = signInErr instanceof Error ? signInErr.message : String(signInErr)
        setError(message)
        return
      }

      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page auth-page">
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>
          {mode === 'signin'
            ? t('auth.title', 'Sign in to EUCertify')
            : t('auth.signupTitle', 'Create your EUCertify account')}
        </h1>
        <p className="muted">
          {mode === 'signin'
            ? t('auth.subtitle', 'Enter your credentials to continue.')
            : t(
                'auth.signupSubtitle',
                'Create an account with your email and password. No email verification required.'
              )}
        </p>
        <label className="stack" style={{ marginTop: 16 }}>
          <span className="muted">{t('auth.email', 'Email')}</span>
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
          {!emailValid && email.length > 0 ? (
            <span style={{ color: '#d33', fontSize: 12 }}>
              {t('auth.emailInvalid', 'Enter a valid email address.')}
            </span>
          ) : null}
        </label>
        <label className="stack" style={{ marginTop: 12 }}>
          <span className="muted">{t('auth.password', 'Password')}</span>
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          {!passwordValid && password.length > 0 ? (
            <span style={{ color: '#d33', fontSize: 12 }}>
              {t('auth.passwordInvalid', 'Use at least 8 characters with a letter and a number.')}
            </span>
          ) : null}
        </label>
        {mode === 'signup' ? (
          <label className="stack" style={{ marginTop: 12 }}>
            <span className="muted">{t('auth.confirmPassword', 'Confirm password')}</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
            {!confirmValid && confirmPassword.length > 0 ? (
              <span style={{ color: '#d33', fontSize: 12 }}>
                {t('auth.passwordMismatch', 'Passwords do not match.')}
              </span>
            ) : null}
          </label>
        ) : null}
        <button
          className="btn"
          type="submit"
          disabled={submitting || !formValid}
          style={{ marginTop: 16 }}
        >
          {submitting
            ? t('auth.processing', 'Please wait…')
            : mode === 'signin'
              ? t('auth.signIn', 'Sign in')
              : t('auth.createAccount', 'Create account')}
        </button>
        {error ? (
          <p className="error" role="alert" style={{ marginTop: 8 }}>
            {error}
          </p>
        ) : null}
        <div style={{ marginTop: 16 }}>
          {mode === 'signin' ? (
            <button
              type="button"
              className="btn link"
              onClick={() => switchMode('signup')}
              disabled={submitting}
            >
              {t('auth.createAccountCta', 'Don’t have an account? Create one')}
            </button>
          ) : (
            <button
              type="button"
              className="btn link"
              onClick={() => switchMode('signin')}
              disabled={submitting}
            >
              {t('auth.haveAccountCta', 'Already have an account? Sign in')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
