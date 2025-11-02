import { describe, expect, it } from 'vitest'
import { deriveTagsFromAnswers } from '@/wizard/logic'

describe('deriveTagsFromAnswers', () => {
  it('electrical + battery + wifi derives expected tags', () => {
    const tags = deriveTagsFromAnswers({
      isElectrical: true,
      hasBattery: true,
      hasRadio: ['wifi'],
      mainsVoltage: false
    })

    expect(tags).toEqual(
      expect.arrayContaining(['EEE', 'EMC', 'RoHS', 'WEEE', 'BATTERY', 'RED'])
    )
  })
})
