import de from '@/i18n/de.json'

export function tDoc(key: string): string {
  const parts = key.split('.')
  let value: any = de
  for (const part of parts) {
    value = value?.[part]
  }
  return typeof value === 'string' ? value : key
}
