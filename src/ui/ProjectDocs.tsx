import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { type SimpleSelection } from '@/docs/selectionUtils'
import { recommendFromTags } from '@/domain/intelligence'
import { useDocuments } from '@/state/useDocuments'
import { useProjectData } from '@/state/useProjectData'
import LegislationStandardsPicker from '@/ui/LegislationStandardsPicker'

type SelectionState = SimpleSelection

type Params = { id?: string; projectId?: string }

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((value, index) => value === right[index])
}

export default function ProjectDocs() {
  const params = useParams<Params>()
  const projectId = params.id ?? params.projectId
  const navigate = useNavigate()
  const { tags, isComplete, overrides, load, saveOverrides, clearOverrides } = useProjectData()
  const createDraft = useDocuments(state => state.createDraft)

  useEffect(() => {
    if (projectId) {
      void load(projectId)
    }
  }, [load, projectId])

  if (!projectId) return null

  if (!isComplete) {
    return (
      <div className="docs-locked">
        <div className="card">
          <h2>Complete the questionnaire</h2>
          <p>Finish the questions for this product to unlock document generation and the auto checklist.</p>
          <button className="btn" type="button" onClick={() => navigate(`/project/${projectId}/wizard`)}>
            Go to Wizard
          </button>
        </div>
      </div>
    )
  }

  const recommended = useMemo(() => recommendFromTags(tags), [tags])

  const selection = useMemo<SelectionState>(() => {
    const legislation = overrides?.legislation_ids?.length
      ? overrides.legislation_ids
      : recommended.legislationIds
    const standards = overrides?.standard_codes?.length
      ? overrides.standard_codes
      : recommended.standardCodes
    return { legislationIds: legislation, standardCodes: standards }
  }, [overrides, recommended])

  const selectionRef = useRef(selection)
  useEffect(() => {
    selectionRef.current = selection
  }, [selection])

  const handlePickerChange = useCallback(
    (next: SelectionState) => {
      const current = selectionRef.current
      const sameLegislation = arraysEqual(next.legislationIds, current.legislationIds)
      const sameStandards = arraysEqual(next.standardCodes, current.standardCodes)
      if (sameLegislation && sameStandards) return

      selectionRef.current = next
      void saveOverrides(projectId, {
        legislation_ids: next.legislationIds,
        standard_codes: next.standardCodes
      })
    },
    [projectId, saveOverrides]
  )

  const handleResetOverrides = useCallback(() => {
    void clearOverrides(projectId)
  }, [clearOverrides, projectId])

  const handleCreateDraft = useCallback(
    (kind: string, title: string) => {
      void createDraft(projectId, kind, title, { selection }).catch(error => {
        console.error('Failed to create draft', error)
      })
    },
    [createDraft, projectId, selection]
  )

  return (
    <div className="project-docs-page">
      <div className="docs-layout">
        <section>
          <h3>Templates</h3>
          <LegislationStandardsPicker initial={selection} onChange={handlePickerChange} />
        <div className="picker-actions">
          <button type="button" className="link" onClick={handleResetOverrides}>
            Reset to recommendations
          </button>
        </div>
        <div className="grid">
          <button
            type="button"
            onClick={() => handleCreateDraft('EU-DoC', 'EU Declaration of Conformity')}
          >
            EU DoC
          </button>
          <button type="button" onClick={() => handleCreateDraft('GRA', 'General Risk Assessment')}>
            GRA
          </button>
          <button
            type="button"
            onClick={() =>
              handleCreateDraft('TF-Checklist', 'Technical File Checklist')
            }
          >
            TF Checklist
          </button>
          <button
            type="button"
            onClick={() => handleCreateDraft('Labels', 'Labels & Markings Checklist')}
          >
            Labels
          </button>
          <button
            type="button"
            onClick={() =>
              handleCreateDraft('UserManual', 'User Manual – Starter Outline')
            }
          >
            User Manual
          </button>
        </div>
      </section>

        <section>
          <h3>Generated Documents</h3>
          <DocsList projectId={projectId} />
        </section>
      </div>
    </div>
  )
}

type DocsListProps = { projectId: string }

function DocsList({ projectId }: DocsListProps) {
  const docs = useDocuments(state => state.docs)
  const fetch = useDocuments(state => state.fetch)
  const remove = useDocuments(state => state.remove)

  useEffect(() => {
    void fetch(projectId).catch(error => {
      console.error('Failed to load documents', error)
    })
  }, [fetch, projectId])

  if (!docs.length) return <p>No drafts yet.</p>

  return (
    <ul>
      {docs.map(doc => (
        <li key={doc.id}>
          <b>{doc.title}</b> <small>({doc.kind}, {doc.status})</small>
          <div className="doc-actions">
            <button type="button" onClick={() => {}}>
              Open
            </button>
            <button
              type="button"
              onClick={() => {
                void remove(doc.id).catch(error => {
                  console.error('Failed to delete document', error)
                })
              }}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
