import type { SVGProps } from 'react'

export default function WizardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 20 16 8" />
      <path d="m14 6 4-4 2 2-4 4" />
      <path d="m3 21 3-1-2-2z" />
    </svg>
  )
}
