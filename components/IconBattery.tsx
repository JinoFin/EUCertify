export function IconBattery(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2" y="8" width="40" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
      <rect x="42" y="12" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M14 16h6l-2 4h6l-6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
