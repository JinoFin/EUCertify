import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import App from './ui/App'
import Wizard from './ui/Wizard'
import Results from './ui/Results'
import DevExample from './ui/DevExample'
import DocsPage from './ui/DocsPage'
import './ui/styles.css'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/wizard', element: <Wizard /> },
  { path: '/results', element: <Results /> },
  { path: '/docs', element: <DocsPage /> },
  { path: '/docs/new/:kind', element: <DocsPage /> },
  { path: '/dev/example', element: <DevExample /> }
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
