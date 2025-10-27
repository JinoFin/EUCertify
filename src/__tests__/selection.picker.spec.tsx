import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import LegislationStandardsPicker from '@/ui/LegislationStandardsPicker'
import type { SelectionBlock } from '@/docs/types'
import { LanguageProvider } from '@/context/LanguageContext'

describe('LegislationStandardsPicker', () => {
  afterEach(() => {
    cleanup()
  })

  const autoFromReport = {
    legislationIds: [] as SelectionBlock['selectedLegislationIds'],
    standards: [] as SelectionBlock['selectedStandards']
  }
  const emptyInitial: SelectionBlock = { selectedLegislationIds: [], selectedStandards: [] }

  it('renders grouped legislation and standards categories', () => {
    const handleChange = vi.fn()
    render(
      <LanguageProvider>
        <LegislationStandardsPicker initial={undefined} autoFromReport={autoFromReport} onChange={handleChange} />
      </LanguageProvider>
    )

    expect(screen.getByText('Applicable EU Legislation')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'CE Directives' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Horizontal' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'EPR' })).toBeInTheDocument()
    expect(screen.getByText('EN Standards')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Safety' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'EMC' })).toBeInTheDocument()
  })

  it(
    'allows selecting and clearing legislation and standards',
    async () => {
      const handleChange = vi.fn<(_selection: SelectionBlock) => void>()
      const Wrapper = () => {
        const [sel, setSel] = useState<SelectionBlock>(emptyInitial)
        return (
          <LanguageProvider>
            <LegislationStandardsPicker
              initial={sel}
              autoFromReport={autoFromReport}
              onChange={value => {
                setSel(value)
                handleChange(value)
              }}
            />
          </LanguageProvider>
        )
      }
      render(<Wrapper />)

      const [redCheckbox] = screen.getAllByRole('checkbox', { name: /Radio Equipment Directive/i })
      fireEvent.click(redCheckbox)
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled()
        expect(handleChange.mock.calls.at(-1)?.[0].selectedLegislationIds).toContain('RED')
      })
      expect(screen.getAllByRole('checkbox', { name: /Radio Equipment Directive/i })[0]).toBeChecked()

      const [standardCheckbox] = screen.getAllByRole('checkbox', { name: /EN 301 489-1/i })
      fireEvent.click(standardCheckbox)
      await waitFor(() => {
        expect(handleChange.mock.calls.at(-1)?.[0].selectedStandards.some(entry => entry.en === 'EN 301 489-1')).toBe(true)
      })
      expect(screen.getAllByRole('checkbox', { name: /EN 301 489-1/i })[0]).toBeChecked()

      fireEvent.click(redCheckbox)
      await waitFor(() => {
        expect(handleChange.mock.calls.at(-1)?.[0].selectedLegislationIds).not.toContain('RED')
      })
      expect(screen.getAllByRole('checkbox', { name: /Radio Equipment Directive/i })[0]).not.toBeChecked()
    },
    15000
  )

  it('filters items with search input', async () => {
    const handleChange = vi.fn()
    render(
      <LanguageProvider>
        <LegislationStandardsPicker initial={emptyInitial} autoFromReport={autoFromReport} onChange={handleChange} />
      </LanguageProvider>
    )

    const [search] = screen.getAllByPlaceholderText('Search legislation or standards')
    fireEvent.change(search, { target: { value: '' } })
    fireEvent.change(search, { target: { value: 'Machinery' } })

    expect(screen.getByRole('heading', { name: 'Machinery' })).toBeInTheDocument()
    expect(screen.queryByText('Radio Equipment Directive (2014/53/EU)')).not.toBeInTheDocument()
  })
})
