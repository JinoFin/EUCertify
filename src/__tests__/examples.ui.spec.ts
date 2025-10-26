import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Wizard from '@/ui/Wizard'
import { useWizard } from '@/state/useWizard'

vi.mock('localforage', () => {
  const store = new Map<string, unknown>()
  return {
    default: {
      setItem: vi.fn((key: string, value: unknown) => {
        store.set(key, value)
        return Promise.resolve(value)
      }),
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key)))
    }
  }
})

describe('wizard examples UI', () => {
  beforeEach(() => {
    useWizard.getState().restart()
  })

  it('renders example toggles for first-step options', () => {
    render(createElement(Wizard))
    const toggles = screen.getAllByRole('button', { name: /Examples ▸/i })
    expect(toggles.length).toBeGreaterThan(0)
  })
})
