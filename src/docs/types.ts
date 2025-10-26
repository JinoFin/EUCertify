export type DocFormat = 'pdf' | 'docx'
export type DocKind =
  | 'EU_DoC'
  | 'Risk_Register'
  | 'TechFile_Checklist'
  | 'Labels_Checklist'
  | 'EPR_Info_Sheet'
  | 'User_Manual_Starter'

export type FieldType =
  | 'text' | 'textarea' | 'date' | 'table' | 'checkbox' | 'multiselect'

export type DocField = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: string[]            // for multiselect
  columns?: string[]            // for table
  help?: string
  auto?: (_ctx: DocContext) => string | string[] | { [k: string]: any } | undefined
}

export type DocTemplate = {
  id: DocKind
  title: string
  description: string
  fields: DocField[]
  footerNotes?: string[]
  exportable: ('pdf' | 'docx')[]
}

export type DocInstance = {
  id: string         // nanoid
  kind: DocKind
  version: number
  createdAt: string
  updatedAt: string
  data: Record<string, any>
  status: 'draft' | 'ready' | 'exported'
}

export type DocContext = {
  answers: import('../domain/types').AnswerMap
  report: import('../domain/types').ReportSummary
  nowISO: string
}
