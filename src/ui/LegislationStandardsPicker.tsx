import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SelectionBlock } from '@/docs/types'
import { LEGISLATION_CATALOG } from '@/data/legislationCatalog'
import { STANDARDS_CATALOG } from '@/data/standardsCatalog'
import {
  defaultCatalogSelection,
  normalizeSelectionBlock,
  orderLegislation,
  orderStandards,
  selectionsEqual
} from '@/docs/selectionUtils'

const LEGISLATION_CATEGORY_ORDER: Array<(typeof LEGISLATION_CATALOG)[number]['category']> = [
  'CE Directives',
  'Horizontal',
  'EPR'
]

const STANDARDS_CATEGORY_ORDER: Array<(typeof STANDARDS_CATALOG)[number]['category']> = [
  'Safety',
  'EMC',
  'Radio',
  'Chemical',
  'Toy',
  'Machinery',
  'Packaging'
]

type PickerProps = {
  initial: SelectionBlock | undefined
  autoFromReport: { legislationIds: string[]; standards: { en: string; title: string }[] }
  onChange: (_selection: SelectionBlock) => void
}

type LegislationCategory = (typeof LEGISLATION_CATALOG)[number]['category']
type StandardsCategory = (typeof STANDARDS_CATALOG)[number]['category']

type SelectionState = SelectionBlock

const buildDefaultSelection = (
  initial: SelectionBlock | undefined,
  autoFromReport: PickerProps['autoFromReport']
): SelectionState => {
  if (initial) {
    return normalizeSelectionBlock(initial)
  }
  const reportSelection = normalizeSelectionBlock({
    selectedLegislationIds: autoFromReport.legislationIds || [],
    selectedStandards: autoFromReport.standards || []
  })
  if (reportSelection.selectedLegislationIds.length || reportSelection.selectedStandards.length) {
    return reportSelection
  }
  return normalizeSelectionBlock(defaultCatalogSelection())
}

