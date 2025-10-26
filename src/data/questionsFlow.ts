import type { QuestionOption } from '@/domain/types'

export type WizardOption = QuestionOption

export type WizardQuestion = {
  id: string
  prompt: string
  type?: 'singleChoice' | 'multiSelect'
  options?: WizardOption[]
  next?: string
  end?: boolean
  step: number
  helpText?: string
}

export const questionsFlow: WizardQuestion[] = [
  {
    id: 'product_type',
    prompt: 'What kind of product are you checking?',
    step: 1,
    type: 'singleChoice',
    options: [
      {
        label: 'Electronic / Electrical device ⚡',
        value: 'electronic',
        next: 'power_need',
        examples: [
          'Bluetooth speaker, smartwatch, tablet',
          'LED desk lamp with USB power',
          'Robot vacuum, 3D printer'
        ]
      },
      {
        label: 'Toy or children’s product 🧸',
        value: 'toy',
        next: 'power_need',
        examples: [
          'Battery toy car, educational tablet for kids',
          'Stuffed animal with light/sound',
          'Building set labelled 6+'
        ]
      },
      {
        label: 'Kitchen / Food contact item 🍽️',
        value: 'kitchen',
        next: 'food_contact',
        examples: [
          'Food storage box, lunch box',
          'Coffee maker, blender jar, air fryer basket',
          'Reusable bottle that touches drinks'
        ]
      },
      {
        label: 'Cosmetic / wearable 💄',
        value: 'wearable',
        next: 'skin_contact',
        examples: [
          'Jewelry, watch strap, smart band',
          'Cosmetic applicator, sleep mask',
          'Compression sleeve, knee brace'
        ]
      },
      {
        label: 'Chemical / liquid / gas product 🧪',
        value: 'chemical',
        next: 'chemical_content',
        examples: [
          'Aerosol cleaner, ink cartridge',
          'Adhesive glue, resin kit',
          'Butane canister, refrigerant refill'
        ]
      },
      {
        label: 'Mechanical tool or machine ⚙️',
        value: 'mechanical',
        next: 'power_need',
        examples: [
          'Hand tool, manual slicer',
          'Bike pump, non-electric scooter',
          'Door closer, spring clamp'
        ]
      },
      {
        label: 'Other consumer product 📦',
        value: 'other',
        next: 'user_role',
        examples: [
          'Decor item, non-electric home accessory',
          'Stationery, pet accessory',
          'General consumer product'
        ]
      }
    ]
  },
  {
    id: 'power_need',
    prompt: 'Does it need any kind of power (mains, USB, or battery)?',
    step: 2,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'battery',
        tooltip: 'Includes mains, USB, or any battery supply.',
        examples: [
          'Needs battery, USB, or AC adapter to work',
          'Turns on/off electronically'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'child_use',
        tooltip: 'Purely mechanical or passive products.',
        examples: [
          'Purely manual item',
          'No batteries or cables required'
        ]
      }
    ]
  },
  {
    id: 'battery',
    prompt: 'Does it contain a battery?',
    step: 2,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'battery_type',
        tooltip: 'Any removable or embedded cell counts.',
        examples: [
          'Built-in Li-ion pack or AA/AAA cells',
          'Rechargeable or disposable batteries'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'wireless',
        tooltip: 'Powered only from mains or other sources.',
        examples: [
          'Powered by wall / USB only',
          'External power supply only'
        ]
      }
    ]
  },
  {
    id: 'battery_type',
    prompt: 'What type of battery?',
    step: 2,
    type: 'singleChoice',
    options: [
      {
        label: 'Rechargeable (Li-ion, etc.)',
        value: 'rechargeable',
        next: 'wireless',
        tooltip: 'Integrated lithium or rechargeable packs.',
        examples: [
          'Li-ion/Li-poly pack (e.g., 18650)',
          'Rechargeable smartwatch, earbuds case'
        ]
      },
      {
        label: 'Disposable (AA, AAA, etc.)',
        value: 'disposable',
        next: 'wireless',
        tooltip: 'Primary batteries or coin cells.',
        examples: [
          'Toys using AA/AAA',
          'Coin cell (CR2032) in remote'
        ]
      },
      {
        label: 'Both',
        value: 'both',
        next: 'wireless',
        tooltip: 'Device ships with both rechargeable and disposable options.',
        examples: [
          'Primary for backup clock + main rechargeable pack',
          'Device that accepts either battery type'
        ]
      }
    ]
  },
  {
    id: 'wireless',
    prompt: 'Does it connect wirelessly (Bluetooth, Wi-Fi, etc.)?',
    step: 2,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'power_source',
        tooltip: 'Bluetooth, Wi-Fi, RFID, cellular, etc.',
        examples: [
          'Bluetooth, Wi-Fi, Zigbee, cellular/LTE, NFC',
          'RF remote/controller'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'user_role',
        tooltip: 'No intentional radio transmission.',
        examples: [
          'No radio transmit/receive functions',
          'Wired only'
        ]
      }
    ]
  },
  {
    id: 'power_source',
    prompt: 'How is it powered?',
    step: 2,
    type: 'singleChoice',
    options: [
      {
        label: 'Plugs into wall (AC mains)',
        value: 'mains',
        next: 'user_role',
        tooltip: 'Includes external power supplies and adapters.',
        examples: [
          'Plugs into 230V AC socket',
          'Comes with wall plug power supply'
        ]
      },
      {
        label: 'Low-voltage / USB / battery only',
        value: 'low_voltage',
        next: 'user_role',
        tooltip: 'Operates below 50 Vac / 75 Vdc or on batteries only.',
        examples: [
          'USB-C, 5–20V DC, battery only',
          'No direct connection to wall AC'
        ]
      }
    ]
  },
  {
    id: 'user_role',
    prompt: 'What is your role for this product?',
    step: 3,
    type: 'singleChoice',
    options: [
      {
        label: 'Manufacturer / Brand owner 🏭',
        value: 'manufacturer',
        next: 'child_use',
        examples: [
          'Brand owner or OEM placing product on EU market',
          'You design/label the product'
        ]
      },
      {
        label: 'Importer 🌍',
        value: 'importer',
        next: 'child_use',
        examples: [
          'You bring goods from outside EU/EEA and sell in EU',
          'Importer address must be on product/pack'
        ]
      },
      {
        label: 'Distributor / Retailer 🏪',
        value: 'distributor',
        next: 'child_use',
        examples: [
          'Retailer, marketplace seller reselling finished goods',
          'No design changes'
        ]
      },
      {
        label: 'Authorized Representative 🧾',
        value: 'authorized_rep',
        next: 'child_use',
        examples: [
          'EU Authorized Representative acting for non-EU manufacturer',
          'Keeps Tech File and DoC on behalf of manufacturer'
        ]
      }
    ]
  },
  {
    id: 'child_use',
    prompt: 'Is it mainly for children under 14?',
    step: 4,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'toy_play',
        examples: [
          'Marketed for children under 14',
          'Packaging shows kids or age grade like 6+'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'moving_parts',
        examples: [
          'General adult use',
          'Not targeted at children'
        ]
      }
    ]
  },
  {
    id: 'toy_play',
    prompt: 'Is it designed primarily for play?',
    step: 4,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'moving_parts',
        examples: [
          'Designed primarily for play/fun',
          'Toy cars, dolls, games'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'moving_parts',
        examples: [
          'Educational device not primarily for play',
          'Childcare article (not a toy)'
        ]
      }
    ]
  },
  {
    id: 'moving_parts',
    prompt: 'Does it have moving parts or generate heat?',
    step: 4,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'food_contact',
        examples: [
          'Rotating blades, fan, motorized movement',
          'Surfaces that get hot in normal use'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'food_contact',
        examples: [
          'Static enclosure, no moving parts',
          'No noticeable heat generation'
        ]
      }
    ]
  },
  {
    id: 'food_contact',
    prompt: 'Does it contact food or drinks?',
    step: 4,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'chemical_content',
        examples: [
          'Part touches food/drink (jar, basket, nozzle)',
          'Kitchenware or appliance food path'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'chemical_content',
        examples: [
          'No direct food/drink contact',
          'Outer housing only'
        ]
      }
    ]
  },
  {
    id: 'chemical_content',
    prompt: 'Does it include chemicals, liquids, or gases?',
    step: 4,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'skin_contact',
        examples: [
          'Contains liquid/gel/aerosol',
          'Includes fuel/gas, solvent, ink'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'skin_contact',
        examples: [
          'Solid article only',
          'No chemical mixture included'
        ]
      }
    ]
  },
  {
    id: 'skin_contact',
    prompt: 'Is it worn on the body or has skin contact?',
    step: 4,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'outdoor_use',
        examples: [
          'Worn or prolonged skin contact',
          'Bracelets, straps, earbuds tips'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'outdoor_use',
        examples: [
          'Handled briefly only',
          'Desktop gadget'
        ]
      }
    ]
  },
  {
    id: 'outdoor_use',
    prompt: 'Is it used outdoors or exposed to weather?',
    step: 4,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'target_countries',
        examples: [
          'Designed for rain/sunlight exposure',
          'Garden tool, outdoor appliance'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'target_countries',
        examples: [
          'Indoor only',
          'No weather exposure expected'
        ]
      }
    ]
  },
  {
    id: 'target_countries',
    prompt: 'Where will it be sold?',
    step: 5,
    type: 'multiSelect',
    next: 'existing_docs',
    helpText: 'Select every EU/EEA country where you will list/sell the product. This controls EPR registration requirements and languages.',
    options: [
      { label: 'Germany', value: 'DE' },
      { label: 'France', value: 'FR' },
      { label: 'Spain', value: 'ES' },
      { label: 'Italy', value: 'IT' },
      { label: 'Netherlands', value: 'NL' },
      { label: 'Sweden', value: 'SE' },
      { label: 'Poland', value: 'PL' }
    ]
  },
  {
    id: 'existing_docs',
    prompt: 'Do you already have compliance test reports?',
    step: 5,
    type: 'singleChoice',
    options: [
      {
        label: 'Yes',
        value: 'yes',
        next: 'needs_docs',
        examples: [
          'Supplier gave RF/EMC/LVD test reports',
          'Existing EU Declaration of Conformity'
        ]
      },
      {
        label: 'No',
        value: 'no',
        next: 'needs_docs',
        examples: [
          'No test reports yet',
          'Need to generate a new DoC and Tech File'
        ]
      }
    ]
  },
  {
    id: 'needs_docs',
    prompt: 'What do you want to do today?',
    step: 5,
    type: 'singleChoice',
    options: [
      {
        label: 'Generate required compliance documents 🏗️',
        value: 'generate',
        end: true,
        examples: [
          'Get DoC draft, labeling set, Tech File checklist',
          'EPR registrations list per country'
        ]
      },
      {
        label: 'Only verify which rules apply ✅',
        value: 'verify',
        end: true,
        examples: [
          'Just a list of applicable rules and tasks',
          'Cross-check existing documents'
        ]
      }
    ]
  }
]

export const startQuestionId = questionsFlow[0]?.id ?? ''
