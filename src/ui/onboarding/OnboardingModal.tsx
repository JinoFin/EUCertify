import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Onboarding from './Onboarding'

export type OnboardingModalProps = {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  if (typeof document === 'undefined') {
    return null
  }

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return createPortal(<Onboarding onDone={onClose} />, document.body)
}
