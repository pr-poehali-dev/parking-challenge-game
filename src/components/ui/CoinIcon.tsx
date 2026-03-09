interface CoinIconProps {
  size?: number;
  className?: string;
}

export function CoinIcon({ size = 16, className = '' }: CoinIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="11" fill="#F5C518" />
      <circle cx="12" cy="12" r="9" fill="#F0A500" />
      <circle cx="12" cy="12" r="7" fill="#F5C518" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#8B6500"
        fontFamily="sans-serif"
      >$</text>
    </svg>
  );
}

interface GemIconProps {
  size?: number;
  className?: string;
}

export function GemIcon({ size = 16, className = '' }: GemIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="#5B8AF0" />
      <path d="M12 2L3 9H21L12 2Z" fill="#7BA5FF" />
      <path d="M3 9L12 22L5 9H3Z" fill="#3A6ACC" />
      <path d="M21 9L12 22L19 9H21Z" fill="#3A6ACC" />
    </svg>
  );
}

export default CoinIcon;
