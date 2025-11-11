import { renderDoCClassic, type DoCData } from '@/docs/templates/docClassic'
import { getSupabase } from '@/auth/supabase'
import type { Tag } from '@/wizard/schema'

type GenInput = {
  projectId: string
  answers: Record<string, any>
  laws: string[]
  locale?: 'de' | 'en'
  type: 'doc_eu_declaration'
}

const LAW_TYPE: Record<string, 'Directive' | 'Regulation'> = {
  'RED 2014/53/EU': 'Directive',
  'EMC 2014/30/EU': 'Directive',
  'LVD 2014/35/EU': 'Directive',
  'RoHS 2011/65/EU': 'Directive',
  'WEEE 2012/19/EU': 'Directive',
  'GPSR (EU) 2023/988': 'Regulation',
  'Batteries (EU) 2023/1542': 'Regulation',
  'Toy Safety 2009/48/EC': 'Directive',
  'Machinery 2006/42/EC': 'Directive',
  '(from 20 Jan 2027: Machinery (EU) 2023/1230)': 'Regulation',
  'PPE (EU) 2016/425': 'Regulation',
  'MDR (EU) 2017/745': 'Regulation',
  'IVDR (EU) 2017/746': 'Regulation',
  'Reg (EC) 1935/2004': 'Regulation',
  'CLP 1272/2008': 'Regulation',
  'REACH 1907/2006': 'Regulation',
  'Gas Appliances (EU) 2016/426': 'Regulation',
  'PED 2014/68/EU': 'Directive',
  'MID 2014/32/EU': 'Directive',
  'CPR (EU) 305/2011': 'Regulation',
  'Outdoor Noise 2000/14/EC': 'Directive',
  'Pyrotechnics 2013/29/EU': 'Directive'
}

function recommendStandards(tags: Tag[]): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = []
  const add = (id: string, title: string) => {
    if (!out.find(x => x.id === id)) out.push({ id, title })
  }

  // Keep close to screenshot defaults
  if (tags.includes('RED')) {
    add('EN 301 489-1', 'EMC standard for radio equipment – Common requirements')
    add('EN 300 328', '2.4 GHz wideband transmission systems')
  }
  if (tags.includes('EEE') || tags.includes('LVD')) {
    add('EN 62368-1', 'AV/ICT equipment – Safety requirements')
  }
  return out
}

async function loadSelectedProfile(
  projectId: string
): Promise<{ name?: string; address?: string } | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('project_data')
    .select('profile_id')
    .eq('project_id', projectId)
    .maybeSingle()
  if (error || !data?.profile_id) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, address_text')
    .eq('id', data.profile_id)
    .maybeSingle()
  if (!profile) return null
  return { name: profile.company_name ?? undefined, address: profile.address_text ?? undefined }
}

export async function generateDocPreview(input: GenInput): Promise<string> {
  const locale = input.locale ?? 'de'
  const answers = input.answers ?? {}
  const tags = (answers.__derivedTags as Tag[] | undefined) ?? []
  const profile = await loadSelectedProfile(input.projectId)

  const d: DoCData = {
    manufacturerName: profile?.name ?? (answers['profile.companyName'] || ''),
    manufacturerAddress: profile?.address ?? (answers['profile.companyAddress'] || ''),
    productName: answers['product.name'] ?? '',
    productModel: answers['product.model'] ?? '',
    productDescription: answers['product.description'] ?? '',
    laws: (input.laws ?? []).map(id => ({ id, type: LAW_TYPE[id] ?? 'Directive' })),
    standards: recommendStandards(tags),
    place: answers['doc.place'] ?? '',
    dateISO: (answers['doc.dateISO'] as string) || new Date().toISOString().slice(0, 10),
    signatoryName: answers['doc.signatoryName'] ?? '',
    signatoryTitle: answers['doc.signatoryTitle'] ?? '',
    signatureText: answers['doc.signatureText'] ?? '',
    version: '1',
    createdAt: new Date().toISOString().replace('T', ', ').slice(0, 19),
    updatedAt: new Date().toISOString().replace('T', ', ').slice(0, 19),
    status: 'ready'
  }

  return renderDoCClassic(d, locale)
}

export async function exportDocPDF(input: GenInput): Promise<void> {
  const html = await generateDocPreview(input)
  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => {
    try {
      w.print()
    } catch (error) {
      console.error('Failed to trigger print', error)
    }
  }, 250)
}

export {
  listTemplates,
  getTemplate,
  createInstance,
  updateInstance,
  loadDrafts,
  saveDrafts,
  exportPDF,
  exportDOCX
} from './generatorUi'
