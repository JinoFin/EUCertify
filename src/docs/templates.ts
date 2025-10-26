import { COUNTRY_OBLIGATIONS } from '../data/countryObligations'
import { DocTemplate } from './types'

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'EU_DoC',
    title: 'EU Declaration of Conformity',
    description: 'Legal statement that the product meets listed EU legislation.',
    exportable: ['pdf','docx'],
    fields: [
      { key: 'manufacturer_name', label: 'Manufacturer Name', type: 'text', required: true,
        auto: (ctx)=> (ctx.report.productSummary.role || '').toLowerCase().includes('importer')
          ? '' // importer signs on behalf of manufacturer (user to fill)
          : (ctx.answers['manufacturer_name'] as string) || '' },
      { key: 'manufacturer_address', label: 'Manufacturer Address', type: 'textarea', required: true,
        auto: (ctx)=> (ctx.answers['manufacturer_address'] as string) || '' },
      { key: 'product_name', label: 'Product Name/Description', type: 'text', required: true,
        auto: (ctx)=> (ctx.answers['product_name'] as string) || '' },
      { key: 'product_model', label: 'Model / Type', type: 'text',
        auto: (ctx)=> (ctx.answers['product_model'] as string) || '' },
      {
        key: 'applicable_legislation',
        label: 'Applicable EU Legislation',
        type: 'table',
        columns: ['ID', 'Type'],
        auto: ctx => {
          const ids = ctx.report.rules.map(r => r.id)
          return ids.map((id, index) => ({ ID: id, Type: ctx.report.rules[index]?.type ?? '' })) as any
        }
      },
      {
        key: 'standards_list',
        label: 'Standards Applied',
        type: 'table',
        columns: ['EN Standard', 'Title'],
        auto: ctx => ((ctx as any).standards?.map((standard: string) => ({ 'EN Standard': standard, Title: '' })) ?? []) as any
      },
      { key: 'place_date', label: 'Place & Date of Declaration', type: 'text',
        auto: (ctx)=> (ctx.answers['place_date'] as string) || ctx.nowISO.substring(0,10) },
      { key: 'name_title', label: 'Name and Title of signatory', type: 'text',
        auto: (ctx)=> (ctx.answers['signatory'] as string) || '' },
      { key: 'signature', label: 'Signature', type: 'text', help: 'Typed name is acceptable for draft.' }
    ],
    footerNotes: [
      'This DoC covers the product as described and listed legislation.',
      'Keep the signed DoC with the Technical File for 10 years.'
    ]
  },

  {
    id: 'Risk_Register',
    title: 'General Risk Assessment Register',
    description: 'Identifies foreseeable hazards and mitigations.',
    exportable: ['pdf','docx'],
    fields: [
      { key: 'product', label: 'Product', type: 'text', auto: (c)=> (c.answers['product_name'] as string)||'' },
      { key: 'hazards', label: 'Hazards Table', type: 'table',
        columns: ['Hazard','Cause','Severity','Likelihood','Mitigation','Residual Risk'],
        auto: (_c)=> [] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },

  {
    id: 'TechFile_Checklist',
    title: 'Technical File Checklist',
    description: 'Evidence to maintain for market surveillance.',
    exportable: ['pdf'],
    fields: [
      { key: 'tf_items', label: 'Items', type: 'table',
        columns: ['Item','Present?','Location/Reference'],
        auto: (_c)=> [
          { Item:'Circuit diagrams / drawings', 'Present?':'', 'Location/Reference':'' },
          { Item:'BOM / critical components', 'Present?':'', 'Location/Reference':'' },
          { Item:'Test reports (EMC/LVD/RED)', 'Present?':'', 'Location/Reference':'' },
          { Item:'Risk assessment', 'Present?':'', 'Location/Reference':'' },
          { Item:'Labels & markings', 'Present?':'', 'Location/Reference':'' },
          { Item:'User manual', 'Present?':'', 'Location/Reference':'' }
        ] as any }
    ]
  },

  {
    id: 'Labels_Checklist',
    title: 'Labels & Markings Checklist',
    description: 'CE, WEEE/Battery symbols, traceability, warnings, Triman where required.',
    exportable: ['pdf'],
    fields: [
      { key: 'labels_items', label: 'Checklist', type: 'table',
        columns: ['Label/Mark','Applies?','Notes'],
        auto: (c)=> {
          const ids = c.report.rules.map(r=>r.id)
          const rows:any[] = [
            { 'Label/Mark':'CE mark','Applies?': ids.some(x=>['RED','EMC','LVD','RoHS','ToySafety','Machinery'].includes(x))?'Yes':'Maybe','Notes':'' },
            { 'Label/Mark':'WEEE bin','Applies?': ids.includes('WEEE')?'Yes':'No','Notes':'' },
            { 'Label/Mark':'Battery symbol','Applies?': ids.includes('Batteries')?'Yes':'No','Notes':'' },
            { 'Label/Mark':'Manufacturer & Importer address','Applies?':'Yes','Notes':'Importer required if non-EU manufacturer' },
            { 'Label/Mark':'Model/Serial/Batch','Applies?':'Yes','Notes':'' },
            { 'Label/Mark':'Triman + Info-Tri (FR)','Applies?': c.report.productSummary.markets.includes('FR')?'Yes':'No','Notes':'' }
          ]
          return rows
        } }
    ]
  },

  {
    id: 'EPR_Info_Sheet',
    title: 'EPR Registration Info Sheet',
    description: 'Per-country checklist for WEEE, Battery, and Packaging registrations.',
    exportable: ['pdf'],
    fields: [
      { key: 'countries', label: 'Selected Countries', type: 'multiselect',
        options: [], auto: (c)=> c.report.productSummary.markets },
      { key: 'per_country', label: 'Registrations', type: 'table',
        columns: ['Country','Authority/PRO','Scheme','Category','Notes'],
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
              Notes: r.status === 'external' ? 'Register with authority/PRO' : ''
            })
          }
          return rows
        } }
    ]
  },

  {
    id: 'User_Manual_Starter',
    title: 'User Manual – Starter Outline',
    description: 'Skeleton sections and mandatory safety info placeholders.',
    exportable: ['pdf','docx'],
    fields: [
      { key: 'intro', label: 'Introduction', type: 'textarea',
        auto: (c)=> `Product: ${(c.answers['product_name'] as string)||''}\nModel: ${(c.answers['product_model'] as string)||''}` },
      { key: 'safety', label: 'Safety Information', type: 'textarea',
        auto: ()=> 'Read all instructions. Keep away from moisture. Use only specified power supply...' },
      { key: 'specs', label: 'Specifications', type: 'table', columns: ['Parameter','Value'], auto: ()=> [] },
      { key: 'disposal', label: 'Disposal / Recycling', type: 'textarea',
        auto: (c)=> `Do not dispose of in household waste. ${c.report.rules.find(r=>r.id==='WEEE')?'WEEE obligations apply.':''}` }
    ]
  }
]

export default TEMPLATES
