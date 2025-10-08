'use client';

import { create } from 'zustand';

export type WizardAnswers = {
  category: string;
  voltage_ac: number;
  voltage_dc: number;
  radio_tech: 'none' | 'bluetooth' | 'cellular' | 'other';
  isEEE: boolean;
  has_battery: boolean;
  intended_user: 'consumer' | 'professional';
  child_intended: boolean;
  ppe: boolean;
  medical: boolean;
  description: string;
};

const defaultAnswers: WizardAnswers = {
  category: '',
  voltage_ac: 0,
  voltage_dc: 0,
  radio_tech: 'none',
  isEEE: false,
  has_battery: false,
  intended_user: 'consumer',
  child_intended: false,
  ppe: false,
  medical: false,
  description: ''
};

type WizardState = {
  answers: WizardAnswers;
  setAnswer: <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) => void;
  setAnswers: (answers: WizardAnswers) => void;
  reset: () => void;
};

export const useWizardStore = create<WizardState>((set) => ({
  answers: defaultAnswers,
  setAnswer: (key, value) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [key]: value
      }
    })),
  setAnswers: (answers) => set({ answers }),
  reset: () => set({ answers: defaultAnswers })
}));

export { defaultAnswers };
