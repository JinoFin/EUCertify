import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { getDocData } from '@/utils/docData'
import { exportDocPdf } from '@/utils/pdf'
import EUDeclarationA4 from '@/components/doc/EUDeclarationA4'

export default function DocPreview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const product = useProductStore(state => state.product)
  const loadProject = useProductStore(state => state.loadProject)
  const loading = useProductStore(state => state.loading)
  const error = useProductStore(state => state.error)

  useEffect(() => {
    if (id) {
      void loadProject(id)
    }
  }, [id, loadProject])

  const docData = useMemo(() => {
    if (!product) return null
    return getDocData(product, { name: product.name }, product.laws, product.standards)
  }, [product])

  const handleExport = async () => {
    if (!product) return
    await exportDocPdf(product)
  }

  return (
    <div className="doc-preview-page">
      <div className="preview-controls">
        <button className="btn ghost" type="button" onClick={() => navigate(`/product/${id}`)}>
          ← Zurück
        </button>
        <button className="btn ghost" type="button" onClick={() => navigate(`/product/${id}/profile`)}>
          Herstellerprofil bearbeiten
        </button>
        <button className="btn" type="button" onClick={handleExport} disabled={!docData}>
          PDF exportieren
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="preview-wrapper">
        <div className="preview-content">
          {loading && <p>Dokument wird geladen…</p>}
          {!loading && !docData && <p>Produkt nicht gefunden.</p>}
          {!loading && docData && <EUDeclarationA4 data={docData} />}
        </div>
      </div>
    </div>
  )
}
