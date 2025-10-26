import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import DocRenderer from '@/docs/DocRenderer'
import type { DocInstance, DocTemplate } from '@/docs/types'
import { t } from '@/i18n/strings'

export type DocEditorProps = {
  template: DocTemplate
  draft: DocInstance
  onChange: (_draft: DocInstance) => void
  onSave: () => void
  onExportPdf: () => void
  onExportDocx?: () => void
  onClose?: () => void
}

const ensureRows = (
  field: DocTemplate['fields'][number],
  value: unknown
): Record<string, any>[] => {
  if (field.type !== 'table') return []
  return Array.isArray(value) ? (value as Record<string, any>[]) : []
}

export default function DocEditor({
  template,
  draft,
  onChange,
  onSave,
  onExportPdf,
  onExportDocx,
  onClose
}: DocEditorProps) {
  const columnsMap = useMemo(() => {
    const map = new Map<string, string[]>()
    template.fields.forEach(field => {
      if (field.type === 'table') {
        const rows = ensureRows(field, draft.data[field.key])
        const cols = field.columns && field.columns.length
          ? field.columns
          : rows.length
          ? Object.keys(rows[0])
          : []
        map.set(field.key, cols)
      }
    })
    return map
  }, [template, draft])

  const updateField = (key: string, value: unknown) => {
    onChange({
      ...draft,
      data: { ...draft.data, [key]: value },
      updatedAt: new Date().toISOString()
    })
  }

  const handleTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    updateField(name, value)
  }

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    updateField(name, checked)
  }

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    updateField(name, value)
  }

  const handleMultiselectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, selectedOptions } = event.target
    const values = Array.from(selectedOptions).map(option => option.value)
    updateField(name, values)
  }

  const handleTableCellChange = (
    fieldKey: string,
    rowIndex: number,
    column: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const targetField = template.fields.find(field => field.key === fieldKey)
    if (!targetField || targetField.type !== 'table') return
    const rows = ensureRows(targetField, draft.data[fieldKey])
    const updated = rows.map((row, index) => {
      if (index !== rowIndex) return row
      return { ...row, [column]: event.target.value }
    })
    updateField(fieldKey, updated)
  }

  const handleAddRow = (fieldKey: string) => {
    const field = template.fields.find(item => item.key === fieldKey)
    if (!field || field.type !== 'table') return
    const rows = ensureRows(field, draft.data[fieldKey])
    const columns = columnsMap.get(fieldKey) ?? field.columns ?? []
    if (columns.length === 0) return
    const emptyRow = columns.reduce<Record<string, string>>((acc, column) => {
      acc[column] = ''
      return acc
    }, {})
    updateField(fieldKey, [...rows, emptyRow])
  }

  const handleRemoveRow = (fieldKey: string, rowIndex: number) => {
    const field = template.fields.find(item => item.key === fieldKey)
    if (!field || field.type !== 'table') return
    const rows = ensureRows(field, draft.data[fieldKey])
    const nextRows = rows.filter((_, index) => index !== rowIndex)
    updateField(fieldKey, nextRows)
  }

  return (
    <div className="doc-editor">
      <header className="editor-bar">
        <div>
          <h2>{template.title}</h2>
          <p>{template.description}</p>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button" onClick={onSave}>
            {t('docs.actions.save', 'Save draft')}
          </button>
          <button className="btn" type="button" onClick={onExportPdf}>
            {t('docs.actions.exportPdf', 'Export PDF')}
          </button>
          {onExportDocx ? (
            <button className="btn" type="button" onClick={onExportDocx}>
              {t('docs.actions.exportDocx', 'Export DOCX')}
            </button>
          ) : null}
          {onClose ? (
            <button className="btn ghost" type="button" onClick={onClose}>
              ×
            </button>
          ) : null}
        </div>
      </header>
      <div className="editor-content">
        <form className="editor-form" onSubmit={event => event.preventDefault()}>
          {template.fields.map(field => {
            const value = draft.data[field.key]
            if (field.type === 'text') {
              return (
                <label key={field.key} className="field">
                  <span>{field.label}</span>
                  <input
                    type="text"
                    name={field.key}
                    value={typeof value === 'string' ? value : ''}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={handleTextChange}
                  />
                </label>
              )
            }
            if (field.type === 'textarea') {
              return (
                <label key={field.key} className="field">
                  <span>{field.label}</span>
                  <textarea
                    name={field.key}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={typeof value === 'string' ? value : ''}
                    rows={4}
                    onChange={handleTextChange}
                  />
                  {field.help ? <small>{field.help}</small> : null}
                </label>
              )
            }
            if (field.type === 'date') {
              return (
                <label key={field.key} className="field">
                  <span>{field.label}</span>
                  <input
                    type="date"
                    name={field.key}
                    value={typeof value === 'string' ? value : ''}
                    onChange={handleDateChange}
                  />
                </label>
              )
            }
            if (field.type === 'checkbox') {
              return (
                <label key={field.key} className="field checkbox">
                  <input
                    type="checkbox"
                    name={field.key}
                    checked={Boolean(value)}
                    onChange={handleCheckboxChange}
                  />
                  <span>{field.label}</span>
                </label>
              )
            }
            if (field.type === 'multiselect') {
              const options = field.options?.length
                ? field.options
                : Array.isArray(value)
                ? Array.from(new Set(value))
                : []
              return (
                <label key={field.key} className="field">
                  <span>{field.label}</span>
                  <select
                    name={field.key}
                    multiple
                    value={Array.isArray(value) ? value : []}
                    onChange={handleMultiselectChange}
                  >
                    {options.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }
            if (field.type === 'table') {
              const rows = ensureRows(field, value)
              const columns = columnsMap.get(field.key) ?? []
              return (
                <div key={field.key} className="field table">
                  <div className="table-header">
                    <span>{field.label}</span>
                    <button
                      className="link"
                      type="button"
                      onClick={() => handleAddRow(field.key)}
                    >
                      {t('docs.table.addRow', 'Add row')}
                    </button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        {columns.map(column => (
                          <th key={column}>{column}</th>
                        ))}
                        <th aria-hidden />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length + 1} className="doc-empty">
                            {t('doc.table.empty', 'No entries yet')}
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, index) => (
                          <tr key={index}>
                            {columns.map(column => (
                              <td key={column}>
                                <input
                                  type="text"
                                  value={row?.[column] ?? ''}
                                  onChange={event =>
                                    handleTableCellChange(field.key, index, column, event)
                                  }
                                />
                              </td>
                            ))}
                            <td>
                              <button
                                className="link"
                                type="button"
                                onClick={() => handleRemoveRow(field.key, index)}
                              >
                                {t('docs.table.remove', 'Remove')}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )
            }
            return null
          })}
        </form>
        <aside className="editor-preview">
          <DocRenderer template={template} instance={draft} />
        </aside>
      </div>
    </div>
  )
}
