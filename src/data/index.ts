import { questionsFlow } from './questionsFlow'
import type { WizardQuestion } from './questionsFlow'
import type { Rule as EngineRule } from '@/domain/types'
import explainersDataset from './eucertify.v1.json'

export { questionsFlow, startQuestionId } from './questionsFlow'

export type AnswerTags = Record<string, Record<string, string[]>>

export const answerTags: AnswerTags = {
  product_type: {
    electronic: ['product:electrical', 'scope:ce', 'feature:electrical'],
    toy: ['product:toy', 'scope:ce', 'audience:children'],
    kitchen: ['product:kitchen', 'scope:ce'],
    wearable: ['product:wearable', 'scope:ce', 'use:skin_contact'],
    chemical: ['product:chemical', 'scope:ce', 'feature:chemicals'],
    mechanical: ['product:mechanical', 'scope:ce'],
    other: ['product:consumer', 'scope:ce']
  },
  power_need: {
    yes: ['feature:electrical'],
    no: ['feature:non_powered']
  },
  battery: {
    yes: ['feature:battery'],
    no: []
  },
  battery_type: {
    rechargeable: ['feature:lithium', 'feature:battery'],
    disposable: ['feature:battery'],
    both: ['feature:lithium', 'feature:battery']
  },
  wireless: {
    yes: ['feature:wireless'],
    no: []
  },
  power_source: {
    mains: ['feature:external_adapter', 'feature:low_voltage'],
    low_voltage: ['feature:low_voltage', 'feature:battery_only']
  },
  user_role: {
    manufacturer: ['role:manufacturer'],
    importer: ['role:importer'],
    distributor: ['role:distributor'],
    authorized_rep: ['role:authorized_rep']
  },
  child_use: {
    yes: ['audience:children'],
    no: ['audience:general']
  },
  toy_play: {
    yes: ['product:toy'],
    no: []
  },
  moving_parts: {
    yes: ['risk:mechanical'],
    no: []
  },
  food_contact: {
    yes: ['use:food_contact'],
    no: []
  },
  chemical_content: {
    yes: ['feature:chemicals'],
    no: []
  },
  skin_contact: {
    yes: ['use:skin_contact'],
    no: []
  },
  outdoor_use: {
    yes: ['use:outdoor'],
    no: ['use:indoor']
  },
  target_countries: {
    DE: ['market:DE', 'obligation:epr'],
    FR: ['market:FR', 'obligation:epr'],
    ES: ['market:ES'],
    IT: ['market:IT'],
    NL: ['market:NL'],
    SE: ['market:SE'],
    PL: ['market:PL']
  },
  existing_docs: {
    yes: ['doc:exists'],
    no: ['doc:gap']
  },
  needs_docs: {
    generate: ['support:generate'],
    verify: ['support:review']
  }
}

export const staticTags: string[] = []

export const baseModules = ['Create and maintain technical file']

export const baseOutputs = ['Declaration of Conformity draft', 'Risk assessment register']

export const countryNuances: Record<string, Record<string, string>> = {
  DE: {
    epr: 'Germany: register with LUCID (packaging) and stiftung ear for WEEE.'
  },
  FR: {
    epr: 'France: Triman logo, info-tri, and filings for electronics/batteries.'
  },
  ES: {
    note: 'Spain: notify regional authorities for WEEE.',
    language: 'Provide manuals in Spanish.'
  },
  IT: {
    note: 'Italy: ensure CE mark affixed and technical file translated on request.'
  },
  NL: {
    note: 'Netherlands: register packaging and e-waste schemes via Rijkswaterstaat.'
  },
  SE: {
    note: 'Sweden: report EPR volumes quarterly to Naturvårdsverket.'
  },
  PL: {
    note: 'Poland: appoint authorized representative for EPR filings if non-EU manufacturer.'
  }
}

