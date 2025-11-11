import { useEffect, useState } from 'react'
import { getSupabase } from '@/auth/supabase'

interface DocumentRow {
  id: string
  title: string | null
  content: string | null
  created_at: string | null
}

export default function AllDocs() {
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    let cancelled = false
    supabase
      .from('documents')
      .select('*')
      .eq('kind', 'doc_eu_declaration')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error(error)
          setDocs([])
        } else {
          const rows = (data ?? []) as DocumentRow[]
          setDocs(rows)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <div className="p-4">Lade…</div>

  return (
    <div className="p-4">
      <h1>Gespeicherte EU-Konformitätserklärungen</h1>
      {docs.length === 0 && <p>Keine Dokumente vorhanden.</p>}
      <ul className="space-y-3">
        {docs.map(doc => (
          <li key={doc.id} className="p-3 border rounded bg-white">
            <strong>{doc.title ?? 'Unbenannt'}</strong>
            <br />
            <small>{doc.created_at ? new Date(doc.created_at).toLocaleString() : ''}</small>
            <div className="mt-2 flex gap-8">
              <button onClick={() => openPreview(doc)}>Ansehen</button>
              <button onClick={() => printDoc(doc)}>Drucken</button>
              <button onClick={() => deleteDoc(doc.id)}>Löschen</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )

  function openPreview(doc: DocumentRow) {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.open()
    w.document.write(doc.content ?? '<p>Kein Inhalt</p>')
    w.document.close()
  }

  function printDoc(doc: DocumentRow) {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(doc.content ?? '<p>Kein Inhalt</p>')
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  async function deleteDoc(id: string) {
    if (!confirm('Wirklich löschen?')) return
    const supabase = getSupabase()
    if (!supabase) {
      setDocs(items => items.filter(doc => doc.id !== id))
      return
    }
    await supabase.from('documents').delete().eq('id', id)
    setDocs(items => items.filter(doc => doc.id !== id))
  }
}
