import { Link } from 'react-router-dom'
import { t } from '@/i18n'
import LanguageSwitcher from './LanguageSwitcher'

export default function App() {
  return (
    <main className="page">
      <header className="page-header" style={{ alignItems: 'center', gap: 16 }}>
        <h1>{t('app.title', 'EUCertify')}</h1>
        <LanguageSwitcher />
      </header>
      <p>{t('app.subtitle', 'EU compliance wizard for products (CE, EPR, country tasks).')}</p>
      <div className="row">
        <Link className="btn" to="/wizard">
          {t('app.startWizard', 'Start compliance check')}
        </Link>
        <Link className="btn ghost" to="/results">
          {t('app.viewResults', 'View results')}
        </Link>
        <Link className="btn ghost" to="/docs">
          {t('app.generateDocs', 'Generate documents')}
        </Link>
      </div>
    </main>
  )
}
