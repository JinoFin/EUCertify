import { LegislationItem } from '@/docs/types'
import { t } from '@/i18n'

export const LEGISLATION_CATALOG: LegislationItem[] = [
  {
    id: 'RED',
    type: 'Directive',
    title: t('legislation.RED.title', 'Radio Equipment Directive (2014/53/EU)'),
    category: 'CE Directives',
    short: t(
      'legislation.RED.short',
      'Covers equipment with wireless/radio functions (Bluetooth, Wi-Fi, cellular).'
    ),
    defaultSelected: true,
  },
  {
    id: 'EMC',
    type: 'Directive',
    title: t('legislation.EMC.title', 'Electromagnetic Compatibility (2014/30/EU)'),
    category: 'CE Directives',
    short: t(
      'legislation.EMC.short',
      'Controls emissions/immunity so devices don’t interfere with others.'
    ),
    defaultSelected: true,
  },
  {
    id: 'LVD',
    type: 'Directive',
    title: t('legislation.LVD.title', 'Low Voltage Directive (2014/35/EU)'),
    category: 'CE Directives',
    short: t('legislation.LVD.short', 'Electrical safety for equipment within specified voltage ranges.'),
    defaultSelected: true,
  },
  {
    id: 'RoHS',
    type: 'Directive',
    title: t('legislation.RoHS.title', 'RoHS (2011/65/EU)'),
    category: 'CE Directives',
    short: t('legislation.RoHS.short', 'Restricts hazardous substances in EEE.'),
    defaultSelected: true,
  },
  {
    id: 'ToySafety',
    type: 'Directive',
    title: t('legislation.ToySafety.title', 'Toy Safety (2009/48/EC)'),
    category: 'CE Directives',
    short: t('legislation.ToySafety.short', 'Safety of toys intended for children under 14.'),
  },
  {
    id: 'Machinery',
    type: 'Directive',
    title: t('legislation.Machinery.title', 'Machinery (2006/42/EC)'),
    category: 'CE Directives',
    short: t('legislation.Machinery.short', 'Mechanical & control safety for machinery.'),
  },
  {
    id: 'GPSR',
    type: 'Regulation',
    title: t('legislation.GPSR.title', 'General Product Safety Regulation (EU) 2023/988'),
    category: 'Horizontal',
    short: t(
      'legislation.GPSR.short',
      'Ensures consumer products are safe under normal and foreseeable use.'
    ),
    defaultSelected: true,
  },
  {
    id: 'REACH',
    type: 'Horizontal',
    title: t('legislation.REACH.title', 'REACH (EC 1907/2006)'),
    category: 'Horizontal',
    short: t('legislation.REACH.short', 'Chemical restrictions and SVHC communication for articles.'),
  },
  {
    id: 'WEEE',
    type: 'EPR',
    title: t('legislation.WEEE.title', 'WEEE (2012/19/EU)'),
    category: 'EPR',
    short: t(
      'legislation.WEEE.short',
      'Producer responsibility for end-of-life electronics (registration/markings).'
    ),
  },
  {
    id: 'Batteries',
    type: 'EPR',
    title: t('legislation.Batteries.title', 'Battery Regulation (EU) 2023/1542'),
    category: 'EPR',
    short: t(
      'legislation.Batteries.short',
      'Producer responsibility for batteries, labeling & reporting.'
    ),
  },
  {
    id: 'Packaging',
    type: 'EPR',
    title: t('legislation.Packaging.title', 'Packaging & Packaging Waste (94/62/EC)'),
    category: 'EPR',
    short: t(
      'legislation.Packaging.short',
      'Producer responsibility for packaging; national registrations (e.g., LUCID, CITEO).'
    ),
  },
]
export default LEGISLATION_CATALOG
