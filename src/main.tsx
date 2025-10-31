import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './ui/App'
import Dashboard from './ui/Dashboard'
import Wizard from './ui/Wizard'
import Results from './ui/Results'
import DevExample from './ui/DevExample'
import { ErrorBoundary } from './ui/ErrorBoundary'
import './ui/styles.css'

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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'project/:projectId/wizard', element: <Wizard /> },
      { path: 'project/:projectId/results', element: <Results /> }
    ]
  },
  { path: '/dev/example', element: <DevExample /> }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>
)
