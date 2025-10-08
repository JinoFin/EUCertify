import { describe, it, expect } from 'vitest';
import { apply as applyLogic } from 'json-logic-ts';
import logic from '@/rules/logic.v1.json';

function applyActs(answers: Record<string, unknown>) {
  return (logic.acts as any[])
    .filter((rule) => Boolean(applyLogic(rule.when, answers)))
    .map((rule) => rule.code)
    .sort();
}

describe('rules engine', () => {
  it('bluetooth speaker scenario', () => {
    const acts = applyActs({
      radio_tech: 'bluetooth',
      voltage_ac: 0,
      voltage_dc: 12,
      isEEE: true,
      has_battery: true,
      intended_user: 'consumer',
      child_intended: false,
      ppe: false,
      medical: false
    });
    expect(acts).toEqual([
      'BATTERY_2023_1542',
      'GPSR_2023_988',
      'RED_2014_53_EU',
      'ROHS_2011_65_EU',
      'WEEE_2012_19_EU'
    ]);
  });

  it('mains powered lamp scenario', () => {
    const acts = applyActs({
      radio_tech: 'none',
      voltage_ac: 230,
      voltage_dc: 0,
      isEEE: true,
      has_battery: false,
      intended_user: 'consumer',
      child_intended: false,
      ppe: false,
      medical: false
    });
    expect(acts).toEqual([
      'EMC_2014_30_EU',
      'GPSR_2023_988',
      'LVD_2014_35_EU',
      'ROHS_2011_65_EU',
      'WEEE_2012_19_EU'
    ]);
  });
});
