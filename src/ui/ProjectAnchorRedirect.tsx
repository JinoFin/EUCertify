import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function ProjectAnchorRedirect({ anchor }: { anchor: string }) {
  const navigate = useNavigate()
  const params = useParams<{ projectId: string }>()
  const projectId = params.projectId

  useEffect(() => {
    if (!projectId) return
    navigate(`/project/${projectId}/results#${anchor}`, { replace: true })
  }, [anchor, navigate, projectId])

  return null
}
