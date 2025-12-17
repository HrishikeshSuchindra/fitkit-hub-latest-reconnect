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
    {/* Swimming person icon */}
    <circle cx="19" cy="6" r="2.5" />
    <path d="M3 18c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5 3 1.5 4.5 1.5 3-.5 4.5-1.5" />
    <path d="M3 13.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5" />
    <path d="M12 13.5l4-3.5-2-2.5 3-2" />
    <path d="M7 11l3.5-1" />
  </svg>
);
