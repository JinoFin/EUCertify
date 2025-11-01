import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './ui/App'
import Dashboard from './ui/Dashboard'
import AllDocuments from './ui/AllDocuments'
import Wizard from './ui/Wizard'
import Results from './ui/Results'
import ProjectDocs from './ui/ProjectDocs'
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
      { path: 'docs', element: <AllDocuments /> },
      { path: 'project/:projectId/wizard', element: <Wizard /> },
      { path: 'project/:projectId/results', element: <Results /> },
      { path: 'project/:projectId/docs', element: <ProjectDocs /> },
      { path: 'project/:projectId/checklist', element: <ProjectDocs /> }
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
