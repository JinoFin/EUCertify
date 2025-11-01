import { STANDARDS_MAP } from '@/data/standardsMap'
import { LEGISLATION_CATALOG } from '@/data/legislationCatalog'
import type { AnswerMap } from '@/domain/types'
import { deriveTagsFromAnswers } from '@/domain/tags'

const TAG_TO_LEGISLATION: Record<string, string[]> = {
  RED: ['RED'],
  EMC: ['EMC'],
  LVD: ['LVD'],
  RoHS: ['RoHS'],
  GPSR: ['GPSR'],
  ToySafety: ['ToySafety'],
  Machinery: ['Machinery'],
  WEEE: ['WEEE'],
  Batteries: ['Batteries'],
  Packaging: ['Packaging'],
  REACH: ['REACH'],
  low_voltage: ['LVD']
}

const VALID_LEGISLATION = new Set(LEGISLATION_CATALOG.map(item => item.id))

const mapTagsToLegislation = (tags: string[]): string[] => {
  const ids = new Set<string>()
  tags.forEach(tag => {
    const matches = TAG_TO_LEGISLATION[tag]
    if (matches) {
      matches.forEach(id => {
        if (VALID_LEGISLATION.has(id)) ids.add(id)
      })
    }
    if (VALID_LEGISLATION.has(tag)) {
      ids.add(tag)
    }
  })
  return Array.from(ids)
}

const mapLegislationToStandards = (legislation: string[]): string[] => {
  const codes = new Set<string>()
  legislation.forEach(id => {
    const entries = STANDARDS_MAP[id] ?? []
    entries.forEach(code => {
      if (code) codes.add(code)
    })
  })
  return Array.from(codes)
}

export type Intelligence = {
  tags: string[]
  applicableLegislation: string[]
  applicableStandards: string[]
}

export function buildIntelligence(ctx: { answers: AnswerMap; tags?: string[] }): Intelligence {
  const tagList = Array.from(new Set(ctx.tags ?? deriveTagsFromAnswers(ctx.answers)))
  const applicableLegislation = mapTagsToLegislation(tagList)
  const applicableStandards = mapLegislationToStandards(applicableLegislation)
  return { tags: tagList, applicableLegislation, applicableStandards }
}
