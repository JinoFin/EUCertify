import { useWizard } from '@/state/useWizard'
export default function DevExample(){
  const { loadExample } = useWizard()
  return <div className="page">
    <h2>Dev Example</h2>
    <button className="btn" onClick={loadExample}>Prefill Bluetooth Speaker</button>
    <a className="btn ghost" href="/results">Go to results</a>
  </div>
}
