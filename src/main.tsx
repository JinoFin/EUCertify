import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { ErrorBoundary } from './ui/ErrorBoundary'
import './ui/styles.css'
import './styles/document.css'
import './styles/print.css'
import { mergeWizardI18n } from './i18n/loadFromSchema'
import router from './router'

window.addEventListener('error', event => {
  console.error('window error', event.error || event.message)
})

window.addEventListener('unhandledrejection', event => {
  console.error('unhandled', event.reason)
})

if (!location.search.includes('sw=off')) {
  try {
    registerSW({ immediate: true })
  } catch (error) {
    console.warn('SW register failed', error)
  }
}

mergeWizardI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>
)