export const rules: EngineRule[] = [
  {
    id: 'rule_red',
    ifAllTrue: ['product:electrical', 'feature:wireless'],
    applies: [{ type: 'Directive', id: 'RED' }],
    conformityPath: { modules: ['Module B - EU type examination'] },
    outputs: ['Radio test plan', 'Notified body engagement'],
    rationale: 'Wireless functionality means the Radio Equipment Directive applies.'
  },
  {
    id: 'rule_emc',
    ifAllTrue: ['product:electrical'],
    applies: [{ type: 'Directive', id: 'EMC' }],
    conformityPath: { modules: ['Internal production control'] },
    outputs: ['EMC test report'],
    rationale: 'Powered electronics must manage electromagnetic emissions and immunity.'
  },
  {
    id: 'rule_lvd',
    ifAllTrue: ['feature:low_voltage'],
    applies: [{ type: 'Directive', id: 'LVD' }],
    outputs: ['Safety test checklist'],
    rationale: 'Mains or low-voltage supply triggers LVD safety obligations.'
  },
  {
    id: 'rule_rohs',
    ifAllTrue: ['feature:electrical'],
    applies: [{ type: 'Directive', id: 'RoHS' }],
    outputs: ['Material declarations', 'Supplier RoHS statements'],
    rationale: 'Electrical and electronic equipment must comply with RoHS substance limits.'
  },
  {
    id: 'rule_gpsr',
    ifAllTrue: ['scope:ce'],
    applies: [{ type: 'Horizontal', id: 'GPSR' }],
    outputs: ['General safety assessment'],
    rationale: 'All consumer products must remain safe under the GPSR framework.'
  },
  {
    id: 'rule_reach',
    ifAllTrue: ['scope:ce'],
    ifAnyTrue: ['feature:chemicals', 'feature:lithium', 'use:skin_contact'],
    applies: [{ type: 'Regulation', id: 'REACH' }],
    outputs: ['SVHC screening'],
    rationale: 'Chemical content or skin contact requires REACH checks.'
  },
  {
    id: 'rule_batteries',
    ifAllTrue: ['feature:battery', 'obligation:epr'],
    applies: [{ type: 'EPR', id: 'Batteries' }],
    outputs: ['Battery producer registration'],
    rationale: 'Battery EPR applies when placing batteries on covered markets.'
  },
  {
    id: 'rule_weee',
    ifAllTrue: ['product:electrical', 'obligation:epr'],
    applies: [{ type: 'EPR', id: 'WEEE' }],
    outputs: ['WEEE scheme enrollment'],
    rationale: 'Electrical equipment requires WEEE producer registration.'
  },
  {
    id: 'rule_packaging',
    ifAllTrue: ['obligation:epr'],
    ifAnyTrue: ['market:DE', 'market:FR', 'market:ES', 'market:IT'],
    applies: [{ type: 'EPR', id: 'Packaging' }],
    outputs: ['Packaging producer registration'],
    rationale: 'Packaging waste laws in selected markets require producer enrolment.'
  }
]

export const requirementsLibrary: Record<
  string,
  {
    title: string
    summary: string[]
    tags: string[]
    documents: { docId: string; have?: boolean }[]
  }
> = {
  RED: {
    title: 'Radio Equipment Directive (RED)',
    summary: ['Wireless features require compliance with the Radio Equipment Directive.'],
    tags: ['feature:wireless'],
    documents: [
      { docId: 'doc_eu_doc', have: true },
      { docId: 'doc_tech_file', have: true },
      { docId: 'doc_user_manual' },
      { docId: 'test_emc', have: true },
      { docId: 'test_lvd', have: true },
      { docId: 'test_red_rf', have: true },
      { docId: 'label_ce_trace' }
    ]
  },
  EMC: {
    title: 'Electromagnetic Compatibility (EMC) Directive',
    summary: ['Powered electronics must control electromagnetic emissions and immunity.'],
    tags: ['feature:electrical'],
    documents: [
      { docId: 'doc_eu_doc', have: true },
      { docId: 'doc_tech_file', have: true },
      { docId: 'test_emc', have: true },
      { docId: 'label_ce_trace' }
    ]
  },
  LVD: {
    title: 'Low Voltage Directive (LVD)',
    summary: ['Mains or low-voltage powered equipment must meet electrical safety requirements.'],
    tags: ['feature:low_voltage', 'Mains'],
    documents: [
      { docId: 'doc_eu_doc', have: true },
      { docId: 'doc_tech_file', have: true },
      { docId: 'test_lvd', have: true },
      { docId: 'label_ce_trace' }
    ]
  },
  RoHS: {
    title: 'RoHS Directive',
    summary: ['Electrical equipment must control hazardous substances in materials.'],
    tags: ['feature:electrical'],
    documents: [
      { docId: 'doc_eu_doc', have: true },
      { docId: 'doc_material_rohs' },
      { docId: 'label_ce_trace' }
    ]
  },
  GPSR: {
    title: 'General Product Safety Regulation (GPSR)',
    summary: ['Consumer products in the EU must be designed and documented for safety.'],
    tags: ['scope:ce'],
    documents: [
      { docId: 'doc_risk' },
      { docId: 'doc_user_manual' }
    ]
  },
  REACH: {
    title: 'REACH obligations',
    summary: ['Products with chemicals or skin contact require REACH communication and SVHC checks.'],
    tags: ['feature:chemicals', 'feature:lithium', 'use:skin_contact'],
    documents: [
      { docId: 'doc_material_rohs', have: true }
    ]
  },
  WEEE: {
    title: 'WEEE Producer Responsibility',
    summary: ['Selling electrical equipment triggers e-waste registration duties.'],
    tags: ['obligation:epr', 'feature:electrical'],
    documents: [
      { docId: 'epr_weee_reg' }
    ]
  },
  Batteries: {
    title: 'Battery Producer Responsibility',
    summary: ['Containing batteries requires joining battery collection schemes.'],
    tags: ['feature:battery'],
    documents: [
      { docId: 'epr_battery_reg' }
    ]
  },
  Packaging: {
    title: 'Packaging Producer Responsibility',
    summary: ['Target markets expect packaging waste scheme participation.'],
    tags: ['obligation:epr'],
    documents: [
      { docId: 'epr_packaging_reg' }
    ]
  }
}

const explainersData = (explainersDataset?.explainers ?? {}) as Record<
  string,
  {
    why: string[]
    whatToDo: string[]
    evidence?: string[]
  }
>

export const explainers = explainersData

export const allQuestions: Record<string, WizardQuestion> = Object.fromEntries(
  (questionsFlow ?? []).map(question => [question.id, question])
)
