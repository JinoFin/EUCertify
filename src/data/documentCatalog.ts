import type { DocumentRequirement } from '@/domain/types'
import { t } from '@/i18n'

export const DOCUMENT_CATALOG: DocumentRequirement[] = [
  {
    docId: 'doc_eu_doc',
    name: t('docs.cards.declaration.title', 'EU Declaration of Conformity (DoC)'),
    description: t(
      'docs.cards.declaration.desc',
      'Legal statement that the product meets the listed EU directives/regulations.'
    ),
    requiredBy: ['RED', 'EMC', 'LVD', 'RoHS', 'ToySafety', 'Machinery', 'GPSR'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'generate',
    notes: ['Must be signed by the manufacturer or authorized signatory']
  },
  {
    docId: 'doc_tech_file',
    name: t('docs.cards.tf.title', 'Technical File'),
    description: t(
      'docs.cards.tf.desc',
      'Evidence and technical documentation kept available for authorities.'
    ),
    requiredBy: ['RED', 'EMC', 'LVD', 'RoHS', 'ToySafety', 'Machinery', 'GPSR'],
    provider: 'Manufacturer',
    status: 'upload',
    exportAction: 'checklist',
    notes: ['Keep for 10 years after last unit placed on market']
  },
  {
    docId: 'doc_user_manual',
    name: t('docs.cards.manual.title', 'User Manual & Safety Info'),
    description: t(
      'docs.cards.manual.desc',
      'Instructions and mandatory safety information placeholders.'
    ),
    requiredBy: ['RED', 'EMC', 'LVD', 'ToySafety', 'GPSR'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'template',
    notes: ['Language requirements depend on target countries']
  },
  {
    docId: 'test_emc',
    name: t('docs.cards.emcReport.title', 'EMC Test Report'),
    description: t('docs.cards.emcReport.desc', 'Emissions & immunity tests per EN 61000 series.'),
    requiredBy: ['EMC', 'RED'],
    provider: 'Lab',
    status: 'external',
    notes: ['Accredited test lab recommended']
  },
  {
    docId: 'test_lvd',
    name: t('docs.cards.lvdReport.title', 'Electrical Safety Test Report (LVD)'),
    description: t(
      'docs.cards.lvdReport.desc',
      'Safety testing to relevant standard (e.g., EN 62368-1).'
    ),
    requiredBy: ['LVD', 'RED'],
    provider: 'Lab',
    status: 'external'
  },
  {
    docId: 'test_red_rf',
    name: t('docs.cards.radioReport.title', 'Radio (RF) Test Report'),
    description: t(
      'docs.cards.radioReport.desc',
      'Spectrum and radio performance results for wireless features.'
    ),
    requiredBy: ['RED'],
    provider: 'Lab',
    status: 'external',
    notes: ['Notified Body may be required if no full EN coverage']
  },
  {
    docId: 'doc_risk',
    name: t('docs.cards.grar.title', 'General Risk Assessment'),
    description: t('docs.cards.grar.desc', 'Assessment of foreseeable hazards and mitigations.'),
    requiredBy: ['GPSR', 'ToySafety', 'Machinery'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'template'
  },
  {
    docId: 'doc_material_rohs',
    name: t('docs.cards.rohs.title', 'RoHS Material Declarations'),
    description: t(
      'docs.cards.rohs.desc',
      'Supplier declarations or XRF/chemical tests for restricted substances.'
    ),
    requiredBy: ['RoHS'],
    provider: 'Supplier',
    status: 'upload'
  },
  {
    docId: 'label_ce_trace',
    name: t('docs.cards.labels.title', 'Product Labels & Markings'),
    description: t(
      'docs.cards.labels.desc',
      'CE mark, traceability data, WEEE/Battery symbols, warnings.'
    ),
    requiredBy: ['RED', 'EMC', 'LVD', 'RoHS', 'WEEE', 'Batteries', 'Packaging', 'ToySafety', 'Machinery'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'checklist'
  },
  {
    docId: 'epr_weee_reg',
    name: t('docs.cards.epr.title', 'EPR Registration Info Sheet'),
    description: t(
      'docs.cards.epr.desc',
      'Per-country checklist for WEEE, Battery, and Packaging registrations.'
    ),
    requiredBy: ['WEEE'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'generate',
    notes: ['Use the generated info sheet to capture PRO registration details before applying.']
  },
  {
    docId: 'epr_battery_reg',
    name: t('docs.cards.epr.title', 'EPR Registration Info Sheet'),
    description: t(
      'docs.cards.epr.desc',
      'Per-country checklist for WEEE, Battery, and Packaging registrations.'
    ),
    requiredBy: ['Batteries'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'generate',
    notes: ['Capture PRO account details, categories, and reporting cadence.']
  },
  {
    docId: 'epr_packaging_reg',
    name: t('docs.cards.epr.title', 'EPR Registration Info Sheet'),
    description: t(
      'docs.cards.epr.desc',
      'Per-country checklist for WEEE, Battery, and Packaging registrations.'
    ),
    requiredBy: ['Packaging'],
    provider: 'Manufacturer',
    status: 'exportable',
    exportAction: 'generate',
    notes: ['Use this worksheet to plan scheme selection and account setup.']
  }
]

export default DOCUMENT_CATALOG
