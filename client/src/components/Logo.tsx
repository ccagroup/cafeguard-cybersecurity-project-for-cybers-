export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path d="M16 3 5 7v8c0 7 4.6 11.7 11 14 6.4-2.3 11-7 11-14V7L16 3Z" fill="var(--accent)" />
      <circle cx="16" cy="14" r="3.2" fill="var(--surface)" />
      <path d="M14.6 16.4h2.8l.8 6h-4.4l.8-6Z" fill="var(--surface)" />
    </svg>
  );
}
