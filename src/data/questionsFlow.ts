export type WizardOption = {
  label: string
  value: string
  next?: string
  end?: boolean
  tooltip?: string
}

export type WizardQuestion = {
  id: string
  prompt: string
  type?: 'singleChoice' | 'multiSelect'
  options?: WizardOption[]
  next?: string
  end?: boolean
  step: number
}

export const questionsFlow: WizardQuestion[] = [
  {
    id: 'product_type',
    prompt: 'What kind of product are you checking?',
    step: 1,
    type: 'singleChoice',
    options: [
      { label: 'Electronic / Electrical device ⚡', value: 'electronic', next: 'power_need' },
      { label: 'Toy or children’s product 🧸', value: 'toy', next: 'power_need' },
      { label: 'Kitchen / Food contact item 🍽️', value: 'kitchen', next: 'food_contact' },
      { label: 'Cosmetic / wearable 💄', value: 'wearable', next: 'skin_contact' },
      { label: 'Chemical / liquid / gas product 🧪', value: 'chemical', next: 'chemical_content' },
      { label: 'Mechanical tool or machine ⚙️', value: 'mechanical', next: 'power_need' },
      { label: 'Other consumer product 📦', value: 'other', next: 'user_role' }
    ]
  },
  {
    id: 'power_need',
    prompt: 'Does it need any kind of power (mains, USB, or battery)?',
    step: 2,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'battery', tooltip: 'Includes mains, USB, or any battery supply.' },
      { label: 'No', value: 'no', next: 'child_use', tooltip: 'Purely mechanical or passive products.' }
    ]
  },
  {
    id: 'battery',
    prompt: 'Does it contain a battery?',
    step: 2,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'battery_type', tooltip: 'Any removable or embedded cell counts.' },
      { label: 'No', value: 'no', next: 'wireless', tooltip: 'Powered only from mains or other sources.' }
    ]
  },
  {
    id: 'battery_type',
    prompt: 'What type of battery?',
    step: 2,
    type: 'singleChoice',
    options: [
      { label: 'Rechargeable (Li-ion, etc.)', value: 'rechargeable', next: 'wireless', tooltip: 'Integrated lithium or rechargeable packs.' },
      { label: 'Disposable (AA, AAA, etc.)', value: 'disposable', next: 'wireless', tooltip: 'Primary batteries or coin cells.' },
      { label: 'Both', value: 'both', next: 'wireless', tooltip: 'Device ships with both rechargeable and disposable options.' }
    ]
  },
  {
    id: 'wireless',
    prompt: 'Does it connect wirelessly (Bluetooth, Wi-Fi, etc.)?',
    step: 2,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'power_source', tooltip: 'Bluetooth, Wi-Fi, RFID, cellular, etc.' },
      { label: 'No', value: 'no', next: 'user_role', tooltip: 'No intentional radio transmission.' }
    ]
  },
  {
    id: 'power_source',
    prompt: 'How is it powered?',
    step: 2,
    type: 'singleChoice',
    options: [
      { label: 'Plugs into wall (AC mains)', value: 'mains', next: 'user_role', tooltip: 'Includes external power supplies and adapters.' },
      { label: 'Low-voltage / USB / battery only', value: 'low_voltage', next: 'user_role', tooltip: 'Operates below 50 Vac / 75 Vdc or on batteries only.' }
    ]
  },
  {
    id: 'user_role',
    prompt: 'What is your role for this product?',
    step: 3,
    type: 'singleChoice',
    options: [
      { label: 'Manufacturer / Brand owner 🏭', value: 'manufacturer', next: 'child_use' },
      { label: 'Importer 🌍', value: 'importer', next: 'child_use' },
      { label: 'Distributor / Retailer 🏪', value: 'distributor', next: 'child_use' },
      { label: 'Authorized Representative 🧾', value: 'authorized_rep', next: 'child_use' }
    ]
  },
  {
    id: 'child_use',
    prompt: 'Is it mainly for children under 14?',
    step: 4,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'toy_play' },
      { label: 'No', value: 'no', next: 'moving_parts' }
    ]
  },
  {
    id: 'toy_play',
    prompt: 'Is it designed primarily for play?',
    step: 4,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'moving_parts' },
      { label: 'No', value: 'no', next: 'moving_parts' }
    ]
  },
  {
    id: 'moving_parts',
    prompt: 'Does it have moving parts or generate heat?',
    step: 4,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'food_contact' },
      { label: 'No', value: 'no', next: 'food_contact' }
    ]
  },
  {
    id: 'food_contact',
    prompt: 'Does it contact food or drinks?',
    step: 4,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'chemical_content' },
      { label: 'No', value: 'no', next: 'chemical_content' }
    ]
  },
  {
    id: 'chemical_content',
    prompt: 'Does it include chemicals, liquids, or gases?',
    step: 4,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'skin_contact' },
      { label: 'No', value: 'no', next: 'skin_contact' }
    ]
  },
  {
    id: 'skin_contact',
    prompt: 'Is it worn on the body or has skin contact?',
    step: 4,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'outdoor_use' },
      { label: 'No', value: 'no', next: 'outdoor_use' }
    ]
  },
  {
    id: 'outdoor_use',
    prompt: 'Is it used outdoors or exposed to weather?',
    step: 4,
    type: 'singleChoice',
    options: [
      { label: 'Yes', value: 'yes', next: 'target_countries' },
      { label: 'No', value: 'no', next: 'target_countries' }
    ]
  },
  {
    id: 'target_countries',
    prompt: 'Where will it be sold?',
    step: 5,
    type: 'multiSelect',
    next: 'existing_docs',
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
      { label: 'Yes', value: 'yes', next: 'needs_docs' },
      { label: 'No', value: 'no', next: 'needs_docs' }
    ]
  },
  {
    id: 'needs_docs',
    prompt: 'What do you want to do today?',
    step: 5,
    type: 'singleChoice',
    options: [
      { label: 'Generate required compliance documents 🏗️', value: 'generate', end: true },
      { label: 'Only verify which rules apply ✅', value: 'verify', end: true }
    ]
  }
]

export const startQuestionId = questionsFlow[0]?.id ?? ''
