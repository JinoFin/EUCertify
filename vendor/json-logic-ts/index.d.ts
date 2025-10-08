export type JsonLogicRule = any;
export type JsonLogicData = Record<string, unknown>;

export function apply(rule: JsonLogicRule, data: JsonLogicData): unknown;
