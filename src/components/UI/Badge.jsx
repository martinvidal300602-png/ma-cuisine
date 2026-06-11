// src/components/UI/Badge.jsx
/**
 * Badge du design system.
 * variants : ok (vert) | warn (orange) | danger (rouge) | neutral (gris)
 */
export default function Badge({ variant = 'neutral', className = '', children }) {
  const variants = {
    ok: 'bg-accent-light text-accent',
    warn: 'bg-warn-light text-warn',
    danger: 'bg-[#FBEAE8] text-danger',
    neutral: 'bg-border/60 text-muted',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        variants[variant] ?? variants.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
