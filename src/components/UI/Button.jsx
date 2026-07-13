// src/components/UI/Button.jsx
/**
 * Bouton du design system.
 * variants : primary | secondary | ghost | danger — tailles : sm | md | lg
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-card transition-colors ' +
    'disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-accent text-white hover:bg-[#275934] active:bg-[#214B2C]',
    secondary: 'bg-card text-text border border-border hover:border-accent hover:text-accent',
    ghost: 'bg-transparent text-accent hover:bg-accent-light',
    danger: 'bg-danger text-white hover:opacity-90 active:opacity-80',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-5 py-3 w-full',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
