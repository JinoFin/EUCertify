import { evaluate } from '@/domain/engine'
import { useWizard } from '@/state/useWizard'
import { exportPdf } from '@/ui/pdf'
export default function Results(){
  const { answers, countriesInfo } = useWizard()
  const res = evaluate(answers)
  return (
    <div className="page">
      <h2>Results</h2>
      <div>{res.tags.map(t => <span key={t} className="badge">{t}</span>)}</div>
      <h3>Applicable legislation</h3>
      <Section title="Directives" items={res.applies.filter(a=>a.type==='Directive')} />
      <Section title="Regulations" items={res.applies.filter(a=>a.type==='Regulation')} />
      <Section title="Horizontal"  items={res.applies.filter(a=>a.type==='Horizontal')} />
      <Section title="EPR"         items={res.applies.filter(a=>a.type==='EPR')} />
      <h3>Conformity path</h3>
      <ul>{res.conformityModules.map(m=><li key={m}>{m}</li>)}</ul>
      <h3>Country tasks</h3>
      {countriesInfo().map(([cc, text]) => <div key={cc}><strong>{cc}</strong><p>{text}</p></div>)}
      <h3>Checklists</h3>
      <ul>{res.outputs.map(o => <li key={o}>{o}</li>)}</ul>
      <button className="btn" onClick={()=>exportPdf({answers:answers, result:res})}>Export PDF</button>
    </div>
  )
}
function Section({title, items}:{title:string, items:any[]}) {
  if (!items.length) return null
  return (<div><h4>{title}</h4><ul>{items.map(i=><li key={i.type+':'+i.id}>{i.id}</li>)}</ul></div>)
}
