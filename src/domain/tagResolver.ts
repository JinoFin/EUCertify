import { answerTags, staticTags } from '@/data'
import type { AnswerMap } from './types'

type ReasonMap = Record<string, string[]>

const TAG_REASON_MAP: Record<string, { ruleId: string; message: string }[]> = {
  'feature:wireless': [{ ruleId: 'RED', message: 'You selected wireless connectivity.' }],
  'feature:electrical': [
    { ruleId: 'EMC', message: 'You indicated it is an electrical/electronic device.' },
    { ruleId: 'RoHS', message: 'Electrical equipment must address hazardous substances.' },
    { ruleId: 'WEEE', message: 'Electrical equipment triggers e-waste producer duties.' }
  ],
  'feature:low_voltage': [
    { ruleId: 'LVD', message: 'The product uses mains or low-voltage power.' }
  ],
  Mains: [{ ruleId: 'LVD', message: 'AC mains selection increases electrical safety scope.' }],
  'feature:lithium': [
    { ruleId: 'REACH', message: 'Rechargeable lithium cells require chemical due diligence.' },
    { ruleId: 'Batteries', message: 'Rechargeable batteries fall under battery EPR.' }
  ],
  'feature:chemicals': [{ ruleId: 'REACH', message: 'Chemical content invokes REACH obligations.' }],
  'use:skin_contact': [{ ruleId: 'REACH', message: 'Skin contact articles need REACH safety checks.' }],
  'feature:battery': [
    { ruleId: 'Batteries', message: 'Contains a battery, so battery producer responsibility applies.' }
  ],
  'audience:children': [{ ruleId: 'GPSR', message: 'Children as primary users increase safety oversight.' }],
  'scope:ce': [{ ruleId: 'GPSR', message: 'Consumer product in scope of CE framework.' }],
  'market:DE': [
    { ruleId: 'Packaging', message: 'Germany selected, so LUCID packaging registration applies.' },
    { ruleId: 'WEEE', message: 'Germany market requires WEEE registration.' }
  ],
  'market:FR': [
    { ruleId: 'Packaging', message: 'France selected, requiring packaging PRO membership.' },
    { ruleId: 'WEEE', message: 'France market triggers WEEE responsibilities.' }
  ],
  'market:ES': [
    { ruleId: 'Packaging', message: 'Spain selected, requiring packaging compliance scheme.' },
    { ruleId: 'WEEE', message: 'Spain market expects RAEE registration.' }
  ],
  'market:IT': [
    { ruleId: 'Packaging', message: 'Italy selected, triggering CONAI packaging obligations.' },
    { ruleId: 'WEEE', message: 'Italy requires Registro AEE enrolment.' }
  ],
  'Radio:2.4GHz': [{ ruleId: 'RED', message: '2.4 GHz radio band confirmed.' }],
  'Radio:subGHz': [{ ruleId: 'RED', message: 'Sub-GHz radio transmission confirmed.' }],
  'Radio:cellular': [{ ruleId: 'RED', message: 'Cellular/telecom radio chosen.' }],
  'Battery:rechargeable': [
    { ruleId: 'Batteries', message: 'Rechargeable pack means lithium battery responsibilities.' }
  ],
  'obligation:epr': [
    { ruleId: 'WEEE', message: 'Producer responsibility markets selected.' },
    { ruleId: 'Packaging', message: 'Producer responsibility markets selected.' },
    { ruleId: 'Batteries', message: 'Producer responsibility markets selected.' }
  ]
}

const addReason = (map: ReasonMap, ruleId: string, message: string) => {
  if (!message) return
  if (!map[ruleId]) {
    map[ruleId] = []
  }
  if (!map[ruleId].includes(message)) {
    map[ruleId].push(message)
  }
}

const processTag = (tag: string, reasons: ReasonMap) => {
  const matches = TAG_REASON_MAP[tag]
  if (!matches) return
  matches.forEach(entry => addReason(reasons, entry.ruleId, entry.message))
}

const addAuxiliaryTags = (answers: AnswerMap, tags: Set<string>, reasons: ReasonMap) => {
  const powerSource = answers['power_source']
  if (powerSource === 'mains') {
    tags.add('Mains')
    processTag('Mains', reasons)
  }

  const batteryType = answers['battery_type']
  if (batteryType === 'rechargeable' || batteryType === 'both') {
    tags.add('Battery:rechargeable')
    processTag('Battery:rechargeable', reasons)
  }

  const bandAnswer = answers['wireless_band']
  const bandValues = Array.isArray(bandAnswer) ? bandAnswer : bandAnswer ? [bandAnswer] : []
  bandValues.forEach(value => {
    if (value) {
      const tag = `Radio:${value}`
      tags.add(tag)
      processTag(tag, reasons)
    }
  })
}

export const resolveTagsDetailed = (
  answers: AnswerMap
): { tags: string[]; reasons: ReasonMap } => {
  const tags = new Set<string>(staticTags)
  const reasons: ReasonMap = {}

  Object.entries(answerTags).forEach(([questionId, values]) => {
    const answer = answers[questionId]
    if (!answer) return
    const selected = Array.isArray(answer) ? answer : [answer]
    selected.forEach(value => {
      const resolved = values?.[value]
      if (!resolved) return
      resolved.forEach(tag => {
        tags.add(tag)
        processTag(tag, reasons)
      })
    })
  })

  addAuxiliaryTags(answers, tags, reasons)

  return { tags: Array.from(tags), reasons }
}

export const resolveTags = (answers: AnswerMap): string[] => {
  return resolveTagsDetailed(answers).tags
}
