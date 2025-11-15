import html2pdf from 'html2pdf.js'
import type { ProductRecord } from '@/store/productStore'

const sanitizeFilename = (value: string) => value.replace(/[^a-z0-9-_]+/gi, '_')

export async function exportDocPdf(product: ProductRecord | null) {
  const element = document.getElementById('doc-a4')
  if (!element) {
    throw new Error('Document container not found')
  }
  const safeName = sanitizeFilename(product?.name ?? 'product')
  await html2pdf()
    .set({
      margin: 0,
      filename: `${safeName}_EU_Declaration.pdf`,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      html2canvas: { scale: 2, useCORS: true }
    })
    .from(element)
    .save()
}
