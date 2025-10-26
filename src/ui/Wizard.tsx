import data from '@/data/eucertify.v1.json'
import { useWizard } from '@/state/useWizard'
export default function Wizard(){
  const { step, questions, answer, next, back } = useWizard()
  const q = questions[step] as any
  if (!q) return <div className="page"><h2>Done</h2><a className="btn" href="/results">See results</a></div>
  return (
    <div className="page">
      <div>Step {step+1} of {questions.length}</div>
      <h2>{q.prompt}</h2>
      {q.helpText && <p style={{opacity:.75}}>{q.helpText}</p>}
      {q.type === 'singleChoice' && q.options?.map((o: any) =>
        <button key={o.value} className="btn" onClick={()=>answer(q.id, o.value, o.next)}>{o.label ?? o.value}</button>
      )}
      {q.type === 'multiSelect' &&
        <div style={{display:'grid',gap:8}}>
          {q.options?.map((o: any) =>
            <label key={o.value}><input type="checkbox" onChange={(e)=>answer(q.id, o.value, undefined, e.target.checked)} /> {o.label ?? o.value}</label>
          )}
          <button className="btn" onClick={()=>next()}>Next</button>
        </div>}
      <div className="row" style={{marginTop:12}}>
        <button className="btn ghost" onClick={back}>Back</button>
      </div>
    </div>
  )
}
