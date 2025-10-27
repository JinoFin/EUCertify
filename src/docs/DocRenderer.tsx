import React from 'react'
import type { DocInstance, DocTemplate } from './types'
import { tDoc } from './i18nDoc'

type Props = {
  template: DocTemplate
  instance: DocInstance
}

const STATUS_LABELS: Record<DocInstance['status'], string> = {
  draft: tDoc('docs.common.status.draft'),
  ready: tDoc('docs.common.status.ready'),
  exported: tDoc('docs.common.status.exported')
}

const formatDate = (value: string) => {
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
  } catch {
    return value
  }
}

const renderValue = (field: DocTemplate['fields'][number], value: any) => {
  switch (field.type) {
    case 'checkbox':
      return value ? tDoc('docs.common.fieldYes') : tDoc('docs.common.fieldNo')
    case 'multiselect':
      return Array.isArray(value) ? value.join(', ') : value || ''
    case 'table': {
      const rows = Array.isArray(value) ? value : []
      const columns = field.columns && field.columns.length > 0
        ? field.columns
        : rows.length > 0
        ? Object.keys(rows[0])
        : []
      return (
        <table className="doc-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="doc-empty">
                  {tDoc('docs.common.table.empty')}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  {columns.map(column => (
                    <td key={column}>{row?.[column] ?? ''}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )
    }
    case 'date':
      return formatDate(value)
    default:
      return typeof value === 'string' ? value : value ?? ''
  }
}

export default function DocRenderer({ template, instance }: Props) {
  return (
    <div className="doc-renderer">
      <header className="doc-header">
        <div>
          <h1>{template.title}</h1>
          <p className="doc-description">{template.description}</p>
        </div>
        {template.exportable.includes('pdf') && (
          <span className="doc-badge" aria-label={tDoc('docs.common.badge')}>
            {tDoc('docs.common.badge')}
          </span>
        )}
      </header>
      <section className="doc-meta">
        <div>
          <strong>{tDoc('docs.common.meta.version')}</strong>
          <span>{instance.version}</span>
        </div>
        <div>
          <strong>{tDoc('docs.common.meta.created')}</strong>
          <span>{formatDate(instance.createdAt)}</span>
        </div>
        <div>
          <strong>{tDoc('docs.common.meta.updated')}</strong>
          <span>{formatDate(instance.updatedAt)}</span>
        </div>
        <div>
          <strong>{tDoc('docs.common.meta.status')}</strong>
          <span>{STATUS_LABELS[instance.status]}</span>
        </div>
      </section>

      <section className="doc-fields">
        {template.fields.map(field => (
          <article className="doc-field" key={field.key}>
            <header>
              <h2>{field.label}</h2>
              {field.help ? <small>{field.help}</small> : null}
            </header>
            <div className="doc-value">{renderValue(field, instance.data[field.key])}</div>
          </article>
        ))}
      </section>

      {template.footerNotes?.length ? (
        <footer className="doc-footer">
          <h3>{tDoc('docs.common.footerTitle')}</h3>
          <ul>
            {template.footerNotes.map(note => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </footer>
      ) : null}
    </div>
  )
}
