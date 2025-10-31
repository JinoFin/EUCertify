import COUNTRY_OBLIGATIONS from '@/data/countryObligations'
import { LEGISLATION_CATALOG } from '@/data/legislationCatalog'
import STANDARDS_CATALOG from '@/data/standardsCatalog'
import { tDoc } from '@/i18n'
import { DocTemplate } from './types'

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'EU_DoC',
    title: tDoc('docs.templates.euDoc.title', 'EU Declaration of Conformity'),
    description: tDoc(
      'docs.templates.euDoc.description',
      'Legal statement that the product meets listed EU legislation.'
    ),
    exportable: ['pdf','docx'],
    fields: [
      { key: 'manufacturer_name', label: tDoc('docs.templates.euDoc.fields.manufacturer_name', 'Manufacturer Name'), type: 'text', required: true,
        auto: (ctx)=> (ctx.report.productSummary.role || '').toLowerCase().includes('importer')
          ? '' // importer signs on behalf of manufacturer (user to fill)
          : (ctx.answers['manufacturer_name'] as string) || '' },
      { key: 'manufacturer_address', label: tDoc('docs.templates.euDoc.fields.manufacturer_address', 'Manufacturer Address'), type: 'textarea', required: true,
        auto: (ctx)=> (ctx.answers['manufacturer_address'] as string) || '' },
      { key: 'product_name', label: tDoc('docs.templates.euDoc.fields.product_name', 'Product Name/Description'), type: 'text', required: true,
        auto: (ctx)=> (ctx.answers['product_name'] as string) || '' },
      { key: 'product_model', label: tDoc('docs.templates.euDoc.fields.product_model', 'Model / Type'), type: 'text',
        auto: (ctx)=> (ctx.answers['product_model'] as string) || '' },
      {
        key: 'applicable_legislation',
        label: tDoc('docs.templates.euDoc.fields.applicable_legislation', 'Applicable EU Legislation'),
        type: 'table',
        columns: [
          tDoc('docs.templates.euDoc.columns.id', 'ID'),
          tDoc('docs.templates.euDoc.columns.type', 'Type')
        ],
        auto: ctx => {
          const ids = ctx.auto?.applicableLegislation?.length
            ? ctx.auto.applicableLegislation
            : ctx.report.rules.map(r => r.id)
          return Array.from(new Set(ids)).map(id => {
            const meta = LEGISLATION_CATALOG.find(item => item.id === id)
            return { ID: id, Type: meta?.type ?? '' }
          }) as any
        }
      },
      {
        key: 'standards_list',
        label: tDoc('docs.templates.euDoc.fields.standards_list', 'Standards Applied'),
        type: 'table',
        columns: [
          tDoc('docs.templates.euDoc.columns.standard', 'EN Standard'),
          tDoc('docs.templates.euDoc.columns.title', 'Title')
        ],
        auto: ctx => {
          const source = ctx.auto?.applicableStandards?.length
            ? ctx.auto.applicableStandards
            : Array.from(new Set(((ctx as any).standards || []) as string[]))
          return Array.from(new Set(source)).map((standard: string) => ({
            'EN Standard': standard,
            Title: STANDARDS_CATALOG.find(entry => entry.en === standard)?.title || ''
          })) as any
        }
      },
      { key: 'place_date', label: tDoc('docs.templates.euDoc.fields.place_date', 'Place & Date of Declaration'), type: 'text',
        auto: (ctx)=> (ctx.answers['place_date'] as string) || ctx.nowISO.substring(0,10) },
      { key: 'name_title', label: tDoc('docs.templates.euDoc.fields.name_title', 'Name and Title of signatory'), type: 'text',
        auto: (ctx)=> (ctx.answers['signatory'] as string) || '' },
      { key: 'signature', label: tDoc('docs.templates.euDoc.fields.signature', 'Signature'), type: 'text', help: tDoc('docs.templates.euDoc.fields.signature.help', 'Typed name is acceptable for draft.') }
    ],
    footerNotes: [
      tDoc('docs.templates.euDoc.footer.0', 'This DoC covers the product as described and listed legislation.'),
      tDoc('docs.templates.euDoc.footer.1', 'Keep the signed DoC with the Technical File for 10 years.')
    ]
  },

  {
    id: 'Risk_Register',
    title: tDoc('docs.templates.risk.title', 'General Risk Assessment Register'),
    description: tDoc('docs.templates.risk.description', 'Identifies foreseeable hazards and mitigations.'),
    exportable: ['pdf','docx'],
    fields: [
      { key: 'product', label: tDoc('docs.templates.risk.fields.product', 'Product'), type: 'text', auto: (c)=> (c.answers['product_name'] as string)||'' },
      { key: 'hazards', label: tDoc('docs.templates.risk.fields.hazards', 'Hazards Table'), type: 'table',
        columns: [
          tDoc('docs.templates.risk.columns.hazard', 'Hazard'),
          tDoc('docs.templates.risk.columns.cause', 'Cause'),
          tDoc('docs.templates.risk.columns.severity', 'Severity'),
          tDoc('docs.templates.risk.columns.likelihood', 'Likelihood'),
          tDoc('docs.templates.risk.columns.mitigation', 'Mitigation'),
          tDoc('docs.templates.risk.columns.residual', 'Residual Risk')
        ],
        auto: (_c)=> [] },
      { key: 'notes', label: tDoc('docs.templates.risk.fields.notes', 'Notes'), type: 'textarea' }
    ]
  },

  {
    id: 'TechFile_Checklist',
    title: tDoc('docs.templates.techfile.title', 'Technical File Checklist'),
    description: tDoc('docs.templates.techfile.description', 'Evidence to maintain for market surveillance.'),
    exportable: ['pdf'],
    fields: [
      { key: 'tf_items', label: tDoc('docs.templates.techfile.fields.items', 'Items'), type: 'table',
        columns: [
          tDoc('docs.templates.techfile.columns.item', 'Item'),
          tDoc('docs.templates.techfile.columns.present', 'Present?'),
          tDoc('docs.templates.techfile.columns.location', 'Location/Reference')
        ],
        auto: (_c)=> [
          { Item: tDoc('docs.templates.techfile.defaults.circuit', 'Circuit diagrams / drawings'), 'Present?':'', 'Location/Reference':'' },
          { Item: tDoc('docs.templates.techfile.defaults.bom', 'BOM / critical components'), 'Present?':'', 'Location/Reference':'' },
          { Item: tDoc('docs.templates.techfile.defaults.tests', 'Test reports (EMC/LVD/RED)'), 'Present?':'', 'Location/Reference':'' },
          { Item: tDoc('docs.templates.techfile.defaults.risk', 'Risk assessment'), 'Present?':'', 'Location/Reference':'' },
          { Item: tDoc('docs.templates.techfile.defaults.labels', 'Labels & markings'), 'Present?':'', 'Location/Reference':'' },
          { Item: tDoc('docs.templates.techfile.defaults.manual', 'User manual'), 'Present?':'', 'Location/Reference':'' }
        ] as any }
    ]
  },

  {
    id: 'Labels_Checklist',
    title: tDoc('docs.templates.labels.title', 'Labels & Markings Checklist'),
    description: tDoc(
      'docs.templates.labels.description',
      'CE, WEEE/Battery symbols, traceability, warnings, Triman where required.'
    ),
    exportable: ['pdf'],
    fields: [
      { key: 'labels_items', label: tDoc('docs.templates.labels.fields.items', 'Checklist'), type: 'table',
        columns: [
          tDoc('docs.templates.labels.columns.label', 'Label/Mark'),
          tDoc('docs.templates.labels.columns.applies', 'Applies?'),
          tDoc('docs.templates.labels.columns.notes', 'Notes')
        ],
        auto: (c)=> {
          const ids = c.report.rules.map(r=>r.id)
          const rows:any[] = [
            { 'Label/Mark': tDoc('docs.templates.labels.defaults.ce', 'CE mark'), 'Applies?': ids.some(x=>['RED','EMC','LVD','RoHS','ToySafety','Machinery'].includes(x))?tDoc('doc.field.yes', 'Yes'):tDoc('docs.templates.labels.defaults.maybe', 'Maybe'), 'Notes':'' },
            { 'Label/Mark': tDoc('docs.templates.labels.defaults.weee', 'WEEE bin'), 'Applies?': ids.includes('WEEE')?tDoc('doc.field.yes', 'Yes'):tDoc('doc.field.no', 'No'), 'Notes':'' },
            { 'Label/Mark': tDoc('docs.templates.labels.defaults.battery', 'Battery symbol'), 'Applies?': ids.includes('Batteries')?tDoc('doc.field.yes', 'Yes'):tDoc('doc.field.no', 'No'), 'Notes':'' },
            { 'Label/Mark': tDoc('docs.templates.labels.defaults.address', 'Manufacturer & Importer address'), 'Applies?': tDoc('doc.field.yes', 'Yes'), 'Notes': tDoc('docs.templates.labels.defaults.addressNote', 'Importer required if non-EU manufacturer') },
            { 'Label/Mark': tDoc('docs.templates.labels.defaults.traceability', 'Model/Serial/Batch'), 'Applies?': tDoc('doc.field.yes', 'Yes'), 'Notes':'' },
            { 'Label/Mark': tDoc('docs.templates.labels.defaults.triman', 'Triman + Info-Tri (FR)'), 'Applies?': c.report.productSummary.markets.includes('FR')?tDoc('doc.field.yes', 'Yes'):tDoc('doc.field.no', 'No'), 'Notes':'' }
          ]
          return rows
        } }
    ]
  },

  {
    id: 'EPR_Info_Sheet',
    title: tDoc('docs.templates.epr.title', 'EPR Registration Info Sheet'),
    description: tDoc(
      'docs.templates.epr.description',
      'Per-country checklist for WEEE, Battery, and Packaging registrations.'
    ),
    exportable: ['pdf'],
    fields: [
      { key: 'countries', label: tDoc('docs.templates.epr.fields.countries', 'Selected Countries'), type: 'multiselect',
        options: [], auto: (c)=> c.report.productSummary.markets },
      { key: 'per_country', label: tDoc('docs.templates.epr.fields.registrations', 'Registrations'), type: 'table',
        columns: [
          tDoc('docs.templates.epr.columns.country', 'Country'),
          tDoc('docs.templates.epr.columns.authority', 'Authority/PRO'),
          tDoc('docs.templates.epr.columns.scheme', 'Scheme'),
          tDoc('docs.templates.epr.columns.category', 'Category'),
          tDoc('docs.templates.epr.columns.notes', 'Notes')
        ],
        auto: (c)=> {
          // consume COUNTRY_OBLIGATIONS entries and flatten
          const rows:any[] = []
          for (const code of c.report.productSummary.markets) {
            const regs = COUNTRY_OBLIGATIONS[code] || []
            for (const r of regs) rows.push({
              Country: code,
              'Authority/PRO': r.authority,
              Scheme: r.name,
              Category: r.requiredFor.join(', '),
              Notes: r.status === 'external' ? tDoc('docs.templates.epr.defaults.externalNote', 'Register with authority/PRO') : ''
            })
          }
          return rows
        } }
    ]
  },

  {
    id: 'User_Manual_Starter',
    title: tDoc('docs.templates.manual.title', 'User Manual – Starter Outline'),
    description: tDoc(
      'docs.templates.manual.description',
      'Skeleton sections and mandatory safety info placeholders.'
    ),
    exportable: ['pdf','docx'],
    fields: [
      { key: 'intro', label: tDoc('docs.templates.manual.fields.intro', 'Introduction'), type: 'textarea',
        auto: (c)=>
          tDoc(
            'docs.templates.manual.defaults.intro',
            'Product: {product}\nModel: {model}'
          )
            .replace('{product}', (c.answers['product_name'] as string) || '')
            .replace('{model}', (c.answers['product_model'] as string) || '') },
      { key: 'safety', label: tDoc('docs.templates.manual.fields.safety', 'Safety Information'), type: 'textarea',
        auto: ()=> tDoc('docs.templates.manual.defaults.safety', 'Read all instructions. Keep away from moisture. Use only specified power supply...') },
      { key: 'specs', label: tDoc('docs.templates.manual.fields.specs', 'Specifications'), type: 'table', columns: [tDoc('docs.templates.manual.columns.parameter', 'Parameter'), tDoc('docs.templates.manual.columns.value', 'Value')], auto: ()=> [] },
      { key: 'disposal', label: tDoc('docs.templates.manual.fields.disposal', 'Disposal / Recycling'), type: 'textarea',
        auto: (c)=> {
          const base = tDoc('docs.templates.manual.defaults.disposal', 'Do not dispose of in household waste.')
          const tail = c.report.rules.find(r=>r.id==='WEEE')
            ? ` ${tDoc('docs.templates.manual.defaults.weee', 'WEEE obligations apply.')}`
            : ''
          return `${base}${tail}`
        } }
    ]
  }
]

export default TEMPLATES
