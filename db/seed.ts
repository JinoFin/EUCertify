import { createClient } from '@supabase/supabase-js';
import acts from '../rules/acts.v1.json';
import standards from '../rules/standards.v1.json';

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!url || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function seed() {
  const { data: user, error: userError } = await supabase
    .from('users')
    .upsert({ id: '00000000-0000-4000-8000-000000000001', email: 'compliance@example.com' })
    .select()
    .single();
  if (userError) throw userError;

  await supabase.from('companies').upsert({
    id: '11111111-1111-4111-8111-111111111111',
    owner_id: user.id,
    type: 'MANUFACTURER',
    legal_name: 'Acme GmbH',
    address_json: {
      line1: 'Straße des 17. Juni 135',
      city: 'Berlin',
      country: 'DE',
      postal_code: '10623'
    },
    vat: 'DE123456789',
    signatories_json: [
      { name: 'Max Mustermann', title: 'Leiter Qualität' }
    ],
    logo_text: 'ACME'
  });

  await supabase.from('products').upsert({
    id: '22222222-2222-4222-8222-222222222222',
    owner_id: user.id,
    name: 'Bluetooth Speaker X',
    model: 'SPK-100',
    sku: 'SPK-100-DE',
    description: 'Portable Bluetooth speaker with lithium battery and voice assistant.',
    markets: ['DE', 'FR', 'IT'],
    status: 'REVIEW',
    version: 'v1.0'
  });

  await supabase.from('catalog_acts').upsert(
    acts.map((act) => ({
      code: act.code,
      title: act.title,
      type: act.type,
      eli_url: act.eli_url,
      summary_de: act.summary_de,
      summary_en: act.summary_en,
      summary_zh: act.summary_zh
    }))
  );

  await supabase.from('catalog_standards').upsert(
    standards.standards.map((standard) => ({
      code: standard.code,
      title: standard.title,
      family: standard.family ?? null,
      relates_to_acts: standard.acts
    }))
  );

  console.log('Seed completed');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
