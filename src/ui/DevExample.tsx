import { useWizard } from '@/state/useWizard'
import { t } from '@/i18n'

export default function DevExample() {
  const { loadExample } = useWizard()
  return (
    <div className="page">
      <h2>{t('dev.example.title', 'Dev Example')}</h2>
      <button className="btn" onClick={loadExample}>
        {t('dev.example.prefill', 'Prefill Bluetooth Speaker')}
      </button>
      <a className="btn ghost" href="/results">
        {t('dev.example.results', 'Go to results')}
      </a>
    </div>
  )
}
