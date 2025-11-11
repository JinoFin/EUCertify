import { useEffect, useState } from 'react'
import { useProfiles } from '@/state/useProfiles'

export default function Profiles() {
  const { items, fetch, create, remove } = useProfiles()
  const [name, setName] = useState('')
  const [addr, setAddr] = useState('')

  useEffect(() => {
    void fetch().catch(error => {
      console.error('Failed to load profiles', error)
    })
  }, [fetch])

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    void create(trimmed, addr).then(() => {
      setName('')
      setAddr('')
    })
  }

  return (
    <div className="p-4">
      <h1>Firmenprofile</h1>
      <div className="space-y-2 mb-6">
        <input value={name} onChange={event => setName(event.target.value)} placeholder="Firmenname" />
        <textarea
          value={addr}
          onChange={event => setAddr(event.target.value)}
          placeholder="Adresse (mehrzeilig erlaubt)"
          rows={4}
          style={{ resize: 'vertical' }}
        />
        <button onClick={handleCreate}>Profil anlegen</button>
      </div>
      <ul className="space-y-3">
        {items.map(profile => (
          <li key={profile.id} className="p-3 border rounded bg-white">
            <strong>{profile.company_name}</strong>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{profile.address_text ?? ''}</pre>
            <button onClick={() => void remove(profile.id)}>Löschen</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
