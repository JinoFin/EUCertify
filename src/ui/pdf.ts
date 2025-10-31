import jsPDF from 'jspdf'
import type { ReportSummary, AnswerMap } from '@/domain/types'
import { docFilename } from '@/docs/filename'
import { t } from '@/i18n'

const formatConfidence = (value: number) => {
  if (value >= 0.75) return 'High'
  if (value >= 0.5) return 'Medium'
  return 'Low'
}

export function exportPdf({
  answers: _answers,
  report,
  productName
}: {
  answers: AnswerMap
  report: ReportSummary
  productName?: string
}) {
  const doc = new jsPDF()
  let y = 16

  doc.setFontSize(16)
  doc.text('EUCertify – Compliance Report', 14, y)
  y += 10

  doc.setFontSize(11)
  doc.text(`Product type: ${report.productSummary.type}`, 14, y)
  y += 6
  doc.text(`Role: ${report.productSummary.role}`, 14, y)
  y += 6
  doc.text(
    `Markets: ${report.productSummary.markets.length ? report.productSummary.markets.join(', ') : '—'}`,
    14,
    y
  )
  y += 8

  doc.text('Detected features:', 14, y)
  y += 6
  const features = report.productSummary.detectedTags.length
    ? report.productSummary.detectedTags.join(', ')
    : 'No detected features yet.'
  doc.text(features, 20, y)
  y += 10

  doc.setFontSize(13)
  doc.text('Applicable EU rules', 14, y)
  y += 6
  doc.setFontSize(11)

  report.explain.forEach(entry => {
    if (y > 270) {
      doc.addPage()
      y = 16
    }
    const confidence = formatConfidence(entry.confidence)
    doc.text(`${entry.id} (${confidence} confidence)`, 14, y)
    y += 6
    limit(entry.because, 2).forEach(reason => {
      doc.text(`• ${reason}`, 18, y)
      y += 5
    })
    if (entry.whatToDo.length) {
      doc.text('What to do:', 18, y)
      y += 5
      entry.whatToDo.forEach(action => {
        doc.text(`- ${action}`, 22, y)
        y += 5
      })
    }
    if (entry.evidenceNeeded.length) {
      doc.text('Evidence needed:', 18, y)
      y += 5
      entry.evidenceNeeded.forEach(item => {
        doc.text(`- ${item}`, 22, y)
        y += 5
      })
    }
    y += 4
  })

  if (y > 250) {
    doc.addPage()
    y = 16
  }

  doc.setFontSize(13)
  doc.text('Documentation', 14, y)
  y += 6
  doc.setFontSize(11)

  report.documents.forEach(docItem => {
    if (y > 270) {
      doc.addPage()
      y = 16
    }
    doc.text(`${docItem.name} – ${docItem.provider} (${docItem.status})`, 14, y)
    y += 5
    doc.text(docItem.description, 18, y)
    y += 5
    ;(docItem.notes ?? []).forEach(note => {
      doc.text(`• ${note}`, 22, y)
      y += 5
    })
    y += 2
  })

  if (y > 250) {
    doc.addPage()
    y = 16
  }

  doc.setFontSize(13)
  doc.text('Country obligations', 14, y)
  y += 6
  doc.setFontSize(11)

  report.countries.forEach(country => {
    if (y > 270) {
      doc.addPage()
      y = 16
    }
    doc.text(`${country.name} (${country.code})`, 14, y)
    y += 5
    country.registrations.forEach(reg => {
      doc.text(`• ${reg.name} – ${reg.description}`, 18, y)
      y += 5
    })
    y += 3
  })

  const safeProductName = productName ?? t('pack.safeNameFallback', 'Product')
  const fileLabel = t('results.export.complianceReportLabel', 'Compliance Report')
  doc.save(docFilename(safeProductName, fileLabel, 'pdf'))
}

const limit = (items: string[], count: number) => items.slice(0, count)
