import type { ProductRecord } from '@/store/productStore'

export type ProjectMetadata = {
  name?: string
  model?: string
  sku?: string
  description?: string
}

export type DocData = {
  productName: string
  productModel: string
  manufacturerName: string
  manufacturerAddress: string
  declarationPlace: string
  declarationDate: string
  signatoryName: string
  signatoryTitle: string
  signatorySignature: string
  derived_tags: string[]
  laws: string[]
  standards: string[]
}

const today = () => new Date().toISOString().slice(0, 10)

export function getDocData(
  product: ProductRecord | null,
  project?: ProjectMetadata,
  laws: string[] = [],
  standards: string[] = []
): DocData {
  const productName = product?.name ?? project?.name ?? 'Product'
  const declarationDate = product?.declaration_date ?? today()
  return {
    productName,
    productModel: project?.model ?? '—',
    manufacturerName: product?.manufacturer_name ?? '—',
    manufacturerAddress: product?.manufacturer_address ?? '—',
    declarationPlace: product?.declaration_place ?? '—',
    declarationDate,
    signatoryName: product?.signatory_name ?? '—',
    signatoryTitle: product?.signatory_title ?? '—',
    signatorySignature: product?.signatory_signature ?? '—',
    derived_tags: product?.derived_tags ?? [],
    laws: laws.length ? laws : product?.laws ?? [],
    standards: standards.length ? standards : product?.standards ?? []
  }
}
