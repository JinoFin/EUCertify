export type Tag =
  | 'EEE'
  | 'RED'
  | 'EMC'
  | 'LVD'
  | 'RoHS'
  | 'WEEE'
  | 'BATTERY'
  | 'TOY'
  | 'MACHINERY'
  | 'GAS'
  | 'PRESSURE'
  | 'MEASURING'
  | 'FOOD_CONTACT'
  | 'COSMETIC'
  | 'CHEMICAL'
  | 'PPE'
  | 'MEDICAL'
  | 'IVD'
  | 'CONSTRUCTION'
  | 'OUTDOOR_NOISE'
  | 'PYRO'
  | 'GPSR'

export type AnswerValue = string | boolean | string[] | null

export interface Question {
  id: string
  type:
    | 'text'
    | 'textarea'
    | 'boolean'
    | 'single-select'
    | 'multi-select'
    | 'confirm'
    | 'country-multi'
  titleKey: string
  helpKey?: string
  placeholderKey?: string
  options?: { value: string; labelKey: string }[]
  required?: boolean
  showIf?: string
  normalize?: string
  onAnswer?: Record<string, Tag[] | undefined> | { '*nonEmpty*': Tag[] }
  onComplete?: {
    navigate?: string
    persist?: string[]
  }
}

export interface Section {
  id: string
  titleKey: string
  questions: Question[]
}

export interface SkipRule {
  if: string
  skipSections?: string[]
  skipQuestions?: string[]
  skipTags?: Tag[]
  removeTags?: Tag[]
  forceTags?: Tag[]
}

export interface DocPrefill {
  lawsByTag: Record<Tag, string[]>
}

export interface QuestionnaireSchema {
  version: string
  tagsCatalog: Tag[]
  sections: Section[]
  skipLogic: SkipRule[]
  docPrefill: DocPrefill
  i18n: Record<'en' | 'de' | 'zh', Record<string, string>>
}

