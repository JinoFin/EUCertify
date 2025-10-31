import { useCallback, useEffect, useState } from 'react'
import type { TouchEvent } from 'react'
import { t } from '@/i18n'
import './onboarding.css'

type SlideConfig = {
  titleKey: string
  titleFallback: string
  bodyKey: string
  bodyFallback: string
  illustration?: string
}

type Slide = {
  title: string
  body: string
  illustration?: string
}

const SLIDES: SlideConfig[] = [
  {
    titleKey: 'onboarding.slide1.title',
    titleFallback: 'Welcome to EUCertify',
    bodyKey: 'onboarding.slide1.text',
    bodyFallback: 'Answer a few questions. We tailor laws, EN standards, and docs.',
    illustration: '👋'
  },
  {
    titleKey: 'onboarding.slide2.title',
    titleFallback: 'Adaptive questionnaire',
    bodyKey: 'onboarding.slide2.text',
    bodyFallback: 'Questions change based on your answers (toy, radio, battery, age…).',
    illustration: '🧭'
  },
  {
    titleKey: 'onboarding.slide3.title',
    titleFallback: 'Results & tags',
    bodyKey: 'onboarding.slide3.text',
    bodyFallback: 'See detected features and applicable rules at a glance.',
    illustration: '🏷️'
  },
  {
    titleKey: 'onboarding.slide4.title',
    titleFallback: 'Generate documents',
    bodyKey: 'onboarding.slide4.text',
    bodyFallback: 'Create DoC, Risk, Tech File, Labels, EPR sheets. Edit before export.',
    illustration: '🧾'
  },
  {
    titleKey: 'onboarding.slide5.title',
    titleFallback: 'Languages',
    bodyKey: 'onboarding.slide5.text',
    bodyFallback: 'UI in EN/DE/中文. Document exports stay in German.',
    illustration: '🌐'
  }
]

const DOT_LABEL = '●'

export type OnboardingProps = {
  onDone: () => void
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const slides: Slide[] = SLIDES.map((slide) => ({
    title: t(slide.titleKey, slide.titleFallback),
    body: t(slide.bodyKey, slide.bodyFallback),
    illustration: slide.illustration
  }))

  const totalSlides = slides.length
  const [current, setCurrent] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const goNext = useCallback(() => {
    if (current >= totalSlides - 1) {
      onDone()
      return
    }
    setCurrent((prev) => Math.min(prev + 1, totalSlides - 1))
  }, [current, onDone, totalSlides])

  const goPrev = useCallback(() => {
    setCurrent((prev) => Math.max(prev - 1, 0))
  }, [])

  const skip = useCallback(() => {
    onDone()
  }, [onDone])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        skip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, skip])

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 0) {
      setTouchStartX(event.touches[0].clientX)
    }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || event.changedTouches.length === 0) {
      setTouchStartX(null)
      return
    }
    const delta = event.changedTouches[0].clientX - touchStartX
    if (delta > 50) {
      goPrev()
    } else if (delta < -50) {
      goNext()
    }
    setTouchStartX(null)
  }

  const currentSlide = slides[current]

  return (
    <div
      className="onboarding"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="onboarding-card">
        {currentSlide.illustration && (
          <div className="onboarding-illustration" aria-hidden="true">
            {currentSlide.illustration}
          </div>
        )}
        <h1 id="onboarding-title" className="onboarding-title">
          {currentSlide.title}
        </h1>
        <p className="onboarding-body">{currentSlide.body}</p>

        <div className="onboarding-dots" role="tablist" aria-label={t('onboarding.progress', 'Onboarding progress')}>
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`onboarding-dot${index === current ? ' onboarding-dot--active' : ''}`}
              aria-label={t('onboarding.progress.step', '{current} / {total}')
                .replace('{current}', String(index + 1))
                .replace('{total}', String(totalSlides))}
              aria-pressed={index === current}
              onClick={() => setCurrent(index)}
            >
              {DOT_LABEL}
            </button>
          ))}
        </div>

        <div className="onboarding-actions">
          <button
            type="button"
            className="onboarding-btn onboarding-btn--ghost"
            onClick={goPrev}
            disabled={current === 0}
          >
            {t('onb.back', 'Back')}
          </button>
          <div className="onboarding-actions-right">
            <button
              type="button"
              className="onboarding-btn onboarding-btn--ghost"
              onClick={skip}
            >
              {t('onb.skip', 'Skip')}
            </button>
            <button type="button" className="onboarding-btn" onClick={goNext}>
              {current === totalSlides - 1 ? t('onb.done', 'Done') : t('onb.next', 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
