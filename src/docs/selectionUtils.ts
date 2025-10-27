import type { SelectionBlock } from './types'
import { LEGISLATION_CATALOG } from '@/data/legislationCatalog'
import { STANDARDS_CATALOG } from '@/data/standardsCatalog'

export const orderLegislation = (ids: string[]): string[] => {
  const seen = new Set<string>()
  const ordered: string[] = []
  ids.forEach(id => {
    if (seen.has(id)) return
    seen.add(id)
  })
  LEGISLATION_CATALOG.forEach(item => {
    if (seen.has(item.id)) {
      ordered.push(item.id)
      seen.delete(item.id)
    }
  })
  if (seen.size) {
    ordered.push(...Array.from(seen).sort())
  }
  return ordered
}

export const orderStandards = (
  entries: { en: string; title: string }[]
): { en: string; title: string }[] => {
  const seen = new Set<string>()
  const normalized: { en: string; title: string }[] = []
  entries.forEach(entry => {
    if (seen.has(entry.en)) return
    seen.add(entry.en)
  })
  STANDARDS_CATALOG.forEach(item => {
    if (seen.has(item.en)) {
      const title = entries.find(entry => entry.en === item.en)?.title || item.title
      normalized.push({ en: item.en, title })
      seen.delete(item.en)
    }
  })
  if (seen.size) {
    normalized.push(
      ...Array.from(seen)
        .sort()
        .map(en => {
          const found = entries.find(entry => entry.en === en)
          return { en, title: found?.title ?? '' }
        })
    )
  }
  return normalized
}

export const normalizeSelectionBlock = (selection?: SelectionBlock): SelectionBlock => {
  if (!selection) {
    return { selectedLegislationIds: [], selectedStandards: [] }
  }
  const resolvedStandards = selection.selectedStandards.map(entry => {
    if (entry.title) return entry
    const catalogEntry = STANDARDS_CATALOG.find(item => item.en === entry.en)
    return { en: entry.en, title: catalogEntry?.title ?? '' }
  })
  return {
    selectedLegislationIds: orderLegislation(selection.selectedLegislationIds),
    selectedStandards: orderStandards(resolvedStandards)
  }
}

export const defaultCatalogSelection = (): SelectionBlock => ({
  selectedLegislationIds: LEGISLATION_CATALOG.filter(item => item.defaultSelected).map(item => item.id),
  selectedStandards: STANDARDS_CATALOG.filter(item => item.defaultSelected).map(item => ({
    en: item.en,
    title: item.title
  }))
})

export const selectionsEqual = (a: SelectionBlock, b: SelectionBlock): boolean => {
  if (a.selectedLegislationIds.length !== b.selectedLegislationIds.length) return false
  if (a.selectedStandards.length !== b.selectedStandards.length) return false
  for (let index = 0; index < a.selectedLegislationIds.length; index += 1) {
    if (a.selectedLegislationIds[index] !== b.selectedLegislationIds[index]) return false
  }
  for (let index = 0; index < a.selectedStandards.length; index += 1) {
    const left = a.selectedStandards[index]
    const right = b.selectedStandards[index]
    if (left.en !== right.en) return false
    if ((left.title || '') !== (right.title || '')) return false
  }
  return true
}
