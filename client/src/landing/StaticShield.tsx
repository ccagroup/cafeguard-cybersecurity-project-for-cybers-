export function StaticShield() {
  return (
    <svg
      className="static-shield"
      viewBox="0 0 200 240"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M100 12 20 40v70c0 56 34 92 80 118 46-26 80-62 80-118V40L100 12Z"
        fill="var(--accent)"
      />
      <path
        d="M100 34 42 55v55c0 42 25 70 58 90 33-20 58-48 58-90V55L100 34Z"
        fill="var(--accent-hover)"
      />
      <circle cx="100" cy="98" r="19" fill="var(--surface)" />
      <path d="M91 112h18l5 42H86l5-42Z" fill="var(--surface)" />
    </svg>
  );
}
