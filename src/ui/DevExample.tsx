import { useWizard } from '@/state/useWizard'
import LanguageSelector from '@/components/LanguageSelector'
import { useLang } from '@/context/LanguageContext'

export default function DevExample() {
  const { loadExample } = useWizard()
  const { t } = useLang()
  return (
    <div className="page">
      <div className="page-header">
        <LanguageSelector />
      </div>
      <h2>{t('devExample.title')}</h2>
      <button className="btn" onClick={loadExample}>
        {t('devExample.prefill')}
      </button>
      <a className="btn ghost" href="/results">
        {t('devExample.goToResults')}
      </a>
    </div>
  )
}
