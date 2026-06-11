// src/components/UI/Button.jsx
/**
 * Bouton du design system.
 * variants : primary | secondary | danger — tailles : sm | md | lg
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
    'inline-flex items-center justify-center gap-2 font-medium rounded-card transition-colors ' +
    'disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-accent text-white hover:opacity-90 active:opacity-80',
    secondary: 'bg-card text-text border border-border hover:bg-accent-light',
    danger: 'bg-danger text-white hover:opacity-90 active:opacity-80',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
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
