import type { AnswerMap, Question, QuestionOption } from '@/domain/types'

const collectOptionTags = (option: QuestionOption | undefined): string[] => {
  if (!option?.addTags) return []
  return option.addTags.filter(Boolean)
}

const collectMultiTags = (question: Question, selected: string[]): string[] => {
  if (!question.options.length || selected.length === 0) return []
  const optionMap = new Map(question.options.map(opt => [opt.value, opt]))
  const tags = new Set<string>()
  selected.forEach(value => {
    const option = optionMap.get(value)
    collectOptionTags(option).forEach(tag => tags.add(tag))
  })
  return Array.from(tags)
}

export class AnswerBus {
  private tagSet: Set<string>
  private answers: AnswerMap
  private tagsByQuestion: Map<string, string[]>

  constructor() {
    this.tagSet = new Set()
    this.answers = {}
    this.tagsByQuestion = new Map()
  }

  getTags(): Set<string> {
    return this.tagSet
  }

  getAnswers(): AnswerMap {
    return { ...this.answers }
  }

  reset(): void {
    this.tagSet.clear()
    this.answers = {}
    this.tagsByQuestion.clear()
  }

  private replaceQuestionTags(questionId: string, tags: string[]): void {
    const previous = this.tagsByQuestion.get(questionId) ?? []
    previous.forEach(tag => this.tagSet.delete(tag))
    tags.forEach(tag => this.tagSet.add(tag))
    this.tagsByQuestion.set(questionId, tags)
  }

  setSingleAnswer(question: Question, option: QuestionOption | undefined): void {
    if (!option) return
    this.answers = { ...this.answers, [question.id]: option.value }
    const tags = collectOptionTags(option)
    this.replaceQuestionTags(question.id, tags)
  }

  setMultiAnswer(question: Question, selected: string[]): void {
    this.answers = { ...this.answers, [question.id]: selected }
    const tags = collectMultiTags(question, selected)
    this.replaceQuestionTags(question.id, tags)
  }

  retainQuestions(allowed: Set<string>): void {
    const nextAnswers: AnswerMap = {}
    const nextTagsByQuestion = new Map<string, string[]>()
    const nextTagSet = new Set<string>()

    Object.entries(this.answers).forEach(([questionId, value]) => {
      if (!allowed.has(questionId)) {
        return
      }
      nextAnswers[questionId] = value
      const tags = this.tagsByQuestion.get(questionId) ?? []
      if (tags.length) {
        nextTagsByQuestion.set(questionId, tags)
        tags.forEach(tag => nextTagSet.add(tag))
      }
    })

    this.answers = nextAnswers
    this.tagsByQuestion = nextTagsByQuestion
    this.tagSet = nextTagSet
  }
}

export const mergeOptionTags = (option: QuestionOption | undefined, tagSet: Set<string>) => {
  collectOptionTags(option).forEach(tag => tagSet.add(tag))
}

export const mergeMultiTags = (question: Question, selected: string[], tagSet: Set<string>) => {
  collectMultiTags(question, selected).forEach(tag => tagSet.add(tag))
}
