interface RecoveryIconProps {
  className?: string;
}

export const RecoveryIcon = ({ className }: RecoveryIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Three flowing wave lines */}
    <path d="M2 6c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
  </svg>
);
