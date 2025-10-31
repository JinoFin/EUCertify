import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import AuthenticatedLayout from './ui/AuthenticatedLayout'
import App from './ui/App'
import Wizard from './ui/Wizard'
import Results from './ui/Results'
import DevExample from './ui/DevExample'
import DocsPage from './ui/DocsPage'
import DocPackPage from './ui/DocPackPage'
import LoginPage from './ui/LoginPage'
import './ui/styles.css'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AuthenticatedLayout />,
    children: [
      { index: true, element: <App /> },
      { path: 'projects/:projectId/products/:productId/wizard', element: <Wizard /> },
      { path: 'projects/:projectId/products/:productId/results', element: <Results /> },
      { path: 'projects/:projectId/products/:productId/docs', element: <DocsPage /> },
      { path: 'projects/:projectId/products/:productId/docs/new/:kind', element: <DocsPage /> },
      { path: 'projects/:projectId/products/:productId/docs/edit/:kind', element: <DocsPage /> },
      { path: 'projects/:projectId/products/:productId/docs/pack', element: <DocPackPage /> }
    ]
  },
  { path: '/dev/example', element: <DevExample /> }
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
