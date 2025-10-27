import STANDARDS_CATALOG from '@/data/standardsCatalog'
import { STANDARDS_MAP } from '@/data/standardsMap'
import type { AnswerMap } from '@/domain/types'
import type { DocContext } from './types'

export async function makeDocContext(answers: AnswerMap): Promise<DocContext> {
  const { buildReport } = await import('../domain/engine')
  return { answers, report: buildReport(answers), nowISO: new Date().toISOString() }
}

export function enrichContext(ctx: DocContext): DocContext & { standards: string[] } {
  const standards = Array.from(
    new Set(ctx.report.rules.flatMap(rule => STANDARDS_MAP[rule.id] || []))
  )
  return { ...ctx, standards }
}

export function autoFromReportSelections(ctx: DocContext) {
  const legislationIds = ctx.report.rules.map(rule => rule.id)
  const standards = Array.from(new Set(((ctx as any).standards || []) as string[])).map(en => ({
    en,
    title: STANDARDS_CATALOG.find(entry => entry.en === en)?.title || ''
  }))
  return { legislationIds, standards }
}
