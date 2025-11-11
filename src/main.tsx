import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './ui/App'
import Dashboard from './ui/Dashboard'
import AllDocuments from './ui/AllDocuments'
import AllDocs from './ui/AllDocs'
import Wizard from './ui/Wizard'
import Results from './ui/Results'
import ProjectDocs from './ui/ProjectDocs'
import Docs from './ui/Docs'
import Profiles from './ui/Profiles'
import DevExample from './ui/DevExample'
import { ErrorBoundary } from './ui/ErrorBoundary'
import './ui/styles.css'
import { mergeWizardI18n } from './i18n/loadFromSchema'

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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'docs', element: <AllDocuments /> },
      { path: 'docs/all', element: <AllDocs /> },
      { path: 'project/:projectId/wizard', element: <Wizard /> },
      { path: 'project/:projectId/results', element: <Results /> },
      { path: 'project/:projectId/docs', element: <Docs /> },
      { path: 'project/:projectId/checklist', element: <ProjectDocs /> },
      { path: 'profiles', element: <Profiles /> }
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
