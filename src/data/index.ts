import { questionsFlow } from './questionsFlow'
import type { WizardQuestion } from './questionsFlow'
import type { Rule as EngineRule } from '@/domain/types'
import explainersDataset from './eucertify.v1.json'
import { t } from '@/i18n'

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

export const baseModules = [
  t('engine.baseModules.0', 'Create and maintain technical file')
]

export const baseOutputs = [
  t('engine.baseOutputs.doc', 'Declaration of Conformity draft'),
  t('engine.baseOutputs.risk', 'Risk assessment register')
]

export const countryNuances: Record<string, Record<string, string>> = {
  DE: {
    epr: t('countryNuances.DE.epr', 'Germany: register with LUCID (packaging) and stiftung ear for WEEE.')
  },
  FR: {
    epr: t('countryNuances.FR.epr', 'France: Triman logo, info-tri, and filings for electronics/batteries.')
  },
  ES: {
    note: t('countryNuances.ES.note', 'Spain: notify regional authorities for WEEE.'),
    language: t('countryNuances.ES.language', 'Provide manuals in Spanish.')
  },
  IT: {
    note: t('countryNuances.IT.note', 'Italy: ensure CE mark affixed and technical file translated on request.')
  },
  NL: {
    note: t(
      'countryNuances.NL.note',
      'Netherlands: register packaging and e-waste schemes via Rijkswaterstaat.'
    )
  },
  SE: {
    note: t('countryNuances.SE.note', 'Sweden: report EPR volumes quarterly to Naturvårdsverket.')
  },
  PL: {
    note: t(
      'countryNuances.PL.note',
      'Poland: appoint authorized representative for EPR filings if non-EU manufacturer.'
    )
  }
}

