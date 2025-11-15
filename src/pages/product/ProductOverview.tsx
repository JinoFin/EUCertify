import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { useQuestionnaireStore } from '@/store/questionnaireStore'

export default function ProductOverview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const product = useProductStore(state => state.product)
  const loadProject = useProductStore(state => state.loadProject)
  const loading = useProductStore(state => state.loading)
  const updateProject = useProductStore(state => state.updateProject)
  const recomputeFromTags = useQuestionnaireStore(state => state.recomputeFromTags)

  useEffect(() => {
    if (id) {
      void loadProject(id)
    }
  }, [id, loadProject])

  const handleRecalculate = async () => {
    if (!product) return
    const result = recomputeFromTags(product.derived_tags ?? [])
    await updateProject({
      derived_tags: result.derived_tags,
      laws: result.laws,
      standards: result.standards
    })
  }

  if (loading || !product) {
    return <p>Produkt wird geladen…</p>
  }

  return (
    <div className="product-overview">
      <header>
        <button className="btn ghost" type="button" onClick={() => navigate(-1)}>
          ← Zurück
        </button>
        <h1>{product.name}</h1>
      </header>
      <div className="product-actions">
        <button className="btn" type="button" onClick={() => navigate(`/product/${product.id}/profile`)}>
          Herstellerprofil bearbeiten
        </button>
        <button className="btn ghost" type="button" onClick={() => navigate(`/product/${product.id}/doc`)}>
          EU-Konformitätserklärung öffnen
        </button>
        <button className="btn ghost" type="button" onClick={handleRecalculate}>
          Empfohlene Richtlinien neu berechnen
        </button>
      </div>
      <section>
        <h2>Hersteller</h2>
        <p>{product.manufacturer_name ?? '—'}</p>
        <p>{product.manufacturer_address ?? '—'}</p>
      </section>
      <section>
        <h2>Signatur</h2>
        <p>{product.signatory_name ?? '—'}</p>
        <p>{product.signatory_title ?? '—'}</p>
      </section>
      <section>
        <h2>Ermittelte Merkmale</h2>
        <p>{product.derived_tags?.length ? product.derived_tags.join(', ') : '—'}</p>
      </section>
      <section>
        <h2>EU-Richtlinien</h2>
        {product.laws?.length ? (
          <ul>
            {product.laws.map(law => (
              <li key={law}>{law}</li>
            ))}
          </ul>
        ) : (
          <p>Keine Richtlinien berechnet.</p>
        )}
      </section>
      <section>
        <h2>EN-Normen</h2>
        {product.standards?.length ? (
          <ul>
            {product.standards.map(standard => (
              <li key={standard}>{standard}</li>
            ))}
          </ul>
        ) : (
          <p>Keine Normen berechnet.</p>
        )}
      </section>
    </div>
  )
}
