import { useLang } from '@/context/LanguageContext'

export default function LanguageSelector() {
  const { lang, setLang, t } = useLang()

  return (
    <div className="flex gap-2 items-center language-selector">
      <label className="lang-option">
        <input type="radio" checked={lang === 'en'} onChange={() => setLang('en')} aria-label="English" />
        <span>{t('languages.english')}</span>
      </label>
      <label className="lang-option">
        <input type="radio" checked={lang === 'de'} onChange={() => setLang('de')} aria-label="Deutsch" />
        <span>{t('languages.german')}</span>
      </label>
      <label className="lang-option">
        <input type="radio" checked={lang === 'zh'} onChange={() => setLang('zh')} aria-label="中文" />
        <span>{t('languages.chinese')}</span>
      </label>
    </div>
  )
}
