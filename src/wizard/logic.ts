import { QUESTIONNAIRE_SCHEMA, type Tag, type Section, type Question } from './schema'

type Answers = Record<string, any>

const replaceOutsideQuotes = (input: string, replacer: (segment: string) => string): string => {
  return input
    .split(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*")/g)
    .map((part, index) => {
      if (index % 2 === 1) return part
      return part.replace(/\b([a-zA-Z_][a-zA-Z0-9_.]*)\b/g, match => replacer(match))
    })
    .join('')
}

function transformExpression(expr: string): string {
  const withIn = expr.replace(
    /([a-zA-Z_][a-zA-Z0-9_.]*)\s+in\s+(\[[^\]]*\])/g,
    (_match, key, arrayLiteral) => `__IN__('${key}', ${arrayLiteral})`
  )

  return replaceOutsideQuotes(withIn, token => {
    if (token === 'true' || token === 'false' || token === 'null' || token === 'undefined') {
      return token
    }
    if (token === '__IN__') return token
    if (token === '&&' || token === '||') return token
    return `__GET__('${token}')`
  })
}

function safeEval(expr: string, answers: Answers): boolean {
  const transformed = transformExpression(expr.trim())
  const fnBody = `const __GET__ = (key) => ${'answers'}?.[key];\n` +
    `const __IN__ = (key, arr) => Array.isArray(arr) ? arr.includes(__GET__(key)) : false;\n` +
    `return Boolean(${transformed});`

  try {
    // eslint-disable-next-line no-new-func
    return Boolean(Function('answers', fnBody)(answers))
  } catch (error) {
    console.warn('Failed to evaluate expression', expr, error)
    return false
  }
}

export function evalExpr(expr: string | undefined, answers: Answers): boolean {
  if (!expr) return true
  return safeEval(expr, answers)
}

export function visibleSections(answers: Answers): Section[] {
  const sections = QUESTIONNAIRE_SCHEMA.sections.map(section => ({ ...section, questions: [...section.questions] }))
  const toSkip = new Set<string>()

  QUESTIONNAIRE_SCHEMA.skipLogic.forEach(rule => {
    if (safeEval(rule.if, answers)) {
      rule.skipSections?.forEach(id => toSkip.add(id))
    }
  })

  return sections.filter(section => !toSkip.has(section.id))
}

export function visibleQuestions(section: Section, answers: Answers): Question[] {
  let result = section.questions.filter(question => !question.showIf || safeEval(question.showIf, answers))

  QUESTIONNAIRE_SCHEMA.skipLogic.forEach(rule => {
    if (safeEval(rule.if, answers) && rule.skipQuestions?.length) {
      const skipSet = new Set(rule.skipQuestions)
      result = result.filter(question => !skipSet.has(question.id))
    }
  })

  return result
}

const NORMALIZE_NONE_PATTERN = /includes\s+'none'/i

export function deriveTagsFromAnswers(answers: Answers): Tag[] {
  const collected = new Set<Tag>()

  QUESTIONNAIRE_SCHEMA.sections.forEach(section => {
    section.questions.forEach(question => {
      const value = answers[question.id]
      if (value === undefined || value === null || value === '') return
      const apply = (tags?: Tag[]) => {
        tags?.forEach(tag => {
          if (QUESTIONNAIRE_SCHEMA.tagsCatalog.includes(tag)) {
            collected.add(tag)
          }
        })
      }

      const mapping = question.onAnswer
      if (!mapping) return

      if (question.type === 'multi-select') {
        const values = Array.isArray(value) ? [...value] : []
        if (question.normalize && NORMALIZE_NONE_PATTERN.test(question.normalize)) {
          if (values.includes('none')) {
            values.length = 0
          }
        }
        if (values.length > 0 && '*nonEmpty*' in mapping) {
          apply((mapping as { '*nonEmpty*': Tag[] })['*nonEmpty*'])
        }
        values.forEach(item => {
          const tags = (mapping as Record<string, Tag[]>)[String(item)]
          apply(tags)
        })
      } else {
        const key = typeof value === 'boolean' ? String(value) : String(value)
        const tags = (mapping as Record<string, Tag[] | undefined>)[key]
        apply(tags)
        if (typeof value === 'string') {
          const fallback = (mapping as Record<string, Tag[] | undefined>)[value]
          if (fallback) apply(fallback)
        }
      }
    })
  })

  QUESTIONNAIRE_SCHEMA.skipLogic.forEach(rule => {
    if (safeEval(rule.if, answers)) {
      rule.removeTags?.forEach(tag => collected.delete(tag))
      rule.skipTags?.forEach(tag => collected.delete(tag))
      rule.forceTags?.forEach(tag => {
        if (QUESTIONNAIRE_SCHEMA.tagsCatalog.includes(tag)) {
          collected.add(tag)
        }
      })
    }
  })

  return Array.from(collected)
}

export function preselectedLaws(tags: Tag[]): string[] {
  const result = new Set<string>()
  tags.forEach(tag => {
    QUESTIONNAIRE_SCHEMA.docPrefill.lawsByTag[tag]?.forEach(law => result.add(law))
  })
  return Array.from(result)
}
