import { useEffect, useMemo, useState } from 'react'
import localforage from 'localforage'
import { t } from '@/i18n'
import type { ReportSummary } from '@/domain/types'

export type ChecklistItem = {
  id: string
  label: string
  description?: string
}

export type ChecklistGroup = {
  id: string
  title: string
  steps: ChecklistItem[]
}

export const buildChecklistGroups = (report: ReportSummary): ChecklistGroup[] => {
  const documentsById = new Map(report.documents.map(doc => [doc.docId, doc]))
  const testingDocs = ['test_emc', 'test_lvd', 'test_red_rf']
  const testingSteps = testingDocs
    .map(id => documentsById.get(id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
    .map(doc => ({
      id: `testing:${doc.docId}`,
      label: t('results.nextSteps.book', 'Book {document}').replace('{document}', doc.name),
      description: doc.description
    }))

  const exportableDocs = report.documents.filter(doc => doc.status === 'exportable')
  const generateSteps = exportableDocs.map(doc => ({
    id: `generate:${doc.docId}`,
    label: t('results.nextSteps.create', 'Create {document}').replace('{document}', doc.name),
    description: doc.description
  }))

  const uploadDocs = report.documents.filter(doc => doc.status === 'upload')
  const uploadSteps = uploadDocs.map(doc => ({
    id: `upload:${doc.docId}`,
    label: t('results.nextSteps.collect', 'Collect {document}').replace('{document}', doc.name),
    description: doc.description
  }))

  const countrySteps: ChecklistItem[] = []
  report.countries.forEach(country => {
    country.registrations.forEach(reg => {
      countrySteps.push({
        id: `country:${country.code}:${reg.id}`,
        label: t('results.nextSteps.country', '{country}: {registration}')
          .replace('{country}', country.name)
          .replace('{registration}', reg.name),
        description: reg.description
      })
    })
  })

  const groups: ChecklistGroup[] = []
  if (testingSteps.length) {
    groups.push({
      id: 'testing',
      title: t('results.nextSteps.testing', 'Arrange testing & lab work'),
      steps: testingSteps
    })
  }
  if (generateSteps.length) {
    groups.push({
      id: 'generate',
      title: t('results.nextSteps.generate', 'Generate compliance documents'),
      steps: generateSteps
    })
  }
  if (uploadSteps.length) {
    groups.push({
      id: 'upload',
      title: t('results.nextSteps.upload', 'Upload supplier evidence'),
      steps: uploadSteps
    })
  }
  if (countrySteps.length) {
    groups.push({
      id: 'countries',
      title: t('results.nextSteps.countries', 'Complete country registrations'),
      steps: countrySteps
    })
  }
  return groups
}

type ChecklistProps = {
  groups: ChecklistGroup[]
  storageKey: string
  emptyMessage?: string
}

export default function ComplianceChecklist({ groups, storageKey, emptyMessage }: ChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)

  const stepIds = useMemo(() => groups.flatMap(group => group.steps.map(step => step.id)), [groups])

  useEffect(() => {
    let active = true
    setLoaded(false)
    localforage
      .getItem<Record<string, boolean>>(storageKey)
      .then(stored => {
        if (!active) return
        if (stored) {
          setChecked(stored)
        } else {
          setChecked({})
        }
        setLoaded(true)
      })
      .catch(error => {
        console.warn('Failed to load checklist state', error)
        if (!active) return
        setChecked({})
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [storageKey])

  useEffect(() => {
    if (!loaded) return
    setChecked(prev => {
      const next: Record<string, boolean> = {}
      stepIds.forEach(id => {
        next[id] = prev[id] ?? false
      })
      return next
    })
  }, [loaded, stepIds])

  useEffect(() => {
    if (!loaded) return
    void localforage.setItem(storageKey, checked).catch(error => {
      console.warn('Failed to persist checklist state', error)
    })
  }, [checked, loaded, storageKey])

  const handleToggle = (stepId: string, value: boolean) => {
    setChecked(prev => ({ ...prev, [stepId]: value }))
  }

  if (!groups.length) {
    return <p className="muted">{emptyMessage ?? t('results.nextSteps.empty', 'No follow-up tasks generated yet.')}</p>
  }

  return (
    <div className="next-steps">
      {groups.map(group => (
        <div key={group.id} className="next-step-group">
          <h4>{group.title}</h4>
          <ul>
            {group.steps.map(step => (
              <li key={step.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked[step.id] ?? false}
                    onChange={event => handleToggle(step.id, event.target.checked)}
                  />
                  <span>
                    {step.label}
                    {step.description ? <span className="muted"> — {step.description}</span> : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
