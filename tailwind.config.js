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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        app: '480px',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
