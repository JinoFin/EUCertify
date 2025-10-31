import { useNavigate } from 'react-router-dom'
import { useWizard } from '@/state/useWizard'
import { useProjects } from '@/state/useProjects'
import { t } from '@/i18n'

export default function DevExample() {
  const navigate = useNavigate()
  const { loadExample } = useWizard()
  const selectedProjectId = useProjects(state => state.selectedProjectId)
  const projects = useProjects(state => state.projects)

  const handleViewResults = () => {
    const targetId = selectedProjectId ?? projects[0]?.id
    if (targetId) {
      navigate(`/project/${targetId}/results`)
    } else {
      navigate('/')
    }
  }
  return (
    <div className="page">
      <h2>{t('dev.example.title', 'Dev Example')}</h2>
      <button className="btn" onClick={loadExample}>
        {t('dev.example.prefill', 'Prefill Bluetooth Speaker')}
      </button>
      <button className="btn ghost" type="button" onClick={handleViewResults}>
        {t('dev.example.results', 'Go to results')}
      </button>
    </div>
  )
}
