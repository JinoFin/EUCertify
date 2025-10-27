import { Link } from 'react-router-dom'
import LanguageSelector from '@/components/LanguageSelector'
import { useLang } from '@/context/LanguageContext'

export default function App() {
  const { t } = useLang()

  return (
    <main className="page">
      <div className="page-header">
        <LanguageSelector />
      </div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
      <div className="row">
        <Link className="btn" to="/wizard">
          {t('app.startWizard')}
        </Link>
        <Link className="btn ghost" to="/results">
          {t('app.viewResults')}
        </Link>
        <Link className="btn ghost" to="/docs">
          {t('app.generateDocuments')}
        </Link>
      </div>
    </main>
  )
}
