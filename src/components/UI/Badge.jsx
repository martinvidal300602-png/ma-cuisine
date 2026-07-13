// src/components/UI/Badge.jsx
/**
 * Badge du design system.
 * variants : ok | warn | danger | neutral (+ tonalités fraîcheur : week | soon | expired | none)
 */
export default function Badge({ variant = 'neutral', className = '', children }) {
  const variants = {
    ok: 'bg-fresh-ok-bg text-fresh-ok',
    week: 'bg-fresh-week-bg text-fresh-week',
    warn: 'bg-fresh-soon-bg text-fresh-soon',
    soon: 'bg-fresh-soon-bg text-fresh-soon',
    danger: 'bg-fresh-expired-bg text-fresh-expired',
    expired: 'bg-fresh-expired-bg text-fresh-expired',
    neutral: 'bg-fresh-none-bg text-fresh-none',
    none: 'bg-fresh-none-bg text-fresh-none',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
        variants[variant] ?? variants.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
