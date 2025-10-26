import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { questionsFlow as flow } from '@/data/questionsFlow'
import Wizard from '@/ui/Wizard'
import { useWizard } from '@/state/useWizard'

vi.mock('localforage', () => {
  const store = new Map<string, any>()
  return {
    default: {
      setItem: vi.fn((key: string, value: any) => {
        store.set(key, value)
        return Promise.resolve(value)
      }),
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key)))
    }
  }
})

describe('examples', () => {
  beforeEach(() => {
    useWizard.getState().restart()
  })

  it('every option has examples where applicable', () => {
    const withOptions = flow.filter(question => question.options)
    const missing: string[] = []
    for (const question of withOptions) {
      for (const option of question.options!) {
        const hasValidExamples = Array.isArray(option.examples)
          ? option.examples.length > 0
          : ['target_countries'].includes(question.id)
        if (!hasValidExamples) {
          missing.push(`${question.id}:${option.value}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it('renders example toggles and expands content', async () => {
    render(createElement(Wizard))
    const toggles = screen.getAllByRole('button', { name: /Examples ▸/i })
    expect(toggles.length).toBeGreaterThan(0)

    const firstToggle = toggles[0]
    const user = userEvent.setup()
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(firstToggle)
    expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Bluetooth speaker, smartwatch, tablet')).toBeInTheDocument()
    expect(screen.getByText('LED desk lamp with USB power')).toBeInTheDocument()
  })
})
