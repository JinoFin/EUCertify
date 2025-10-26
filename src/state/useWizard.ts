import { create } from 'zustand'
import data from '@/data/eucertify.v1.json'
import localforage from 'localforage'
type AnswerMap = Record<string, string | string[]>
type S = {
  step: number
  questions: any[]
  answers: AnswerMap
  answer: (id:string, value:string, next?:string, checked?:boolean)=>void
  next: ()=>void
  back: ()=>void
  countriesInfo: ()=>[string,string][]
  loadExample: ()=>void
}
const save = async (answers:AnswerMap)=>localforage.setItem('eucertify:v1', answers)
const load = async ()=>await localforage.getItem<AnswerMap>('eucertify:v1') || {}
export const useWizard = create<S>((set,get)=>{
  const initial: S = {
    step: 0,
    questions: (data as any).questionsFlow ?? [],
    answers: {},
    answer: (id, value, next, checked) => {
      const a = { ...get().answers }
      if (typeof checked === 'boolean') {
        const current = Array.isArray(a[id]) ? (a[id] as string[]) : []
        const arr = new Set(current)
        if (checked) arr.add(value); else arr.delete(value)
        a[id] = Array.from(arr)
      } else {
        a[id] = value
        if (next) {
          const i = get().questions.findIndex(q=>q.id===next)
          if (i>=0) set({ step:i })
        }
      }
      set({ answers:a }); save(a)
    },
    next: () => set(s => ({ step: Math.min(s.step+1, s.questions.length) })),
    back: () => set(s => ({ step: Math.max(0, s.step-1) })),
    countriesInfo: () => {
      const cc = (get().answers['q_target_countries'] as string[]) || []
      return cc.map(c=>[c, (data.countryNuances as any)[c] ? Object.values((data.countryNuances as any)[c]).join(' ') : ''] as [string,string])
    },
    loadExample: () => {
      const a: AnswerMap = {
        "q_product_type":"electrical_device","q_supply_chain":"manufacturer","q_is_electrical":"yes",
        "q_contains_battery":"yes_rechargeable","q_has_wireless":"yes","q_power_supply":"low_voltage",
        "q_intended_children":"no","q_moving_parts":"no","q_food_contact":"no","q_contains_chemicals":"no",
        "q_skin_contact":"no","q_outdoor_use":"no","q_target_countries":["DE","FR"],"q_existing_docs":"no","q_needs_docs":"generate"
      }
      set({ answers:a }); save(a)
    }
  }
  load().then(answers=>{
    if (Object.keys(answers).length) set({ answers })
  })
  return initial
})
