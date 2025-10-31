export function docFilename(productName: string, docType: string, ext: 'pdf' | 'docx') {
  const safe = productName
    .trim()
    .replace(/[^\p{L}\p{N}\-_\s]/gu, '')
    .replace(/\s+/g, '_')
  const type = docType.trim().replace(/\s+/g, '_')
  const productSegment = safe.length ? safe : 'Product'
  const typeSegment = type.length ? type : 'Document'
  return `${productSegment}__${typeSegment}.${ext}`
}
