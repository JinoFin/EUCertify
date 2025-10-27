export const ONBOARDING_KEY = 'eucertify:onboarding_seen'

export const markOnboardingSeen = () => {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDING_KEY, '1')
}

export const hasSeenOnboarding = () => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}
