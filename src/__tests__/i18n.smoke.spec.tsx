import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import React from 'react'
import * as i18n from '@/i18n'

function SampleView() {
  return (
    <div>
      <button type="button">{i18n.t('layout.nav.logout', 'Sign out')}</button>
      <p>{i18n.tDoc('doc.footer.notes', 'Notes')}</p>
    </div>
  )
}

describe('i18n language separation', () => {
  it('updates UI locale while keeping documents German-first', () => {
    const setLocaleSpy = vi.spyOn(i18n, 'setLocale')

    window.localStorage.clear()

    i18n.setLocale('en')
    const { rerender } = render(<SampleView />)

    expect(screen.getByRole('button')).toHaveTextContent('Sign out')
    expect(screen.getByText('Notizen')).toBeInTheDocument()

    i18n.setLocale('de')
    rerender(<SampleView />)
    expect(screen.getByRole('button')).toHaveTextContent('Abmelden')
    expect(screen.getByText('Notizen')).toBeInTheDocument()

    i18n.setLocale('zh')
    rerender(<SampleView />)
    expect(screen.getByRole('button')).toHaveTextContent('退出登录')
    expect(screen.getByText('Notizen')).toBeInTheDocument()

    i18n.setLocale('en')
    setLocaleSpy.mockRestore()
  })
})
