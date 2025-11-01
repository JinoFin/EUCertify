import type { SVGProps } from 'react'

export default function ChecklistIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M9 11l2 2 4-4" />
      <path d="M4 5h6l1 2h9" />
      <path d="M3 9h4" />
      <path d="M3 13h4" />
      <path d="M3 17h4" />
      <path d="M12 19h8" />
    </svg>
  )
}
