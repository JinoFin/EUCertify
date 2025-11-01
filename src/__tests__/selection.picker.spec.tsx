import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import LegislationStandardsPicker from '@/ui/LegislationStandardsPicker'
import type { SimpleSelection } from '@/docs/selectionUtils'

describe('LegislationStandardsPicker', () => {
  afterEach(() => {
    cleanup()
  })

  const emptyInitial: SimpleSelection = { legislationIds: [], standardCodes: [] }

  it('renders grouped legislation and standards categories', () => {
    const handleChange = vi.fn()
    render(<LegislationStandardsPicker initial={undefined} onChange={handleChange} />)

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
      const handleChange = vi.fn<(_selection: SimpleSelection) => void>()
      const Wrapper = () => {
        const [sel, setSel] = useState<SimpleSelection>(emptyInitial)
        return (
          <LegislationStandardsPicker
            initial={sel}
            onChange={value => {
              setSel(value)
              handleChange(value)
            }}
          />
        )
      }
      render(<Wrapper />)

      const [redCheckbox] = screen.getAllByRole('checkbox', { name: /Radio Equipment Directive/i })
      fireEvent.click(redCheckbox)
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled()
        expect(handleChange.mock.calls.at(-1)?.[0].legislationIds).toContain('RED')
      })
      expect(screen.getAllByRole('checkbox', { name: /Radio Equipment Directive/i })[0]).toBeChecked()

      const [standardCheckbox] = screen.getAllByRole('checkbox', { name: /EN 301 489-1/i })
      fireEvent.click(standardCheckbox)
      await waitFor(() => {
        expect(handleChange.mock.calls.at(-1)?.[0].standardCodes).toContain('EN 301 489-1')
      })
      expect(screen.getAllByRole('checkbox', { name: /EN 301 489-1/i })[0]).toBeChecked()

      fireEvent.click(redCheckbox)
      await waitFor(() => {
        expect(handleChange.mock.calls.at(-1)?.[0].legislationIds).not.toContain('RED')
      })
      expect(screen.getAllByRole('checkbox', { name: /Radio Equipment Directive/i })[0]).not.toBeChecked()
    },
    15000
  )

  it('filters items with search input', async () => {
    const handleChange = vi.fn()
    render(<LegislationStandardsPicker initial={emptyInitial} onChange={handleChange} />)

    const [search] = screen.getAllByPlaceholderText('Search legislation or standards')
    fireEvent.change(search, { target: { value: '' } })
    fireEvent.change(search, { target: { value: 'Machinery' } })

    expect(screen.getByRole('heading', { name: 'Machinery' })).toBeInTheDocument()
    expect(screen.queryByText('Radio Equipment Directive (2014/53/EU)')).not.toBeInTheDocument()
  })
})
