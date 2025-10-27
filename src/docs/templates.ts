import COUNTRY_OBLIGATIONS from '@/data/countryObligations'
import { DocTemplate } from './types'
import { tDoc } from './i18nDoc'

const EU_DOC_LEGISLATION_COLUMNS = [
  tDoc('docs.EU_DoC.tables.applicable_legislation.columns.reference'),
  tDoc('docs.EU_DoC.tables.applicable_legislation.columns.type')
]
const EU_DOC_LEGISLATION_REFERENCE = EU_DOC_LEGISLATION_COLUMNS[0]
const EU_DOC_LEGISLATION_TYPE = EU_DOC_LEGISLATION_COLUMNS[1]
const EU_DOC_STANDARDS_COLUMNS = [
  tDoc('docs.EU_DoC.tables.standards_list.columns.standard'),
  tDoc('docs.EU_DoC.tables.standards_list.columns.title')
]
const EU_DOC_STANDARD_ID = EU_DOC_STANDARDS_COLUMNS[0]
const EU_DOC_STANDARD_TITLE = EU_DOC_STANDARDS_COLUMNS[1]

const RISK_REGISTER_COLUMNS = [
  tDoc('docs.Risk_Register.columns.hazard'),
  tDoc('docs.Risk_Register.columns.cause'),
  tDoc('docs.Risk_Register.columns.severity'),
  tDoc('docs.Risk_Register.columns.likelihood'),
  tDoc('docs.Risk_Register.columns.mitigation'),
  tDoc('docs.Risk_Register.columns.residual')
]

const TECH_FILE_COLUMNS = [
  tDoc('docs.TechFile_Checklist.columns.item'),
  tDoc('docs.TechFile_Checklist.columns.present'),
  tDoc('docs.TechFile_Checklist.columns.location')
]

const LABELS_COLUMNS = [
  tDoc('docs.Labels_Checklist.columns.mark'),
  tDoc('docs.Labels_Checklist.columns.applies'),
  tDoc('docs.Labels_Checklist.columns.notes')
]

const EPR_COUNTRIES_COLUMN = tDoc('docs.EPR_Info_Sheet.columns.country')
const EPR_AUTHORITY_COLUMN = tDoc('docs.EPR_Info_Sheet.columns.authority')
const EPR_SCHEME_COLUMN = tDoc('docs.EPR_Info_Sheet.columns.scheme')
const EPR_CATEGORY_COLUMN = tDoc('docs.EPR_Info_Sheet.columns.category')
const EPR_NOTES_COLUMN = tDoc('docs.EPR_Info_Sheet.columns.notes')

const USER_MANUAL_SPEC_COLUMNS = [
  tDoc('docs.User_Manual_Starter.columns.parameter'),
  tDoc('docs.User_Manual_Starter.columns.value')
]

const DOC_YES = tDoc('docs.common.fieldYes')
const DOC_NO = tDoc('docs.common.fieldNo')
const DOC_MAYBE = tDoc('docs.common.fieldMaybe')

const TECH_FILE_DEFAULT_ITEMS = [
  tDoc('docs.TechFile_Checklist.defaults.circuits'),
  tDoc('docs.TechFile_Checklist.defaults.bom'),
  tDoc('docs.TechFile_Checklist.defaults.testReports'),
  tDoc('docs.TechFile_Checklist.defaults.riskAssessment'),
  tDoc('docs.TechFile_Checklist.defaults.labels'),
  tDoc('docs.TechFile_Checklist.defaults.manual')
]

