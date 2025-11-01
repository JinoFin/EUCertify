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

export function recommendFromTags(tags: string[]) {
  const legislationIds: string[] = []
  const add = (id: string) => {
    if (!legislationIds.includes(id)) legislationIds.push(id)
  }

  if (tags.includes('EEE')) {
    add('EMC')
    add('LVD')
    add('RoHS')
  }
  if (tags.includes('RED')) {
    add('RED')
    add('EMC')
    add('LVD')
  }
  if (tags.includes('BATTERY')) add('Batteries')
  if (tags.includes('TOY')) add('ToySafety')
  add('GPSR')

  const standards = new Set<string>()
  if (legislationIds.includes('RED')) {
    standards.add('EN 301 489-1')
    standards.add('EN 300 328')
  }
  if (legislationIds.includes('EMC')) {
    standards.add('EN 301 489-1')
  }
  if (legislationIds.includes('LVD')) {
    standards.add('EN 62368-1')
  }

  return { legislationIds, standardCodes: Array.from(standards) }
}

export type Intelligence = {
  tags: string[]
  applicableLegislation: string[]
  applicableStandards: string[]
}

export function buildIntelligence(ctx: { answers: AnswerMap; tags?: string[] }): Intelligence {
  const tagList = Array.from(new Set(ctx.tags ?? deriveTagsFromAnswers(ctx.answers)))
  const recommended = recommendFromTags(tagList)
  const applicableLegislation = Array.from(
    new Set([...recommended.legislationIds, ...mapTagsToLegislation(tagList)])
  )
  const applicableStandards = Array.from(
    new Set([...recommended.standardCodes, ...mapLegislationToStandards(applicableLegislation)])
  )
  return { tags: tagList, applicableLegislation, applicableStandards }
}
