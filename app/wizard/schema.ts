import { z } from 'zod';

export const wizardSchema = z.object({
  category: z.string().min(1, 'category_required'),
  voltage_ac: z.coerce.number().min(0),
  voltage_dc: z.coerce.number().min(0),
  radio_tech: z.enum(['none', 'bluetooth', 'cellular', 'other']),
  isEEE: z.boolean(),
  has_battery: z.boolean(),
  intended_user: z.enum(['consumer', 'professional']),
  child_intended: z.boolean(),
  ppe: z.boolean(),
  medical: z.boolean(),
  description: z.string().min(10, 'description_short')
});

export type WizardFormValues = z.infer<typeof wizardSchema>;
