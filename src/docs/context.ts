import STANDARDS_CATALOG from '@/data/standardsCatalog'
import { STANDARDS_MAP } from '@/data/standardsMap'
import type { AnswerMap } from '@/domain/types'
import { buildReport } from '@/domain/engine'
import { buildIntelligence } from '@/domain/intelligence'
import type { Intelligence } from '@/domain/intelligence'
import type { DocContext, DocContextAuto } from './types'

export type EnrichedDocContext = DocContext & { standards: string[]; auto: DocContextAuto }

type MakeDocContextInput = AnswerMap & { intelligence?: Intelligence }

export function makeDocContext(input: MakeDocContextInput): DocContext {
  const { intelligence: providedIntelligence, ...rest } = input
  const answers = rest as AnswerMap
  const intelligence = providedIntelligence ?? buildIntelligence({ answers })
  const report = buildReport(answers)
  return { answers, report, nowISO: new Date().toISOString(), intelligence }
}

export function enrichContext(ctx: DocContext): EnrichedDocContext {
  const reportStandards = Array.from(
    new Set(ctx.report.rules.flatMap(rule => STANDARDS_MAP[rule.id] || []))
  )
  const standards = Array.from(new Set([...reportStandards, ...ctx.intelligence.applicableStandards]))
  const auto: DocContextAuto = {
    ...(ctx.auto ?? { applicableLegislation: [], applicableStandards: [] }),
    applicableLegislation: ctx.intelligence.applicableLegislation,
    applicableStandards: ctx.intelligence.applicableStandards
  }
  return { ...ctx, standards, auto }
}

export function autoFromReportSelections(ctx: EnrichedDocContext) {
  const legislationSource = ctx.auto?.applicableLegislation?.length
    ? ctx.auto.applicableLegislation
    : ctx.report.rules.map(rule => rule.id)
  const legislationIds = Array.from(new Set(legislationSource))

  const standardsSource = ctx.auto?.applicableStandards?.length
    ? ctx.auto.applicableStandards
    : ctx.standards
  const standards = Array.from(new Set(standardsSource)).map(en => ({
    en,
    title: STANDARDS_CATALOG.find(entry => entry.en === en)?.title || ''
  }))

  return { legislationIds, standards }
}
