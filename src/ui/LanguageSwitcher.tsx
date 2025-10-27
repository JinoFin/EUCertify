import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { getLocale, setLocale, type Locale, t } from '@/i18n'

export default function LanguageSwitcher() {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale())

  useEffect(() => {
    setLocaleState(getLocale())
  }, [])

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value as Locale
    if (nextLocale === locale) return
    setLocale(nextLocale)
    setLocaleState(nextLocale)
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <select
      className="language-switcher"
      aria-label={t('language.label', 'Language')}
      value={locale}
      onChange={handleChange}
    >
      <option value="en">EN</option>
      <option value="de">DE</option>
      <option value="zh">中文</option>
    </select>
  )
}