export const rules: EngineRule[] = [
  {
    id: 'rule_red',
    ifAllTrue: ['product:electrical', 'feature:wireless'],
    applies: [{ type: 'Directive', id: 'RED' }],
    conformityPath: {
      modules: [
        t('rules.rule_red.module.0', 'Module B - EU type examination')
      ]
    },
    outputs: [
      t('rules.rule_red.output.0', 'Radio test plan'),
      t('rules.rule_red.output.1', 'Notified body engagement')
    ],
    rationale: t(
      'rules.rule_red.rationale',
      'Wireless functionality means the Radio Equipment Directive applies.'
    )
  },
  {
    id: 'rule_emc',
    ifAllTrue: ['product:electrical'],
    applies: [{ type: 'Directive', id: 'EMC' }],
    conformityPath: {
      modules: [t('rules.rule_emc.module.0', 'Internal production control')]
    },
    outputs: [t('rules.rule_emc.output.0', 'EMC test report')],
    rationale: t(
      'rules.rule_emc.rationale',
      'Powered electronics must manage electromagnetic emissions and immunity.'
    )
  },
  {
    id: 'rule_lvd',
    ifAllTrue: ['feature:low_voltage'],
    applies: [{ type: 'Directive', id: 'LVD' }],
    outputs: [t('rules.rule_lvd.output.0', 'Safety test checklist')],
    rationale: t(
      'rules.rule_lvd.rationale',
      'Mains or low-voltage supply triggers LVD safety obligations.'
    )
  },
  {
    id: 'rule_rohs',
    ifAllTrue: ['feature:electrical'],
    applies: [{ type: 'Directive', id: 'RoHS' }],
    outputs: [
      t('rules.rule_rohs.output.0', 'Material declarations'),
      t('rules.rule_rohs.output.1', 'Supplier RoHS statements')
    ],
    rationale: t(
      'rules.rule_rohs.rationale',
      'Electrical and electronic equipment must comply with RoHS substance limits.'
    )
  },
  {
    id: 'rule_gpsr',
    ifAllTrue: ['scope:ce'],
    applies: [{ type: 'Horizontal', id: 'GPSR' }],
    outputs: [t('rules.rule_gpsr.output.0', 'General safety assessment')],
    rationale: t(
      'rules.rule_gpsr.rationale',
      'All consumer products must remain safe under the GPSR framework.'
    )
  },
  {
    id: 'rule_reach',
    ifAllTrue: ['scope:ce'],
    ifAnyTrue: ['feature:chemicals', 'feature:lithium', 'use:skin_contact'],
    applies: [{ type: 'Regulation', id: 'REACH' }],
    outputs: [t('rules.rule_reach.output.0', 'SVHC screening')],
    rationale: t('rules.rule_reach.rationale', 'Chemical content or skin contact requires REACH checks.')
  },
  {
    id: 'rule_batteries',
    ifAllTrue: ['feature:battery', 'obligation:epr'],
    applies: [{ type: 'EPR', id: 'Batteries' }],
    outputs: [t('rules.rule_batteries.output.0', 'Battery producer registration')],
    rationale: t(
      'rules.rule_batteries.rationale',
      'Battery EPR applies when placing batteries on covered markets.'
    )
  },
  {
    id: 'rule_weee',
    ifAllTrue: ['product:electrical', 'obligation:epr'],
    applies: [{ type: 'EPR', id: 'WEEE' }],
    outputs: [t('rules.rule_weee.output.0', 'WEEE scheme enrollment')],
    rationale: t(
      'rules.rule_weee.rationale',
      'Electrical equipment requires WEEE producer registration.'
    )
  },
  {
    id: 'rule_packaging',
    ifAllTrue: ['obligation:epr'],
    ifAnyTrue: ['market:DE', 'market:FR', 'market:ES', 'market:IT'],
    applies: [{ type: 'EPR', id: 'Packaging' }],
    outputs: [t('rules.rule_packaging.output.0', 'Packaging producer registration')],
    rationale: t(
      'rules.rule_packaging.rationale',
      'Packaging waste laws in selected markets require producer enrolment.'
    )
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
    title: t('requirements.RED.title', 'Radio Equipment Directive (RED)'),
    summary: [
      t('requirements.RED.summary.0', 'Wireless features require compliance with the Radio Equipment Directive.')
    ],
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
    title: t('requirements.EMC.title', 'Electromagnetic Compatibility (EMC) Directive'),
    summary: [
      t(
        'requirements.EMC.summary.0',
        'Powered electronics must control electromagnetic emissions and immunity.'
      )
    ],
    tags: ['feature:electrical'],
    documents: [
      { docId: 'doc_eu_doc', have: true },
      { docId: 'doc_tech_file', have: true },
      { docId: 'test_emc', have: true },
      { docId: 'label_ce_trace' }
    ]
  },
  LVD: {
    title: t('requirements.LVD.title', 'Low Voltage Directive (LVD)'),
    summary: [
      t(
        'requirements.LVD.summary.0',
        'Mains or low-voltage powered equipment must meet electrical safety requirements.'
      )
    ],
    tags: ['feature:low_voltage', 'Mains'],
    documents: [
      { docId: 'doc_eu_doc', have: true },
      { docId: 'doc_tech_file', have: true },
      { docId: 'test_lvd', have: true },
      { docId: 'label_ce_trace' }
    ]
  },
  RoHS: {
    title: t('requirements.RoHS.title', 'RoHS Directive'),
    summary: [
      t('requirements.RoHS.summary.0', 'Electrical equipment must control hazardous substances in materials.')
    ],
    tags: ['feature:electrical'],
    documents: [
      { docId: 'doc_eu_doc', have: true },
      { docId: 'doc_material_rohs' },
      { docId: 'label_ce_trace' }
    ]
  },
  GPSR: {
    title: t('requirements.GPSR.title', 'General Product Safety Regulation (GPSR)'),
    summary: [
      t('requirements.GPSR.summary.0', 'Consumer products in the EU must be designed and documented for safety.')
    ],
    tags: ['scope:ce'],
    documents: [
      { docId: 'doc_risk' },
      { docId: 'doc_user_manual' }
    ]
  },
  REACH: {
    title: t('requirements.REACH.title', 'REACH obligations'),
    summary: [
      t(
        'requirements.REACH.summary.0',
        'Products with chemicals or skin contact require REACH communication and SVHC checks.'
      )
    ],
    tags: ['feature:chemicals', 'feature:lithium', 'use:skin_contact'],
    documents: [
      { docId: 'doc_material_rohs', have: true }
    ]
  },
  WEEE: {
    title: t('requirements.WEEE.title', 'WEEE Producer Responsibility'),
    summary: [
      t('requirements.WEEE.summary.0', 'Selling electrical equipment triggers e-waste registration duties.')
    ],
    tags: ['obligation:epr', 'feature:electrical'],
    documents: [
      { docId: 'epr_weee_reg' }
    ]
  },
  Batteries: {
    title: t('requirements.Batteries.title', 'Battery Producer Responsibility'),
    summary: [
      t('requirements.Batteries.summary.0', 'Containing batteries requires joining battery collection schemes.')
    ],
    tags: ['feature:battery'],
    documents: [
      { docId: 'epr_battery_reg' }
    ]
  },
  Packaging: {
    title: t('requirements.Packaging.title', 'Packaging Producer Responsibility'),
    summary: [
      t('requirements.Packaging.summary.0', 'Target markets expect packaging waste scheme participation.')
    ],
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

export const explainers = Object.fromEntries(
  Object.entries(explainersData).map(([id, entry]) => {
    const why = (entry.why ?? []).map((line, index) =>
      t(`explainers.${id}.why.${index}`, line)
    )
    const whatToDo = (entry.whatToDo ?? []).map((line, index) =>
      t(`explainers.${id}.whatToDo.${index}`, line)
    )
    const evidence = (entry.evidence ?? []).map((line, index) =>
      t(`explainers.${id}.evidence.${index}`, line)
    )
    return [id, { ...entry, why, whatToDo, evidence }]
  })
)

export const allQuestions: Record<string, WizardQuestion> = Object.fromEntries(
  (questionsFlow ?? []).map(question => [question.id, question])
)
