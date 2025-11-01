import type { SVGProps } from 'react'

export default function LockIcon(props: SVGProps<SVGSVGElement>) {
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
      <rect x={5} y={11} width={14} height={10} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <path d="M12 15v3" />
    </svg>
  )
}
