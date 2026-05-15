tailwind.config = {
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', 'bg-soft': 'var(--bg-soft)', 'bg-card': 'var(--bg-card)', 'bg-sand': 'var(--bg-sand)',
        ink: 'var(--ink)', 'ink-soft': 'var(--ink-soft)', 'ink-mute': 'var(--ink-mute)',
        primary: 'var(--primary)', 'primary-soft': 'var(--primary-soft)',
        accent: 'var(--accent)', 'accent-soft': 'var(--accent-soft)',
        line: 'var(--line)', 'line-soft': 'var(--line-soft)', 'line-sage': 'var(--line-sage)',
      },
      fontFamily: { display: 'var(--font-display)', body: 'var(--font-body)', mono: 'var(--font-mono)' },
      maxWidth: { container: 'var(--container)', 'container-narrow': 'var(--container-narrow)' },
      screens: { 'bp-sm': { max: '639px' }, 'bp-md': { max: '900px' } },
      animation: {
        'fade-up':    'fadeUp 0.5s ease both',
        'pulse-soft': 'pulse 2.4s ease-in-out infinite',
        'bounce-dot': 'bounce 1.2s ease-in-out infinite',
      },
    },
  },
};
