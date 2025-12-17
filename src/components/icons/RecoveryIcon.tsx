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
    {/* Clean wave/water icon */}
    <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
    <path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
  </svg>
);
