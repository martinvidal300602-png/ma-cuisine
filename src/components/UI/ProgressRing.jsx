// src/components/UI/ProgressRing.jsx
/**
 * Anneau de progression SVG (mode courses).
 */
export default function ProgressRing({ value = 0, total = 1, size = 54, stroke = 5 }) {
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${value} sur ${total}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 300ms ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-num text-xs font-semibold">
        {value}/{total}
      </span>
    </div>
  );
}
