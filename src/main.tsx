import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import App from './ui/App'
import Dashboard from './ui/Dashboard'
import Wizard from './ui/Wizard'
import Results from './ui/Results'
import DocsPage from './ui/DocsPage'
import DocPackPage from './ui/DocPackPage'
import DevExample from './ui/DevExample'
import './ui/styles.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'project/:projectId/wizard', element: <Wizard /> },
      { path: 'project/:projectId/results', element: <Results /> },
      { path: 'project/:projectId/docs', element: <DocsPage /> },
      { path: 'project/:projectId/docs/new/:kind', element: <DocsPage /> },
      { path: 'project/:projectId/docs/edit/:kind', element: <DocsPage /> },
      { path: 'project/:projectId/docs/pack', element: <DocPackPage /> }
    ]
  },
  { path: '/dev/example', element: <DevExample /> }
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
