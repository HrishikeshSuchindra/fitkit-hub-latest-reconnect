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
    {/* Outer rectangle */}
    <rect x="2" y="4" width="20" height="16" rx="1" />
    {/* Center line */}
    <line x1="12" y1="4" x2="12" y2="20" />
    {/* Center circle */}
    <circle cx="12" cy="12" r="2.5" />
    {/* Top service boxes */}
    <line x1="6" y1="4" x2="6" y2="9" />
    <line x1="18" y1="4" x2="18" y2="9" />
    <line x1="6" y1="9" x2="18" y2="9" />
    {/* Bottom service boxes */}
    <line x1="6" y1="20" x2="6" y2="15" />
    <line x1="18" y1="20" x2="18" y2="15" />
    <line x1="6" y1="15" x2="18" y2="15" />
  </svg>
);
