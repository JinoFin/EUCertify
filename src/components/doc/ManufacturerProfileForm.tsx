import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useProductStore } from '@/store/productStore'

type ManufacturerFormValues = {
  manufacturer_name: string
  manufacturer_address: string
  declaration_place?: string
  signatory_name: string
  signatory_title?: string
  signatory_signature?: string
  declaration_date?: string
}

const today = () => dayjs().format('YYYY-MM-DD')

export default function ManufacturerProfileForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const product = useProductStore(state => state.product)
  const loadProject = useProductStore(state => state.loadProject)
  const updateProject = useProductStore(state => state.updateProject)
  const setLocalFields = useProductStore(state => state.setLocalFields)
  const loading = useProductStore(state => state.loading)
  const error = useProductStore(state => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<ManufacturerFormValues>({
    defaultValues: {
      manufacturer_name: '',
      manufacturer_address: '',
      declaration_place: '',
      signatory_name: '',
      signatory_title: '',
      signatory_signature: '',
      declaration_date: today()
    }
  })

  useEffect(() => {
    if (id) {
      void loadProject(id)
    }
  }, [id, loadProject])

  useEffect(() => {
    if (product) {
      reset({
        manufacturer_name: product.manufacturer_name ?? '',
        manufacturer_address: product.manufacturer_address ?? '',
        declaration_place: product.declaration_place ?? '',
        signatory_name: product.signatory_name ?? '',
        signatory_title: product.signatory_title ?? '',
        signatory_signature: product.signatory_signature ?? '',
        declaration_date: product.declaration_date ?? today()
      })
    }
  }, [product, reset])

  useEffect(() => {
    const subscription = watch(values => {
      setLocalFields(values)
    })
    return () => subscription.unsubscribe()
  }, [setLocalFields, watch])

  const onSubmit = async (values: ManufacturerFormValues) => {
    await updateProject(values)
    if (id) {
      navigate(`/product/${id}`)
    }
  }

  return (
    <div className="doc-profile-form">
      <div className="doc-profile-header">
        <button className="btn ghost" type="button" onClick={() => navigate(-1)}>
          ← Zurück
        </button>
        <h1>Hersteller- & Zeichnungsprofil</h1>
      </div>
      {loading && <p>Daten werden geladen…</p>}
      {error && <p className="error">{error}</p>}
      <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
        <label>
          Herstellername*
          <input
            type="text"
            {...register('manufacturer_name', { required: 'Pflichtfeld' })}
          />
          {errors.manufacturer_name && <span className="error">{errors.manufacturer_name.message}</span>}
        </label>
        <label>
          Herstelleranschrift*
          <textarea
            rows={4}
            {...register('manufacturer_address', { required: 'Pflichtfeld' })}
          />
          {errors.manufacturer_address && <span className="error">{errors.manufacturer_address.message}</span>}
        </label>
        <label>
          Ausstellungsort
          <input type="text" {...register('declaration_place')} />
        </label>
        <label>
          Unterzeichner*in*
          <input type="text" {...register('signatory_name', { required: 'Pflichtfeld' })} />
          {errors.signatory_name && <span className="error">{errors.signatory_name.message}</span>}
        </label>
        <label>
          Position
          <input type="text" {...register('signatory_title')} />
        </label>
        <label>
          Digitale Signatur
          <input type="text" {...register('signatory_signature')} />
        </label>
        <label>
          Ausstellungsdatum
          <input type="date" {...register('declaration_date')} />
        </label>
        <div className="form-actions">
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