export default function LegislationStandardsPicker({ initial, autoFromReport, onChange }: PickerProps) {
  const [search, setSearch] = useState('')
  const [selection, setSelection] = useState<SelectionState>(() =>
    buildDefaultSelection(initial, autoFromReport)
  )
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const registerScrollElement = useCallback((node: HTMLDivElement | null) => {
    setScrollElement(node)
  }, [])

  const registerSection = useCallback((key: string) => {
    return (node: HTMLElement | null) => {
      sectionRefs.current[key] = node
    }
  }, [])

  const handleScrollToSection = useCallback((key: string) => {
    const target = sectionRefs.current[key]
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
  }, [])

  const handleScrollToTop = useCallback(() => {
    if (!scrollElement) return
    scrollElement.scrollTo({ top: 0, behavior: 'smooth' })
    setShowBackToTop(false)
  }, [scrollElement])

  useEffect(() => {
    const node = scrollElement
    if (!node) return
    const handleScroll = () => {
      setShowBackToTop(node.scrollTop > 160)
    }
    handleScroll()
    node.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      node.removeEventListener('scroll', handleScroll)
    }
  }, [scrollElement])

  useEffect(() => {
    onChange(selection)
  }, [selection, onChange])

  useEffect(() => {
    if (!initial) return
    const normalized = normalizeSelectionBlock(initial)
    setSelection(current => {
      if (selectionsEqual(current, normalized)) {
        return current
      }
      return normalized
    })
  }, [initial])

  const searchTerm = search.trim().toLowerCase()

  const legislationGroups = useMemo(() => {
    const groups = new Map<LegislationCategory, typeof LEGISLATION_CATALOG>()
    LEGISLATION_CATEGORY_ORDER.forEach(category => {
      const items = LEGISLATION_CATALOG.filter(item => {
        if (item.category !== category) return false
        if (!searchTerm) return true
        const haystack = `${item.id} ${item.title} ${item.short}`.toLowerCase()
        return haystack.includes(searchTerm)
      })
      if (items.length) groups.set(category, items)
    })
    return groups
  }, [searchTerm])

  const standardsGroups = useMemo(() => {
    const groups = new Map<StandardsCategory, typeof STANDARDS_CATALOG>()
    STANDARDS_CATEGORY_ORDER.forEach(category => {
      const items = STANDARDS_CATALOG.filter(item => {
        if (item.category !== category) return false
        if (!searchTerm) return true
        const haystack = `${item.en} ${item.title} ${item.short}`.toLowerCase()
        return haystack.includes(searchTerm)
      })
      if (items.length) groups.set(category, items)
    })
    return groups
  }, [searchTerm])

  const handleLegislationToggle = (id: string) => {
    setSelection(prev => {
      const set = new Set(prev.selectedLegislationIds)
      if (set.has(id)) {
        set.delete(id)
      } else {
        set.add(id)
      }
      return {
        ...prev,
        selectedLegislationIds: orderLegislation(Array.from(set))
      }
    })
  }

  const handleStandardsToggle = (en: string) => {
    const catalogEntry = STANDARDS_CATALOG.find(item => item.en === en)
    const title = catalogEntry?.title ?? ''
    setSelection(prev => {
      const map = new Map(prev.selectedStandards.map(entry => [entry.en, entry.title]))
      if (map.has(en)) {
        map.delete(en)
      } else {
        map.set(en, title)
      }
      const ordered = orderStandards(Array.from(map.entries()).map(([key, value]) => ({ en: key, title: value })))
      return { ...prev, selectedStandards: ordered }
    })
  }

  const setLegislationGroup = (category: LegislationCategory, enabled: boolean) => {
    const items = LEGISLATION_CATALOG.filter(item => item.category === category)
    setSelection(prev => {
      const set = new Set(prev.selectedLegislationIds)
      items.forEach(item => {
        if (enabled) {
          set.add(item.id)
        } else {
          set.delete(item.id)
        }
      })
      return { ...prev, selectedLegislationIds: orderLegislation(Array.from(set)) }
    })
  }

  const setStandardsGroup = (category: StandardsCategory, enabled: boolean) => {
    const items = STANDARDS_CATALOG.filter(item => item.category === category)
    setSelection(prev => {
      const map = new Map(prev.selectedStandards.map(entry => [entry.en, entry.title]))
      items.forEach(item => {
        if (enabled) {
          map.set(item.en, item.title)
        } else {
          map.delete(item.en)
        }
      })
      const ordered = orderStandards(Array.from(map.entries()).map(([key, value]) => ({ en: key, title: value })))
      return { ...prev, selectedStandards: ordered }
    })
  }

  const noResults = legislationGroups.size === 0 && standardsGroups.size === 0

  const slugify = useCallback((value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-'), [])

  const navigationItems = useMemo(() => {
    const items: Array<{ key: string; label: string }> = []
    legislationGroups.forEach((_items, category) => {
      const key = `legislation-${slugify(category)}`
      items.push({ key, label: category })
    })
    standardsGroups.forEach((_items, category) => {
      const key = `standards-${slugify(category)}`
      items.push({ key, label: category })
    })
    return items
  }, [legislationGroups, standardsGroups, slugify])

  return (
    <div className="selection-picker">
      <label className="selection-filter">
        <span className="muted">Search</span>
        <input
          type="search"
          value={search}
          placeholder="Search legislation or standards"
          onChange={event => setSearch(event.target.value)}
        />
      </label>

      {navigationItems.length ? (
        <nav className="selection-nav" aria-label="Jump to category">
          {navigationItems.map(item => (
            <button
              key={item.key}
              type="button"
              className="chip"
              aria-controls={item.key}
              onClick={() => handleScrollToSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}

      <div className="selection-scroll" id="picker-scroll" ref={registerScrollElement}>
        <div className="selection-accordions">
          <details className="selection-accordion" open>
            <summary id="legislation-overview">Applicable EU Legislation</summary>
            <div className="selection-groups">
              {Array.from(legislationGroups.entries()).map(([category, items]) => {
                const key = `legislation-${slugify(category)}`
                const allSelected = items.every(item => selection.selectedLegislationIds.includes(item.id))
                return (
                  <section
                    key={category}
                    id={key}
                    ref={registerSection(key)}
                    className="selection-group"
                    tabIndex={-1}
                    aria-labelledby={`${key}-heading`}
                  >
                    <header>
                      <h4 id={`${key}-heading`}>{category}</h4>
                      <div className="selection-group-actions">
                        <button type="button" className="link" onClick={() => setLegislationGroup(category, true)}>
                          Select all
                        </button>
                        <button type="button" className="link" onClick={() => setLegislationGroup(category, false)}>
                          Clear
                        </button>
                      </div>
                    </header>
                    <ul>
                      {items.map(item => (
                        <li key={item.id}>
                          <label className="selection-item">
                            <input
                              type="checkbox"
                              checked={selection.selectedLegislationIds.includes(item.id)}
                              onChange={() => handleLegislationToggle(item.id)}
                            />
                            <div>
                              <div className="selection-item-title">
                                <strong>{item.title}</strong>
                                <span className="muted">{item.id}</span>
                              </div>
                              <p className="selection-item-short">{item.short}</p>
                              {item.notes?.length ? (
                                <ul className="selection-item-notes">
                                  {item.notes.map(note => (
                                    <li key={note}>{note}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                    {allSelected ? <p className="muted selection-group-hint">All items selected</p> : null}
                  </section>
                )
              })}
              {legislationGroups.size === 0 ? (
                <p className="muted">No legislation matches your search.</p>
              ) : null}
            </div>
          </details>

          <details className="selection-accordion" open>
            <summary id="standards-overview">EN Standards</summary>
            <div className="selection-groups">
              {Array.from(standardsGroups.entries()).map(([category, items]) => {
                const key = `standards-${slugify(category)}`
                return (
                  <section
                    key={category}
                    id={key}
                    ref={registerSection(key)}
                    className="selection-group"
                    tabIndex={-1}
                    aria-labelledby={`${key}-heading`}
                  >
                    <header>
                      <h4 id={`${key}-heading`}>{category}</h4>
                      <div className="selection-group-actions">
                        <button type="button" className="link" onClick={() => setStandardsGroup(category, true)}>
                          Select all
                        </button>
                        <button type="button" className="link" onClick={() => setStandardsGroup(category, false)}>
                          Clear
                        </button>
                      </div>
                    </header>
                    <ul>
                      {items.map(item => (
                        <li key={item.en}>
                          <label className="selection-item">
                            <input
                              type="checkbox"
                              checked={selection.selectedStandards.some(entry => entry.en === item.en)}
                              onChange={() => handleStandardsToggle(item.en)}
                            />
                            <div>
                              <div className="selection-item-title">
                                <strong>{item.en}</strong>
                                <span className="muted">{item.title}</span>
                              </div>
                              <p className="selection-item-short">{item.short}</p>
                              {item.notes?.length ? (
                                <ul className="selection-item-notes">
                                  {item.notes.map(note => (
                                    <li key={note}>{note}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
              {standardsGroups.size === 0 ? (
                <p className="muted">No EN standards match your search.</p>
              ) : null}
            </div>
          </details>
        </div>

        {noResults ? <p className="muted">No matches found. Try a different search term.</p> : null}
      </div>

      {showBackToTop ? (
        <button
          type="button"
          className="btn ghost selection-back-to-top"
          onClick={handleScrollToTop}
        >
          Back to top
        </button>
      ) : null}
    </div>
  )
}
