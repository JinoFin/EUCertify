import { ENStandardItem } from '@/docs/types'
import { t } from '@/i18n'

export const STANDARDS_CATALOG: ENStandardItem[] = [
  {
    en: 'EN 62368-1',
    title: t('standards.EN_62368_1.title', 'AV/ICT equipment – Safety requirements'),
    category: 'Safety',
    appliesTo: ['LVD', 'RED'],
    short: t('standards.EN_62368_1.short', 'General safety for IT/AV electronics.'),
    defaultSelected: true,
  },
  {
    en: 'EN 60335-1',
    title: t('standards.EN_60335_1.title', 'Household and similar electrical appliances – Safety'),
    category: 'Safety',
    appliesTo: ['LVD'],
    short: t('standards.EN_60335_1.short', 'Safety for household appliances.'),
  },
  {
    en: 'EN 301 489-1',
    title: t('standards.EN_301_489_1.title', 'EMC standard for radio equipment – Common requirements'),
    category: 'EMC',
    appliesTo: ['EMC', 'RED'],
    short: t('standards.EN_301_489_1.short', 'EMC immunity/emissions for radio devices.'),
    defaultSelected: true,
  },
  {
    en: 'EN 301 489-17',
    title: t('standards.EN_301_489_17.title', 'EMC for 2.4/5 GHz ISM band (Wi-Fi/Bluetooth)'),
    category: 'EMC',
    appliesTo: ['RED'],
    short: t('standards.EN_301_489_17.short', 'EMC parts for Wi-Fi/Bluetooth radios.'),
  },
  {
    en: 'EN 300 328',
    title: t('standards.EN_300_328.title', '2.4 GHz wideband transmission systems'),
    category: 'Radio',
    appliesTo: ['RED'],
    short: t('standards.EN_300_328.short', 'RF performance for Bluetooth/Wi-Fi 2.4 GHz.'),
    defaultSelected: true,
  },
  {
    en: 'EN 62311',
    title: t(
      'standards.EN_62311.title',
      'Assessment of electronic/electrical equipment related to human exposure'
    ),
    category: 'Radio',
    appliesTo: ['RED'],
    short: t('standards.EN_62311.short', 'EMF exposure assessment for radio devices.'),
  },
  {
    en: 'EN IEC 63000',
    title: t('standards.EN_IEC_63000.title', 'Technical documentation for RoHS compliance'),
    category: 'Chemical',
    appliesTo: ['RoHS'],
    short: t('standards.EN_IEC_63000.short', 'Material assessment/tech doc for RoHS.'),
  },
  {
    en: 'EN 71-1',
    title: t('standards.EN_71_1.title', 'Safety of toys – Mechanical/physical properties'),
    category: 'Toy',
    appliesTo: ['ToySafety'],
    short: t('standards.EN_71_1.short', 'Core mechanical safety tests for toys.'),
  },
  {
    en: 'EN 62115',
    title: t('standards.EN_62115.title', 'Electric toys – Safety'),
    category: 'Toy',
    appliesTo: ['ToySafety'],
    short: t('standards.EN_62115.short', 'Electrical toy safety.'),
  },
  {
    en: 'EN ISO 12100',
    title: t('standards.EN_ISO_12100.title', 'Safety of machinery – Risk assessment'),
    category: 'Machinery',
    appliesTo: ['Machinery'],
    short: t('standards.EN_ISO_12100.short', 'Framework for machinery risk assessment.'),
  },
  {
    en: 'EN 60204-1',
    title: t(
      'standards.EN_60204_1.title',
      'Safety of machinery – Electrical equipment of machines'
    ),
    category: 'Machinery',
    appliesTo: ['Machinery'],
    short: t('standards.EN_60204_1.short', 'Electrical safety for machinery.'),
  },
]
export default STANDARDS_CATALOG
