import type { DocumentRequirement } from '@/domain/types'

export const DOCUMENT_CATALOG: DocumentRequirement[] = [
  {
    docId: 'doc_eu_doc',
    name: 'EU Declaration of Conformity (DoC)',
    description: 'Legal statement that the product meets the listed EU directives/regulations.',
    requiredBy: ['RED', 'EMC', 'LVD', 'RoHS', 'ToySafety', 'Machinery', 'GPSR'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'generate',
    notes: ['Must be signed by the manufacturer or authorized signatory']
  },
  {
    docId: 'doc_tech_file',
    name: 'Technical File',
    description: 'Design, test reports, risk assessment, BOM, drawings—kept available for authorities.',
    requiredBy: ['RED', 'EMC', 'LVD', 'RoHS', 'ToySafety', 'Machinery', 'GPSR'],
    provider: 'Manufacturer',
    status: 'upload',
    exportAction: 'checklist',
    notes: ['Keep for 10 years after last unit placed on market']
  },
  {
    docId: 'doc_user_manual',
    name: 'User Manual & Safety Info',
    description: 'Instructions and warnings in required languages for safe use.',
    requiredBy: ['RED', 'EMC', 'LVD', 'ToySafety', 'GPSR'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'template',
    notes: ['Language requirements depend on target countries']
  },
  {
    docId: 'test_emc',
    name: 'EMC Test Report',
    description: 'Emissions & immunity tests per EN 61000 series.',
    requiredBy: ['EMC', 'RED'],
    provider: 'Lab',
    status: 'external',
    notes: ['Accredited test lab recommended']
  },
  {
    docId: 'test_lvd',
    name: 'Electrical Safety Test Report (LVD)',
    description: 'Safety testing to relevant standard (e.g., EN 62368-1).',
    requiredBy: ['LVD', 'RED'],
    provider: 'Lab',
    status: 'external'
  },
  {
    docId: 'test_red_rf',
    name: 'Radio (RF) Test Report',
    description: 'Spectrum and radio performance results for wireless features.',
    requiredBy: ['RED'],
    provider: 'Lab',
    status: 'external',
    notes: ['Notified Body may be required if no full EN coverage']
  },
  {
    docId: 'doc_risk',
    name: 'General Risk Assessment',
    description: 'Assessment of foreseeable hazards and mitigations.',
    requiredBy: ['GPSR', 'ToySafety', 'Machinery'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'template'
  },
  {
    docId: 'doc_material_rohs',
    name: 'RoHS Material Declarations',
    description: 'Supplier declarations or XRF/chemical tests for restricted substances.',
    requiredBy: ['RoHS'],
    provider: 'Supplier',
    status: 'upload'
  },
  {
    docId: 'label_ce_trace',
    name: 'Product Labels & Markings',
    description: 'CE mark, model/serial/batch, manufacturer/importer details, WEEE/Battery symbols.',
    requiredBy: ['RED', 'EMC', 'LVD', 'RoHS', 'WEEE', 'Batteries', 'Packaging', 'ToySafety', 'Machinery'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'checklist'
  },
  {
    docId: 'epr_weee_reg',
    name: 'WEEE Producer Registration',
    description: 'Register as an EEE producer in each target market.',
    requiredBy: ['WEEE'],
    provider: 'Authority/PRO',
    status: 'external'
  },
  {
    docId: 'epr_battery_reg',
    name: 'Battery Producer Registration',
    description: 'Register batteries placed on the market and report volumes.',
    requiredBy: ['Batteries'],
    provider: 'Authority/PRO',
    status: 'external'
  },
  {
    docId: 'epr_packaging_reg',
    name: 'Packaging Producer Registration',
    description: 'Join packaging scheme and report packaging placed on market.',
    requiredBy: ['Packaging'],
    provider: 'Authority/PRO',
    status: 'external'
  }
]

export default DOCUMENT_CATALOG
