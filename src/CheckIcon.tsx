interface CheckIconProps {
  size?: number;
  className?: string;
}

export const CheckIcon = ({ size = 18, className = '' }: CheckIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Check mark"
    role="img"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