export const QUESTIONNAIRE_SCHEMA: QuestionnaireSchema = {
  version: '2025-11-02',
  tagsCatalog: [
    'EEE',
    'RED',
    'EMC',
    'LVD',
    'RoHS',
    'WEEE',
    'BATTERY',
    'TOY',
    'MACHINERY',
    'GAS',
    'PRESSURE',
    'MEASURING',
    'FOOD_CONTACT',
    'COSMETIC',
    'CHEMICAL',
    'PPE',
    'MEDICAL',
    'IVD',
    'CONSTRUCTION',
    'OUTDOOR_NOISE',
    'PYRO',
    'GPSR'
  ],
  sections: [
    {
      id: 'product',
      titleKey: 'wizard.product.title',
      questions: [
        {
          id: 'product.name',
          type: 'text',
          titleKey: 'wizard.product.name',
          placeholderKey: 'wizard.product.name.placeholder',
          required: true
        },
        {
          id: 'product.model',
          type: 'text',
          titleKey: 'wizard.product.model',
          placeholderKey: 'wizard.product.model.placeholder',
          required: false
        },
        {
          id: 'product.description',
          type: 'textarea',
          titleKey: 'wizard.product.description',
          required: false
        }
      ]
    },
    {
      id: 'electrical',
      titleKey: 'wizard.electrical.title',
      questions: [
        {
          id: 'isElectrical',
          type: 'boolean',
          titleKey: 'wizard.electrical.isElectrical',
          helpKey: 'wizard.electrical.isElectrical.help',
          required: true,
          onAnswer: {
            true: ['EEE', 'EMC', 'RoHS', 'WEEE'],
            false: ['GPSR']
          }
        },
        {
          id: 'mainsVoltage',
          type: 'boolean',
          titleKey: 'wizard.electrical.mainsVoltage',
          helpKey: 'wizard.electrical.mainsVoltage.help',
          showIf: 'isElectrical == true',
          onAnswer: {
            true: ['LVD']
          }
        },
        {
          id: 'powerMode',
          type: 'single-select',
          titleKey: 'wizard.electrical.powerMode',
          options: [
            { value: 'mains', labelKey: 'power.mains' },
            { value: 'battery', labelKey: 'power.battery' },
            { value: 'usb', labelKey: 'power.usb' },
            { value: 'poe', labelKey: 'power.poe' },
            { value: 'other', labelKey: 'power.other' }
          ],
          showIf: "isElectrical == true"
        },
        {
          id: 'hasBattery',
          type: 'boolean',
          titleKey: 'wizard.electrical.hasBattery',
          showIf: "isElectrical == true || powerMode == 'battery'",
          onAnswer: {
            true: ['BATTERY']
          }
        },
        {
          id: 'battery.chemistry',
          type: 'single-select',
          titleKey: 'wizard.battery.chemistry',
          showIf: 'hasBattery == true',
          options: [
            { value: 'li-ion', labelKey: 'battery.liion' },
            { value: 'li-po', labelKey: 'battery.lipo' },
            { value: 'nimh', labelKey: 'battery.nimh' },
            { value: 'alkaline', labelKey: 'battery.alkaline' },
            { value: 'lead-acid', labelKey: 'battery.leadacid' },
            { value: 'other', labelKey: 'common.other' }
          ],
          onAnswer: {
            'li-ion': ['BATTERY'],
            'li-po': ['BATTERY']
          }
        },
        {
          id: 'hasRadio',
          type: 'multi-select',
          titleKey: 'wizard.radio.hasRadio',
          helpKey: 'wizard.radio.hasRadio.help',
          showIf: 'isElectrical == true',
          options: [
            { value: 'wifi', labelKey: 'radio.wifi' },
            { value: 'bt', labelKey: 'radio.bt' },
            { value: 'ble', labelKey: 'radio.ble' },
            { value: 'cellular', labelKey: 'radio.cellular' },
            { value: 'rfid', labelKey: 'radio.rfid' },
            { value: 'none', labelKey: 'common.none' }
          ],
          normalize: "if includes 'none' then []",
          onAnswer: {
            '*nonEmpty*': ['RED', 'EMC']
          }
        }
      ]
    },
    {
      id: 'users',
      titleKey: 'wizard.users.title',
      questions: [
        {
          id: 'intendedAge',
          type: 'single-select',
          titleKey: 'wizard.users.age',
          options: [
            { value: '0-3', labelKey: 'age.0_3' },
            { value: '3-8', labelKey: 'age.3_8' },
            { value: '8-14', labelKey: 'age.8_14' },
            { value: '14+', labelKey: 'age.14plus' },
            { value: 'pro', labelKey: 'age.professionalOnly' }
          ],
          onAnswer: {
            '0-3': ['TOY'],
            '3-8': ['TOY'],
            '8-14': ['TOY']
          }
        },
        {
          id: 'isCollectible14plus',
          type: 'boolean',
          titleKey: 'wizard.users.collectible14plus',
          showIf: "intendedAge in ['0-3','3-8','8-14']",
          helpKey: 'wizard.users.collectible14plus.help',
          onAnswer: {
            true: ['GPSR']
          }
        }
      ]
    },
    {
      id: 'mechanics',
      titleKey: 'wizard.mechanics.title',
      questions: [
        {
          id: 'hasPoweredMovingParts',
          type: 'boolean',
          titleKey: 'wizard.mechanics.movingParts',
          helpKey: 'wizard.mechanics.movingParts.help',
          onAnswer: {
            true: ['MACHINERY']
          }
        },
        {
          id: 'isPartlyCompletedMachinery',
          type: 'boolean',
          titleKey: 'wizard.mechanics.partlyCompleted',
          showIf: 'hasPoweredMovingParts == true'
        }
      ]
    },
    {
      id: 'pressureGas',
      titleKey: 'wizard.pressureGas.title',
      questions: [
        {
          id: 'operatesAbove0_5bar',
          type: 'boolean',
          titleKey: 'wizard.pressure.aboveHalfBar',
          onAnswer: {
            true: ['PRESSURE']
          }
        },
        {
          id: 'burnsGas',
          type: 'boolean',
          titleKey: 'wizard.gas.burnsGas',
          helpKey: 'wizard.gas.burnsGas.help',
          onAnswer: {
            true: ['GAS']
          }
        }
      ]
    },
    {
      id: 'contactSubstances',
      titleKey: 'wizard.contactSubstances.title',
      questions: [
        {
          id: 'foodContact',
          type: 'boolean',
          titleKey: 'wizard.food.contact',
          onAnswer: {
            true: ['FOOD_CONTACT']
          }
        },
        {
          id: 'fcm.material',
          type: 'multi-select',
          titleKey: 'wizard.food.material',
          showIf: 'foodContact == true',
          options: [
            { value: 'plastic', labelKey: 'fcm.plastic' },
            { value: 'ceramic', labelKey: 'fcm.ceramic' },
            { value: 'metal', labelKey: 'fcm.metal' },
            { value: 'wood', labelKey: 'fcm.wood' },
            { value: 'paper', labelKey: 'fcm.paper' },
            { value: 'silicone', labelKey: 'fcm.silicone' }
          ]
        },
        {
          id: 'isCosmetic',
          type: 'boolean',
          titleKey: 'wizard.cosmetic.isCosmetic',
          helpKey: 'wizard.cosmetic.isCosmetic.help',
          onAnswer: {
            true: ['COSMETIC']
          }
        },
        {
          id: 'isChemical',
          type: 'boolean',
          titleKey: 'wizard.chemical.isChemical',
          helpKey: 'wizard.chemical.isChemical.help',
          onAnswer: {
            true: ['CHEMICAL']
          }
        }
      ]
    },
    {
      id: 'ppeMedical',
      titleKey: 'wizard.ppeMedical.title',
      questions: [
        {
          id: 'isPPE',
          type: 'boolean',
          titleKey: 'wizard.ppe.isPPE',
          helpKey: 'wizard.ppe.isPPE.help',
          onAnswer: {
            true: ['PPE']
          }
        },
        {
          id: 'isMedicalPurpose',
          type: 'boolean',
          titleKey: 'wizard.medical.isMedical',
          helpKey: 'wizard.medical.isMedical.help'
        },
        {
          id: 'isIVD',
          type: 'boolean',
          titleKey: 'wizard.medical.isIVD',
          showIf: 'isMedicalPurpose == true',
          onAnswer: {
            true: ['IVD'],
            false: ['MEDICAL']
          }
        }
      ]
    },
    {
      id: 'measurementConstructionOutdoorPyro',
      titleKey: 'wizard.misc.title',
      questions: [
        {
          id: 'isMeasuringInstrument',
          type: 'boolean',
          titleKey: 'wizard.measure.isMeasuring',
          helpKey: 'wizard.measure.isMeasuring.help',
          onAnswer: {
            true: ['MEASURING']
          }
        },
        {
          id: 'isConstructionProduct',
          type: 'boolean',
          titleKey: 'wizard.construction.isConstruction',
          helpKey: 'wizard.construction.isConstruction.help',
          onAnswer: {
            true: ['CONSTRUCTION']
          }
        },
        {
          id: 'isOutdoorNoiseEquipment',
          type: 'boolean',
          titleKey: 'wizard.noise.isOutdoorNoise',
          helpKey: 'wizard.noise.isOutdoorNoise.help',
          onAnswer: {
            true: ['OUTDOOR_NOISE']
          }
        },
        {
          id: 'isPyrotechnic',
          type: 'boolean',
          titleKey: 'wizard.pyro.isPyro',
          helpKey: 'wizard.pyro.isPyro.help',
          onAnswer: {
            true: ['PYRO']
          }
        }
      ]
    },
    {
      id: 'marketRole',
      titleKey: 'wizard.market.title',
      questions: [
        {
          id: 'economicRole',
          type: 'single-select',
          titleKey: 'wizard.market.role',
          options: [
            { value: 'manufacturer', labelKey: 'role.manufacturer' },
            { value: 'importer', labelKey: 'role.importer' },
            { value: 'distributor', labelKey: 'role.distributor' },
            { value: 'authorized_rep', labelKey: 'role.authorizedRep' }
          ],
          required: true
        },
        {
          id: 'markets',
          type: 'country-multi',
          titleKey: 'wizard.market.countries',
          helpKey: 'wizard.market.countries.help',
          required: true
        }
      ]
    },
    {
      id: 'finish',
      titleKey: 'wizard.finish.title',
      questions: [
        {
          id: 'confirmComplete',
          type: 'confirm',
          titleKey: 'wizard.finish.confirm',
          helpKey: 'wizard.finish.confirm.help',
          required: true,
          onComplete: {
            navigate: 'docs',
            persist: ['answers', 'derivedTags']
          }
        }
      ]
    }
  ],
  skipLogic: [
    {
      if: 'isElectrical == false',
      skipSections: ['electrical'],
      skipTags: ['EEE', 'EMC', 'LVD', 'RoHS', 'WEEE', 'BATTERY', 'RED']
    },
    { if: 'hasBattery == false', skipQuestions: ['battery.chemistry'] },
    {
      if: "intendedAge in ['0-3','3-8','8-14'] && isCollectible14plus == true",
      forceTags: ['GPSR'],
      removeTags: ['TOY']
    },
    { if: 'hasPoweredMovingParts == false', removeTags: ['MACHINERY'] },
    { if: 'operatesAbove0_5bar == false', removeTags: ['PRESSURE'] },
    { if: 'burnsGas == false', removeTags: ['GAS'] },
    { if: 'foodContact == false', removeTags: ['FOOD_CONTACT'] },
    { if: 'isCosmetic == false', removeTags: ['COSMETIC'] },
    { if: 'isChemical == false', removeTags: ['CHEMICAL'] },
    { if: 'isMedicalPurpose == false', removeTags: ['MEDICAL', 'IVD'] },
    { if: 'isMedicalPurpose == true && isIVD == true', removeTags: ['MEDICAL'] },
    { if: 'isMedicalPurpose == true && isIVD == false', removeTags: ['IVD'] },
    { if: 'isMeasuringInstrument == false', removeTags: ['MEASURING'] },
    { if: 'isConstructionProduct == false', removeTags: ['CONSTRUCTION'] },
    { if: 'isOutdoorNoiseEquipment == false', removeTags: ['OUTDOOR_NOISE'] },
    { if: 'isPyrotechnic == false', removeTags: ['PYRO'] }
  ],
  docPrefill: {
    lawsByTag: {
      EEE: ['EMC 2014/30/EU', 'LVD 2014/35/EU', 'RoHS 2011/65/EU', 'WEEE 2012/19/EU'],
      RED: ['RED 2014/53/EU'],
      BATTERY: ['Batteries (EU) 2023/1542'],
      TOY: ['Toy Safety 2009/48/EC'],
      MACHINERY: ['Machinery 2006/42/EC', '(from 20 Jan 2027: Machinery (EU) 2023/1230)'],
      GAS: ['Gas Appliances (EU) 2016/426'],
      PRESSURE: ['PED 2014/68/EU'],
      MEASURING: ['MID 2014/32/EU'],
      FOOD_CONTACT: ['Reg (EC) 1935/2004', '(plus 10/2011 if plastic)'],
      COSMETIC: ['Reg (EC) 1223/2009'],
      CHEMICAL: ['REACH 1907/2006', 'CLP 1272/2008'],
      PPE: ['PPE (EU) 2016/425'],
      MEDICAL: ['MDR (EU) 2017/745'],
      IVD: ['IVDR (EU) 2017/746'],
      CONSTRUCTION: ['CPR (EU) 305/2011'],
      OUTDOOR_NOISE: ['Outdoor Noise 2000/14/EC'],
      PYRO: ['Pyrotechnics 2013/29/EU'],
      GPSR: ['GPSR (EU) 2023/988']
    }
  },
  i18n: {
    en: {
      'wizard.product.title': 'Product',
      'wizard.product.name': 'Product name',
      'wizard.product.name.placeholder': 'e.g., Smart Kettle SK-200',
      'wizard.product.model': 'Model / variant (optional)',
      'wizard.product.model.placeholder': 'e.g., SK-200 EU',
      'wizard.product.description': 'Short description (optional)',
      'wizard.electrical.title': 'Electrical & Radio',
      'wizard.electrical.isElectrical':
        'Is the product electrical/electronic (uses electricity or batteries)?',
      'wizard.electrical.isElectrical.help': 'If it needs a plug or a battery, choose Yes.',
      'wizard.electrical.mainsVoltage': 'Mains / high-voltage (≥50 VAC or ≥75 VDC)?',
      'wizard.electrical.mainsVoltage.help': 'If any part runs at these voltages, select Yes.',
      'wizard.electrical.powerMode': 'How is it powered?',
      'power.mains': 'Mains',
      'power.battery': 'Battery',
      'power.usb': 'USB',
      'power.poe': 'PoE',
      'power.other': 'Other',
      'wizard.electrical.hasBattery': 'Does it contain a battery (integrated or replaceable)?',
      'wizard.radio.hasRadio': 'Which wireless/radio functions does it have?',
      'wizard.radio.hasRadio.help': 'Select all that apply. If none, leave blank.',
      'radio.wifi': 'Wi-Fi',
      'radio.bt': 'Bluetooth',
      'radio.ble': 'Bluetooth Low Energy',
      'radio.cellular': 'Cellular (2G/3G/4G/5G)',
      'radio.rfid': 'RFID / NFC',
      'wizard.battery.chemistry': 'Battery chemistry',
      'battery.liion': 'Lithium-ion',
      'battery.lipo': 'Lithium-polymer',
      'battery.nimh': 'NiMH',
      'battery.alkaline': 'Alkaline',
      'battery.leadacid': 'Lead-acid',
      'wizard.users.title': 'Users & Intended Use',
      'wizard.users.age': 'Primary user / audience',
      'age.0_3': 'Children 0–3',
      'age.3_8': 'Children 3–8',
      'age.8_14': 'Children 8–14',
      'age.14plus': '14+ / General users',
      'age.professionalOnly': 'Professional use only',
      'wizard.users.collectible14plus':
        'Is it marketed strictly as a 14+ collectible/decor item (not for play)?',
      'wizard.users.collectible14plus.help':
        'If Yes, we’ll treat it under general safety instead of Toy law.',
      'wizard.mechanics.title': 'Moving Parts / Machinery',
      'wizard.mechanics.movingParts': 'Any powered moving/rotating parts?',
      'wizard.mechanics.movingParts.help': 'Powered means other than directly human effort.',
      'wizard.mechanics.partlyCompleted': 'Is it partly completed machinery (not ready for final use)?',
      'wizard.pressureGas.title': 'Pressure & Gas',
      'wizard.pressure.aboveHalfBar': 'Operates with fluid/gas pressure > 0.5 bar?',
      'wizard.gas.burnsGas': 'Does it burn gas fuel (heating/cooking/etc.)?',
      'wizard.gas.burnsGas.help': 'Examples: LPG camping stove, gas heater.',
      'wizard.contactSubstances.title': 'Contact & Substances',
      'wizard.food.contact': 'Any part in intended contact with food/drink?',
      'wizard.food.material': 'Food-contact material(s)',
      'fcm.plastic': 'Plastic',
      'fcm.ceramic': 'Ceramic',
      'fcm.metal': 'Metal',
      'fcm.wood': 'Wood',
      'fcm.paper': 'Paper/Cardboard',
      'fcm.silicone': 'Silicone',
      'wizard.cosmetic.isCosmetic':
        'Is it a cosmetic product (applied to body for cleansing/beauty/protection)?',
      'wizard.cosmetic.isCosmetic.help': 'E.g., creams, shampoos, make-up; NOT disinfectants.',
      'wizard.chemical.isChemical': 'Is it sold as a chemical/mixture (paint, glue, detergent etc.)?',
      'wizard.chemical.isChemical.help': 'Or intended to release a substance?',
      'wizard.ppeMedical.title': 'PPE / Medical',
      'wizard.ppe.isPPE': 'Is it worn/used to protect a person from hazards (PPE)?',
      'wizard.ppe.isPPE.help': 'E.g., gloves, goggles, masks, helmets.',
      'wizard.medical.isMedical': 'Intended for diagnosis/treatment/monitoring (medical purpose)?',
      'wizard.medical.isMedical.help': 'Wellness is not medical unless you claim a medical benefit.',
      'wizard.medical.isIVD': 'Is it an in-vitro diagnostic (testing human specimens)?',
      'wizard.misc.title': 'Measuring / Construction / Outdoor noise / Pyro',
      'wizard.measure.isMeasuring': 'Is it a legally controlled measuring instrument (for billing/official use)?',
      'wizard.measure.isMeasuring.help': 'E.g., electricity/water meters, fuel dispensers, retail scales.',
      'wizard.construction.isConstruction': 'Is it intended for **permanent** installation in buildings/works?',
      'wizard.construction.isConstruction.help':
        'Windows, doors, cement, insulation, structural components, etc.',
      'wizard.noise.isOutdoorNoise':
        'Powered equipment typically used outdoors and noisy (e.g., mower)?',
      'wizard.noise.isOutdoorNoise.help':
        'If listed in EU Outdoor Noise law, special marking applies.',
      'wizard.pyro.isPyro': 'Does it contain pyrotechnic/explosive effects (e.g., fireworks)?',
      'wizard.pyro.isPyro.help': 'Includes consumer fireworks, theatrical effects, some signal devices.',
      'wizard.market.title': 'Market Role & Countries',
      'wizard.market.role': 'Your role in the EU market',
      'wizard.market.countries': 'Where will you place on the market?',
      'wizard.market.countries.help': 'Select EU/EEA/UK etc. for EPR and national duties.',
      'wizard.finish.title': 'Finish',
      'wizard.finish.confirm': 'I confirm the answers are complete and want to generate the results',
      'wizard.finish.confirm.help':
        'We’ll derive tags, preselect laws/EN families, and open the docs page.',
      'common.other': 'Other',
      'common.none': 'None'
    },
    de: {
      'wizard.product.title': 'Produkt',
      'wizard.product.name': 'Produktname',
      'wizard.product.name.placeholder': 'z. B. Smart Kettle SK-200',
      'wizard.product.model': 'Modell / Variante (optional)',
      'wizard.product.model.placeholder': 'z. B. SK-200 EU',
      'wizard.product.description': 'Kurzbeschreibung (optional)',
      'wizard.electrical.title': 'Elektrik & Funk',
      'wizard.electrical.isElectrical': 'Ist das Produkt elektrisch/elektronisch (Strom/Batterie)?',
      'wizard.electrical.isElectrical.help': 'Wenn Netzstecker oder Batterie nötig, „Ja“ wählen.',
      'wizard.electrical.mainsVoltage': 'Netz-/Hochspannung (≥50 VAC bzw. ≥75 VDC)?',
      'wizard.electrical.mainsVoltage.help': 'Wenn irgendein Teil mit diesen Spannungen arbeitet, „Ja“.',
      'wizard.electrical.powerMode': 'Wie wird es mit Energie versorgt?',
      'power.mains': 'Netz',
      'power.battery': 'Batterie',
      'power.usb': 'USB',
      'power.poe': 'PoE',
      'power.other': 'Sonstiges',
      'wizard.electrical.hasBattery': 'Enthält es eine Batterie (integriert/wechselbar)?',
      'wizard.radio.hasRadio': 'Welche Funkfunktionen sind vorhanden?',
      'wizard.radio.hasRadio.help': 'Mehrfachauswahl möglich. Leer lassen = keine.',
      'wizard.users.title': 'Nutzer & Verwendungszweck',
      'wizard.users.age': 'Hauptzielgruppe',
      'wizard.users.collectible14plus':
        'Als Sammler-/Dekoartikel 14+ vermarktet (nicht zum Spielen)?',
      'wizard.users.collectible14plus.help':
        'Bei „Ja“ gilt allgemeine Produktsicherheit statt Spielzeugrecht.',
      'wizard.mechanics.title': 'Bewegte Teile / Maschinen',
      'wizard.mechanics.movingParts': 'Gibt es angetriebene bewegte/rotierende Teile?',
      'wizard.mechanics.movingParts.help': 'Angetrieben ≠ reine Muskelkraft.',
      'wizard.mechanics.partlyCompleted': 'Unvollständige Maschine (nicht betriebsbereit)?',
      'wizard.pressureGas.title': 'Druck & Gas',
      'wizard.pressure.aboveHalfBar': 'Betrieb mit Druck > 0,5 bar?',
      'wizard.gas.burnsGas': 'Verbrennt es Gas (Heizen/Kochen/etc.)?',
      'wizard.gas.burnsGas.help': 'z. B. Campingkocher, Gasheizer.',
      'wizard.contactSubstances.title': 'Kontakt & Stoffe',
      'wizard.food.contact': 'Kontakt mit Lebensmitteln/Trinkwasser vorgesehen?',
      'wizard.food.material': 'Lebensmittelkontakt-Materialien',
      'wizard.cosmetic.isCosmetic': 'Kosmetikprodukt (Körperpflege/Schönheit/Schutz)?',
      'wizard.cosmetic.isCosmetic.help': 'z. B. Cremes, Shampoo; keine Desinfektionsmittel.',
      'wizard.chemical.isChemical': 'Als Chemikalie/Gemisch verkauft (Farbe, Kleber, Reiniger)?',
      'wizard.chemical.isChemical.help': 'Oder setzt beabsichtigt Stoffe frei?',
      'wizard.ppeMedical.title': 'PSA / Medizin',
      'wizard.ppe.isPPE': 'Als persönliche Schutzausrüstung gedacht?',
      'wizard.ppe.isPPE.help': 'z. B. Handschuhe, Schutzbrillen, Masken, Helme.',
      'wizard.medical.isMedical': 'Medizinischer Zweck (Diagnose/Behandlung/Überwachung)?',
      'wizard.medical.isMedical.help': 'Wellness ≠ medizinisch ohne medizinischen Anspruch.',
      'wizard.medical.isIVD': 'In-vitro-Diagnostik (Analyse von Proben)?',
      'wizard.misc.title': 'Messen / Bauprodukte / Außengeräte / Pyro',
      'wizard.measure.isMeasuring': 'Rechtlich geregeltes Messgerät (Abrechnung/amtlich)?',
      'wizard.measure.isMeasuring.help': 'z. B. Strom-/Wasserzähler, Zapfsäulen, Ladenwaagen.',
      'wizard.construction.isConstruction': 'Zur **dauerhaften** Installation in Bauwerken bestimmt?',
      'wizard.construction.isConstruction.help':
        'Fenster, Türen, Zement, Dämmung, Tragwerke etc.',
      'wizard.noise.isOutdoorNoise': 'Im Freien betrieben und laut (z. B. Rasenmäher)?',
      'wizard.noise.isOutdoorNoise.help': 'Bei gelisteten Geräten gelten Lärkmarkierungspflichten.',
      'wizard.pyro.isPyro': 'Pyrotechnische/Explosiv-Effekte (z. B. Feuerwerk)?',
      'wizard.pyro.isPyro.help': 'Inkl. Theaterpyro, Signalgeräte.',
    },
    zh: {
      'wizard.product.title': '产品',
      'wizard.product.name': '产品名称',
      'wizard.product.name.placeholder': '例如：Smart Kettle SK-200',
      'wizard.product.model': '型号/版本（可选）',
      'wizard.product.model.placeholder': '例如：SK-200 EU',
      'wizard.product.description': '简要描述（可选）',
      'wizard.electrical.title': '电气与无线',
      'wizard.electrical.isElectrical': '产品是否为电气/电子产品（使用电源或电池）？',
      'wizard.electrical.isElectrical.help': '若需插电或电池，请选择“是”。',
      'wizard.electrical.mainsVoltage': '是否为市电/高电压（≥50 VAC 或 ≥75 VDC）？',
      'wizard.electrical.mainsVoltage.help': '若任何部件在此电压范围内运行，请选择“是”。',
      'wizard.electrical.powerMode': '供电方式',
      'power.mains': '市电',
      'power.battery': '电池',
      'power.usb': 'USB',
      'power.poe': '以太网供电',
      'power.other': '其他',
      'wizard.electrical.hasBattery': '是否包含电池（内置或可更换）？',
      'wizard.radio.hasRadio': '具有哪些无线/射频功能？',
      'wizard.radio.hasRadio.help': '可多选；若无可留空。',
      'wizard.users.title': '用户与用途',
      'wizard.users.age': '主要用户/受众',
      'wizard.users.collectible14plus': '是否仅作为 14+ 收藏/装饰品（非玩耍用途）销售？',
      'wizard.users.collectible14plus.help': '若“是”，按一般产品安全而非玩具法规处理。',
      'wizard.mechanics.title': '运动部件/机械',
      'wizard.mechanics.movingParts': '是否有非纯人力驱动的运动/旋转部件？',
      'wizard.mechanics.partlyCompleted': '是否为“未完成的机械”（非最终使用状态）？',
      'wizard.pressureGas.title': '压力与燃气',
      'wizard.pressure.aboveHalfBar': '是否在 >0.5 bar 压力下运行？',
      'wizard.gas.burnsGas': '是否燃烧燃气（加热/烹饪/等）？',
      'wizard.contactSubstances.title': '接触与物质',
      'wizard.food.contact': '是否用于与食品/饮料接触？',
      'wizard.food.material': '食品接触材料',
      'wizard.cosmetic.isCosmetic': '是否为化妆品（用于清洁/美化/保护人体）？',
      'wizard.chemical.isChemical': '是否作为化学品/混合物销售（油漆/胶水/清洁剂等）？',
      'wizard.ppeMedical.title': '个体防护/医疗',
      'wizard.ppe.isPPE': '是否为个体防护装备（PPE）？',
      'wizard.medical.isMedical': '是否具有医疗目的（诊断/治疗/监测）？',
      'wizard.medical.isIVD': '是否为体外诊断产品（检测人体样本）？',
      'wizard.misc.title': '计量/建材/室外噪声/烟火',
      'wizard.measure.isMeasuring': '是否为法律监管的计量器具（计费/官方用途）？',
      'wizard.construction.isConstruction': '是否用于在建筑/工程中永久安装？',
      'wizard.noise.isOutdoorNoise': '是否为室外使用且会产生噪声的设备？',
      'wizard.pyro.isPyro': '是否包含烟火/爆炸效果？',
      'wizard.market.title': '市场角色与国家',
      'wizard.market.role': '您在欧盟市场的角色',
      'wizard.market.countries': '投放市场的国家/地区',
      'wizard.finish.title': '完成',
      'wizard.finish.confirm': '我确认已完成回答并生成结果',
      'wizard.finish.confirm.help': '系统将派生标签、预选法规/标准并打开文档页。',
      'common.other': '其他',
      'common.none': '无'
    }
  }
}
