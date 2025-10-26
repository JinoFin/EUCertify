import { questionsFlow } from './questionsFlow'
import type { WizardQuestion } from './questionsFlow'
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

export type Rule = {
  id: string
  type: string
  requires?: string[]
  any?: string[]
  excludes?: string[]
  modules?: string[]
  outputs?: string[]
  tags?: string[]
}

export const rules: Rule[] = [
  {
    id: 'RED',
    type: 'Directive',
    requires: ['product:electrical', 'feature:wireless'],
    modules: ['Module B - EU type examination'],
    outputs: ['Radio test plan', 'Notified body engagement'],
    tags: ['RED']
  },
  {
    id: 'EMC',
    type: 'Directive',
    requires: ['product:electrical'],
    modules: ['Internal production control'],
    outputs: ['EMC test report'],
    tags: ['EMC']
  },
  {
    id: 'LVD',
    type: 'Directive',
    requires: ['feature:low_voltage'],
    outputs: ['Safety test checklist'],
    tags: ['LVD']
  },
  {
    id: 'RoHS',
    type: 'Directive',
    requires: ['feature:electrical'],
    outputs: ['Material declarations', 'Supplier RoHS statements'],
    tags: ['RoHS']
  },
  {
    id: 'GPSR',
    type: 'Horizontal',
    requires: ['scope:ce'],
    outputs: ['General safety assessment'],
    tags: ['GPSR']
  },
  {
    id: 'REACH',
    type: 'Regulation',
    requires: ['scope:ce'],
    any: ['feature:chemicals', 'feature:lithium', 'use:skin_contact'],
    outputs: ['SVHC screening'],
    tags: ['REACH']
  },
  {
    id: 'Battery EPR',
    type: 'EPR',
    requires: ['feature:battery', 'obligation:epr'],
    outputs: ['Battery producer registration'],
    tags: ['EPR']
  },
  {
    id: 'WEEE EPR',
    type: 'EPR',
    requires: ['product:electrical', 'obligation:epr'],
    outputs: ['WEEE scheme enrollment'],
    tags: ['EPR']
  }
]

export const staticTags: string[] = []

export const allQuestions: Record<string, WizardQuestion> = Object.fromEntries(
  (questionsFlow ?? []).map(question => [question.id, question])
)
