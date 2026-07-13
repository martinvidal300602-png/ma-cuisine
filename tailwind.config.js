// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        accent: 'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        warn: 'var(--color-warn)',
        'warn-light': 'var(--color-warn-light)',
        danger: 'var(--color-danger)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        fresh: {
          ok: 'var(--fresh-ok)',
          'ok-bg': 'var(--fresh-ok-bg)',
          week: 'var(--fresh-week)',
          'week-bg': 'var(--fresh-week-bg)',
          soon: 'var(--fresh-soon)',
          'soon-bg': 'var(--fresh-soon-bg)',
          expired: 'var(--fresh-expired)',
          'expired-bg': 'var(--fresh-expired-bg)',
          none: 'var(--fresh-none)',
          'none-bg': 'var(--fresh-none-bg)',
        },
      },
      fontFamily: {
        sans: ['Gabarito', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Gabarito', 'system-ui', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        app: '480px',
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(30, 36, 32, 0.05)',
        sheet: '0 -8px 30px rgba(30, 36, 32, 0.12)',
      },
    },
  },
  plugins: [],
};
