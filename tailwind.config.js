/** @type {import('tailwindcss').Config} */
module.exports = {
  /*
   * Theme is driven by `data-theme="light|dark"` on <html>, set by the
   * no-flash theme script and the ThemeToggle. `dark:` variants follow it.
   */
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Semantic roles — all follow the CSS variables in globals.css. */
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        sky: 'rgb(var(--sky) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        'text-soft': 'rgb(var(--text-soft) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-text': 'rgb(var(--accent-text) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        focus: 'rgb(var(--focus) / <alpha-value>)',
        stripe: 'rgb(var(--stripe-light) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      borderRadius: {
        '4px': '4px',
      },
      boxShadow: {
        'hard-edge': '4px 4px 0 0 rgb(var(--line))',
        'hard-edge-hover': '6px 6px 0 0 rgb(var(--line))',
        'float': '0 10px 24px -16px rgb(var(--sh-float) / 0.25)',
        btn: '3px 3px 0 0 rgb(var(--ink))',
      },
    },
  },
  plugins: [],
}
