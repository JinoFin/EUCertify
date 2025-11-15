import { createBrowserRouter } from 'react-router-dom'
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
import ProductOverview from './pages/product/ProductOverview'
import ManufacturerProfileForm from './components/doc/ManufacturerProfileForm'
import DocPreview from './pages/doc/DocPreview'

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
      { path: 'profiles', element: <Profiles /> },
      { path: 'product/:id', element: <ProductOverview /> },
      { path: 'product/:id/profile', element: <ManufacturerProfileForm /> },
      { path: 'product/:id/doc', element: <DocPreview /> }
    ]
  },
  { path: '/dev/example', element: <DevExample /> }
])

export default router
