import { listTemplates, createInstance } from './generator'
import { enrichContext } from './context'
import DOCUMENT_CATALOG from '@/data/documentCatalog'
import type { DocContext, DocInstance, DocKind } from './types'

const DOC_KIND_BY_ID: Partial<Record<string, DocKind>> = {
  doc_eu_doc: 'EU_DoC',
  doc_risk: 'Risk_Register',
  doc_tech_file: 'TechFile_Checklist',
  label_ce_trace: 'Labels_Checklist',
  epr_weee_reg: 'EPR_Info_Sheet',
  epr_battery_reg: 'EPR_Info_Sheet',
  epr_packaging_reg: 'EPR_Info_Sheet',
  doc_user_manual: 'User_Manual_Starter'
}

export function buildCompliancePack(ctx: DocContext): DocInstance[] {
  const enriched = enrichContext(ctx)
  const templates = listTemplates()
  const templateMap = new Map(templates.map(template => [template.id, template]))
  const docsNeeded = DOCUMENT_CATALOG.filter(doc => DOC_KIND_BY_ID[doc.docId])
  const result: DocInstance[] = []
  const seen = new Set<DocKind>()

  for (const doc of docsNeeded) {
    const kind = DOC_KIND_BY_ID[doc.docId]
    if (!kind || seen.has(kind)) continue
    const template = templateMap.get(kind)
    if (!template) continue
    const instance = createInstance(template.id, enriched)

    if (template.id === 'EU_DoC') {
      instance.data.applicable_legislation = ctx.report.rules.map(rule => ({
        ID: rule.id,
        Type: rule.type
      }))
      instance.data.standards_list = enriched.standards.map(standard => ({
        'EN Standard': standard,
        Title: ''
      }))
    }

    result.push(instance)
    seen.add(kind)
  }

  return result
}
