import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'
import { t } from '@/i18n'
import { useAuth } from '@/state/useAuth'
import AuthScreen from './AuthScreen'

export default function Gate({ children }: PropsWithChildren) {
  const user = useAuth(state => state.user)
  const initialized = useAuth(state => state.initialized)
  const initSession = useAuth(state => state.initSession)

  useEffect(() => {
    initSession().catch(error => {
      console.error('Failed to initialize auth', error)
    })
  }, [initSession])

  if (!initialized) {
    return (
      <div className="page">
        <p>{t('auth.loading', 'Loading…')}</p>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <>{children}</>
}
