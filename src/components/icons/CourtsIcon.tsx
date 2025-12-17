interface CourtsIconProps {
  className?: string;
}

export const CourtsIcon = ({ className }: CourtsIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Simple court with center */}
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="12" y1="5" x2="12" y2="19" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);
