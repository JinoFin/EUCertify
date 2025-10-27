import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { LanguageProvider, useLang } from '@/context/LanguageContext'

describe('LanguageProvider', () => {
  it('UI i18n switches languages', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    )

    const { result } = renderHook(() => useLang(), { wrapper })

    act(() => result.current.setLang('de'))
    expect(result.current.t('languages.german')).toMatch(/Deutsch/i)

    act(() => result.current.setLang('zh'))
    expect(result.current.t('languages.chinese')).toMatch(/中文/i)
  })
})
