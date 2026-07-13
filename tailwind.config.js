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
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        app: '480px',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 0.5px 0 rgba(60, 60, 67, 0.12)',
        sheet: '0 -12px 44px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [],
};
