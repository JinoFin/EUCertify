import { NextRequest } from 'next/server';
import { apply as applyLogic } from 'json-logic-ts';
import logic from '@/rules/logic.v1.json';
import actsMeta from '@/rules/acts.v1.json';
import standardsMeta from '@/rules/standards.v1.json';

export async function POST(request: NextRequest) {
  const { answers } = await request.json();
  const applicable = (logic.acts as any[])
    .filter((rule) => {
      try {
        return Boolean(applyLogic(rule.when, answers));
      } catch (error) {
        console.error('Failed to evaluate rule', rule.code, error);
        return false;
      }
    })
    .map((rule) => {
      const meta = (actsMeta as any[]).find((act) => act.code === rule.code);
      return {
        code: rule.code,
        title: meta?.title ?? rule.code,
        eli_url: meta?.eli_url ?? '',
        warnings: rule.warnings ?? [],
        route: rule.route,
        route_note: rule.route_note ?? null,
        doc_requirements: rule.doc_requirements ?? [],
        labeling_flags: rule.labeling_flags ?? []
      };
    });

  const suggestedStandards = (standardsMeta as any).standards
    .filter((standard: any) => standard.acts.some((code: string) => applicable.some((act) => act.code === code)))
    .map((standard: any) => `${standard.code} — ${standard.title}`)
    .slice(0, 10);

  const warnings = applicable.flatMap((act) => act.warnings ?? []);

  return Response.json({
    acts: applicable,
    standards: suggestedStandards,
    warnings,
    route: applicable.map((act) => act.route)
  });
}
