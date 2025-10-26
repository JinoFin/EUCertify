import type { DocContext } from './types'
import type { AnswerMap } from '../domain/types'
import { STANDARDS_MAP } from '../data/standardsMap'

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
