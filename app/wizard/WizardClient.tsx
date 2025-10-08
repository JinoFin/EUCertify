'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import localforage from 'localforage';
import { useTranslations } from 'next-intl';
import { WizardFormValues, wizardSchema } from './schema';
import { defaultAnswers, useWizardStore } from './store';
import { Stepper } from './Stepper';
import { QuestionCard } from './QuestionCard';
import { Button } from '@/components/Button';
import { SummaryPanel } from './SummaryPanel';
import { Badge } from '@/components/Badge';

interface RuleEvaluation {
  acts: { code: string; title: string; eli_url: string; warnings?: string[] }[];
  standards: string[];
  warnings: string[];
  route: string[];
}

const STORAGE_KEY = 'eucertify-wizard-draft';

export function WizardClient() {
  const tWizard = useTranslations('wizard');
  const tQuestions = useTranslations('questions');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const { answers, setAnswers } = useWizardStore();

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: answers ?? defaultAnswers
  });

  const values = useWatch({ control: form.control });
  const [currentStep, setCurrentStep] = useState(0);
  const [evaluation, setEvaluation] = useState<RuleEvaluation>({ acts: [], standards: [], warnings: [], route: [] });
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    localforage.getItem<WizardFormValues>(STORAGE_KEY).then((draft) => {
      if (draft) {
        form.reset(draft);
        setAnswers(draft);
      }
    });
  }, [form, setAnswers]);

  useEffect(() => {
    if (!values) return;
    const parsed = wizardSchema.safeParse(values);
    const snapshot = parsed.success ? parsed.data : values;
    setAnswers(snapshot as WizardFormValues);
    localforage.setItem(STORAGE_KEY, snapshot).catch(() => undefined);
  }, [values, setAnswers]);

  useEffect(() => {
    const applyRules = async () => {
      try {
        const parsed = wizardSchema.safeParse(values);
        const payload = parsed.success ? parsed.data : values;
        const response = await fetch('/api/rules/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: payload })
        });
        if (!response.ok) throw new Error('rules error');
        const data = (await response.json()) as RuleEvaluation;
        setEvaluation(data);
        setOffline(false);
      } catch (error) {
        setOffline(!navigator.onLine);
      }
    };
    applyRules();
  }, [values]);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const steps: (keyof WizardFormValues)[] = [
    'category',
    'voltage_ac',
    'voltage_dc',
    'radio_tech',
    'isEEE',
    'has_battery',
    'intended_user',
    'child_intended',
    'ppe',
    'medical',
    'description'
  ];

  const currentField = steps[currentStep];
  const errors = form.formState.errors;
  const missing = useMemo(() =>
    Object.values(errors)
      .map((error) => (error?.message ? tErrors(error.message as string) : null))
      .filter((value): value is string => Boolean(value)),
  [errors, tErrors]);

  const getQuestionText = (key: string) => {
    try {
      return tQuestions(key);
    } catch (error) {
      return undefined;
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{tWizard('title')}</h1>
            <p className="text-sm text-slate-500">
              {tWizard('progress')} {currentStep + 1}/{steps.length}
            </p>
          </div>
          <div className="w-40">
            <Stepper current={currentStep} total={steps.length} />
          </div>
        </div>
        {offline ? <Badge variant="warning">{tWizard('offline')}</Badge> : null}
        <form
          onSubmit={form.handleSubmit(() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1)))}
          className="space-y-6"
        >
          <QuestionCard
            title={tQuestions(`${currentField}.label`)}
            description={getQuestionText(`${currentField}.helper`)}
          >
            <Controller
              control={form.control}
              name={currentField}
              render={({ field }) => {
                switch (currentField) {
                  case 'category':
                    return (
                      <input
                        type="text"
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        placeholder={tQuestions('category.placeholder')}
                        {...field}
                      />
                    );
                  case 'description':
                    return (
                      <textarea
                        className="min-h-[160px] w-full rounded border border-slate-300 px-3 py-2"
                        placeholder={tQuestions('description.placeholder')}
                        {...field}
                      />
                    );
                  case 'voltage_ac':
                  case 'voltage_dc':
                    return (
                      <input
                        type="number"
                        className="w-48 rounded border border-slate-300 px-3 py-2"
                        min={0}
                        {...field}
                      />
                    );
                  case 'radio_tech':
                    return (
                      <div className="space-y-2">
                        {['none', 'bluetooth', 'cellular', 'other'].map((option) => (
                          <label key={option} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              className="h-4 w-4"
                              value={option}
                              checked={field.value === option}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                            <span>{tQuestions(`radio_tech.options.${option}` as any)}</span>
                          </label>
                        ))}
                      </div>
                    );
                  case 'intended_user':
                    return (
                      <div className="space-y-2">
                        {['consumer', 'professional'].map((option) => (
                          <label key={option} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              className="h-4 w-4"
                              value={option}
                              checked={field.value === option}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                            <span>{tQuestions(`intended_user.options.${option}` as any)}</span>
                          </label>
                        ))}
                      </div>
                    );
                  case 'isEEE':
                  case 'has_battery':
                  case 'child_intended':
                  case 'ppe':
                  case 'medical':
                    return (
                      <div className="space-y-2">
                        {[true, false].map((option) => (
                          <label key={String(option)} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              className="h-4 w-4"
                              value={String(option)}
                              checked={field.value === option}
                              onChange={() => field.onChange(option)}
                            />
                            <span>{option ? tCommon('yes') : tCommon('no')}</span>
                          </label>
                        ))}
                      </div>
                    );
                  default:
                    return null;
                }
              }}
            />
            {form.formState.errors[currentField]?.message ? (
              <p className="text-sm text-amber-700">
                {tErrors(form.formState.errors[currentField]?.message as string)}
              </p>
            ) : null}
          </QuestionCard>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
            >
              {tWizard('previous')}
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button type="button" onClick={() => setCurrentStep(steps.length - 1)}>
                {tWizard('finish')}
              </Button>
            ) : (
              <Button type="submit">{tWizard('next')}</Button>
            )}
          </div>
        </form>
      </div>
      <aside>
        <SummaryPanel acts={evaluation.acts} missing={missing} standards={evaluation.standards} />
      </aside>
    </div>
  );
}
