import { Link } from 'react-router-dom'
export default function App() {
  return (
    <main className="page">
      <h1>EUCertify</h1>
      <p>EU compliance wizard for products (CE, EPR, country tasks).</p>
      <div className="row">
        <Link className="btn" to="/wizard">Start compliance check</Link>
        <Link className="btn ghost" to="/results">View results</Link>
      </div>
    </main>
  )
}
