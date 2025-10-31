import type { CountryObligations } from '@/domain/types'
import { t } from '@/i18n'

export const COUNTRY_OBLIGATIONS: CountryObligations = {
  DE: [
    {
      id: 'DE_LUCID',
      name: 'LUCID Packaging Register',
      authority: 'ZSVR',
      description: t(
        'countryObligations.DE_LUCID.description',
        'Register packaging and join a dual system.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['Packaging']
    },
    {
      id: 'DE_WEEE',
      name: 'WEEE Registration (Stiftung EAR)',
      authority: 'Stiftung EAR',
      description: t(
        'countryObligations.DE_WEEE.description',
        'Register as EEE producer; use WEEE-Reg.-Nr.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['WEEE']
    },
    {
      id: 'DE_BATT',
      name: 'BattG Battery Register',
      authority: 'BattReg',
      description: t(
        'countryObligations.DE_BATT.description',
        'Battery producer registration and reporting.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['Batteries']
    }
  ],
  FR: [
    {
      id: 'FR_EEE',
      name: 'EEE PRO (e.g., Ecosysteme/Ecologic)',
      authority: 'ADEME',
      description: t(
        'countryObligations.FR_EEE.description',
        'EEE producer registration; obtain FR IDU.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['WEEE']
    },
    {
      id: 'FR_BATT',
      name: 'Battery PRO (e.g., Corepile)',
      authority: 'ADEME',
      description: t(
        'countryObligations.FR_BATT.description',
        'Battery producer registration and reporting.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['Batteries']
    },
    {
      id: 'FR_PACK',
      name: 'Packaging PRO (CITEO)',
      authority: 'CITEO',
      description: t(
        'countryObligations.FR_PACK.description',
        'Packaging producer registration and fees.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['Packaging']
    },
    {
      id: 'FR_TRIMAN',
      name: 'Triman & Info-Tri',
      authority: 'Legally required symbols',
      description: t(
        'countryObligations.FR_TRIMAN.description',
        'Apply Triman logo and sorting instructions.'
      ),
      provider: 'Manufacturer',
      status: 'exportable',
      requiredFor: ['Packaging']
    }
  ],
  ES: [
    {
      id: 'ES_RAEE',
      name: 'RAEE (EEE) Producer Register',
      authority: 'Ministerio de Industria',
      description: t(
        'countryObligations.ES_RAEE.description',
        'Register EEE before sale; annual reporting.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['WEEE']
    },
    {
      id: 'ES_BATT',
      name: 'Battery PRO (e.g., Ecopilas)',
      authority: 'PRO',
      description: t(
        'countryObligations.ES_BATT.description',
        'Battery producer registration and reporting.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['Batteries']
    },
    {
      id: 'ES_PACK',
      name: 'Packaging PRO (Ecoembes)',
      authority: 'MITECO',
      description: t(
        'countryObligations.ES_PACK.description',
        'Packaging registration and producer fees.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['Packaging']
    }
  ],
  IT: [
    {
      id: 'IT_WEEE',
      name: 'Registro AEE + Consortium',
      authority: 'Camera di Commercio',
      description: t(
        'countryObligations.IT_WEEE.description',
        'Enroll as EEE producer and join WEEE consortium.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['WEEE']
    },
    {
      id: 'IT_BATT',
      name: 'National Battery Register + Consortium',
      authority: 'Chamber system',
      description: t(
        'countryObligations.IT_BATT.description',
        'Battery producer registration; join collection scheme.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['Batteries']
    },
    {
      id: 'IT_CONAI',
      name: 'CONAI Packaging Consortium',
      authority: 'CONAI',
      description: t(
        'countryObligations.IT_CONAI.description',
        'Mandatory packaging producer consortium; environmental labels.'
      ),
      provider: 'Authority/PRO',
      status: 'external',
      requiredFor: ['Packaging']
    }
  ]
}

export default COUNTRY_OBLIGATIONS
