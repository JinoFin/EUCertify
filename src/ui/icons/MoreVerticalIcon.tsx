import type { SVGProps } from 'react'

export default function MoreVerticalIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx={12} cy={5} r={1.5} />
      <circle cx={12} cy={12} r={1.5} />
      <circle cx={12} cy={19} r={1.5} />
    </svg>
  )
}