const LABELS_MARK_CE = tDoc('docs.Labels_Checklist.defaults.rows.ce_mark')
const LABELS_MARK_WEEE = tDoc('docs.Labels_Checklist.defaults.rows.weee')
const LABELS_MARK_BATTERY = tDoc('docs.Labels_Checklist.defaults.rows.battery')
const LABELS_MARK_ADDRESS = tDoc('docs.Labels_Checklist.defaults.rows.address')
const LABELS_MARK_MODEL = tDoc('docs.Labels_Checklist.defaults.rows.model')
const LABELS_MARK_TRIMAN = tDoc('docs.Labels_Checklist.defaults.rows.triman')
const LABELS_ADDRESS_NOTES = tDoc('docs.Labels_Checklist.defaults.rows.address_notes')

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'EU_DoC',
    title: tDoc('docs.EU_DoC.title'),
    description: tDoc('docs.EU_DoC.description'),
    exportable: ['pdf','docx'],
    fields: [
      { key: 'manufacturer_name', label: tDoc('docs.EU_DoC.fields.manufacturer_name'), type: 'text', required: true,
        auto: (ctx)=> (ctx.report.productSummary.role || '').toLowerCase().includes('importer')
          ? '' // importer signs on behalf of manufacturer (user to fill)
          : (ctx.answers['manufacturer_name'] as string) || '' },
      { key: 'manufacturer_address', label: tDoc('docs.EU_DoC.fields.manufacturer_address'), type: 'textarea', required: true,
        auto: (ctx)=> (ctx.answers['manufacturer_address'] as string) || '' },
      { key: 'product_name', label: tDoc('docs.EU_DoC.fields.product_name'), type: 'text', required: true,
        auto: (ctx)=> (ctx.answers['product_name'] as string) || '' },
      { key: 'product_model', label: tDoc('docs.EU_DoC.fields.product_model'), type: 'text',
        auto: (ctx)=> (ctx.answers['product_model'] as string) || '' },
      {
        key: 'applicable_legislation',
        label: tDoc('docs.EU_DoC.fields.applicable_legislation'),
        type: 'table',
        columns: EU_DOC_LEGISLATION_COLUMNS,
        auto: ctx => {
          const ids = ctx.report.rules.map(r => r.id)
          return ids.map((id, index) => ({
            [EU_DOC_LEGISLATION_REFERENCE]: id,
            [EU_DOC_LEGISLATION_TYPE]: ctx.report.rules[index]?.type ?? ''
          })) as any
        }
      },
      {
        key: 'standards_list',
        label: tDoc('docs.EU_DoC.fields.standards_list'),
        type: 'table',
        columns: EU_DOC_STANDARDS_COLUMNS,
        auto: ctx => ((ctx as any).standards?.map((standard: string) => ({
          [EU_DOC_STANDARD_ID]: standard,
          [EU_DOC_STANDARD_TITLE]: ''
        })) ?? []) as any
      },
      { key: 'place_date', label: tDoc('docs.EU_DoC.fields.place_date'), type: 'text',
        auto: (ctx)=> (ctx.answers['place_date'] as string) || ctx.nowISO.substring(0,10) },
      { key: 'name_title', label: tDoc('docs.EU_DoC.fields.name_title'), type: 'text',
        auto: (ctx)=> (ctx.answers['signatory'] as string) || '' },
      { key: 'signature', label: tDoc('docs.EU_DoC.fields.signature'), type: 'text', help: tDoc('docs.EU_DoC.fields.signature_help') }
    ],
    footerNotes: [
      tDoc('docs.EU_DoC.footers.0'),
      tDoc('docs.EU_DoC.footers.1')
    ]
  },

  {
    id: 'Risk_Register',
    title: tDoc('docs.Risk_Register.title'),
    description: tDoc('docs.Risk_Register.description'),
    exportable: ['pdf','docx'],
    fields: [
      { key: 'product', label: tDoc('docs.Risk_Register.fields.product'), type: 'text', auto: (c)=> (c.answers['product_name'] as string)||'' },
      { key: 'hazards', label: tDoc('docs.Risk_Register.fields.hazards'), type: 'table',
        columns: RISK_REGISTER_COLUMNS,
        auto: (_c)=> [] },
      { key: 'notes', label: tDoc('docs.Risk_Register.fields.notes'), type: 'textarea' }
    ]
  },

  {
    id: 'TechFile_Checklist',
    title: tDoc('docs.TechFile_Checklist.title'),
    description: tDoc('docs.TechFile_Checklist.description'),
    exportable: ['pdf'],
    fields: [
      { key: 'tf_items', label: tDoc('docs.TechFile_Checklist.fields.items'), type: 'table',
        columns: TECH_FILE_COLUMNS,
        auto: (_c)=> TECH_FILE_DEFAULT_ITEMS.map(item => ({
          [TECH_FILE_COLUMNS[0]]: item,
          [TECH_FILE_COLUMNS[1]]: '',
          [TECH_FILE_COLUMNS[2]]: ''
        })) as any }
    ]
  },

  {
    id: 'Labels_Checklist',
    title: tDoc('docs.Labels_Checklist.title'),
    description: tDoc('docs.Labels_Checklist.description'),
    exportable: ['pdf'],
    fields: [
      { key: 'labels_items', label: tDoc('docs.Labels_Checklist.fields.items'), type: 'table',
        columns: LABELS_COLUMNS,
        auto: (c)=> {
          const ids = c.report.rules.map(r=>r.id)
          const ceRelevant = ids.some(x=>['RED','EMC','LVD','RoHS','ToySafety','Machinery'].includes(x))
          const markets = c.report.productSummary.markets
          return [
            { [LABELS_COLUMNS[0]]: LABELS_MARK_CE, [LABELS_COLUMNS[1]]: ceRelevant ? DOC_YES : DOC_MAYBE, [LABELS_COLUMNS[2]]: '' },
            { [LABELS_COLUMNS[0]]: LABELS_MARK_WEEE, [LABELS_COLUMNS[1]]: ids.includes('WEEE') ? DOC_YES : DOC_NO, [LABELS_COLUMNS[2]]: '' },
            { [LABELS_COLUMNS[0]]: LABELS_MARK_BATTERY, [LABELS_COLUMNS[1]]: ids.includes('Batteries') ? DOC_YES : DOC_NO, [LABELS_COLUMNS[2]]: '' },
            { [LABELS_COLUMNS[0]]: LABELS_MARK_ADDRESS, [LABELS_COLUMNS[1]]: DOC_YES, [LABELS_COLUMNS[2]]: LABELS_ADDRESS_NOTES },
            { [LABELS_COLUMNS[0]]: LABELS_MARK_MODEL, [LABELS_COLUMNS[1]]: DOC_YES, [LABELS_COLUMNS[2]]: '' },
            { [LABELS_COLUMNS[0]]: LABELS_MARK_TRIMAN, [LABELS_COLUMNS[1]]: markets.includes('FR') ? DOC_YES : DOC_NO, [LABELS_COLUMNS[2]]: '' }
          ]
        } }
    ]
  },

  {
    id: 'EPR_Info_Sheet',
    title: tDoc('docs.EPR_Info_Sheet.title'),
    description: tDoc('docs.EPR_Info_Sheet.description'),
    exportable: ['pdf'],
    fields: [
      { key: 'countries', label: tDoc('docs.EPR_Info_Sheet.fields.countries'), type: 'multiselect',
        options: [], auto: (c)=> c.report.productSummary.markets },
      { key: 'per_country', label: tDoc('docs.EPR_Info_Sheet.fields.per_country'), type: 'table',
        columns: [EPR_COUNTRIES_COLUMN, EPR_AUTHORITY_COLUMN, EPR_SCHEME_COLUMN, EPR_CATEGORY_COLUMN, EPR_NOTES_COLUMN],
        auto: (c)=> {
          // consume COUNTRY_OBLIGATIONS entries and flatten
          const rows:any[] = []
          for (const code of c.report.productSummary.markets) {
            const regs = COUNTRY_OBLIGATIONS[code] || []
            for (const r of regs) rows.push({
              [EPR_COUNTRIES_COLUMN]: code,
              [EPR_AUTHORITY_COLUMN]: r.authority,
              [EPR_SCHEME_COLUMN]: r.name,
              [EPR_CATEGORY_COLUMN]: r.requiredFor.join(', '),
              [EPR_NOTES_COLUMN]: r.status === 'external' ? tDoc('docs.EPR_Info_Sheet.defaults.externalNote') : ''
            })
          }
          return rows
        } }
    ]
  },

  {
    id: 'User_Manual_Starter',
    title: tDoc('docs.User_Manual_Starter.title'),
    description: tDoc('docs.User_Manual_Starter.description'),
    exportable: ['pdf','docx'],
    fields: [
      { key: 'intro', label: tDoc('docs.User_Manual_Starter.fields.intro'), type: 'textarea',
        auto: (c)=> `${tDoc('docs.User_Manual_Starter.defaults.productLabel')}: ${(c.answers['product_name'] as string)||''}\n${tDoc('docs.User_Manual_Starter.defaults.modelLabel')}: ${(c.answers['product_model'] as string)||''}` },
      { key: 'safety', label: tDoc('docs.User_Manual_Starter.fields.safety'), type: 'textarea',
        auto: ()=> tDoc('docs.User_Manual_Starter.defaults.safety') },
      { key: 'specs', label: tDoc('docs.User_Manual_Starter.fields.specs'), type: 'table', columns: USER_MANUAL_SPEC_COLUMNS, auto: ()=> [] },
      { key: 'disposal', label: tDoc('docs.User_Manual_Starter.fields.disposal'), type: 'textarea',
        auto: (c)=> {
          const base = tDoc('docs.User_Manual_Starter.defaults.disposal')
          const extra = c.report.rules.find(r=>r.id==='WEEE') ? ` ${tDoc('docs.User_Manual_Starter.defaults.weeeNote')}` : ''
          return `${base}${extra}`
        } }
    ]
  }
]

export default TEMPLATES
