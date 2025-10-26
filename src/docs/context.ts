import type { DocContext } from './types'
import type { AnswerMap } from '../domain/types'

export async function makeDocContext(answers: AnswerMap): Promise<DocContext> {
  const { buildReport } = await import('../domain/engine')
  return { answers, report: buildReport(answers), nowISO: new Date().toISOString() }
}
