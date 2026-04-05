import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Spotify-inspired palette
        spotify: {
          green:    '#1DB954',
          'green-dim': '#17a34a',
          black:    '#121212',
          dark:     '#181818',
          card:     '#282828',
          'card-hover': '#3E3E3E',
          light:    '#B3B3B3',
          white:    '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow':   'spin 3s linear infinite',
        'pulse-slow':  'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':     'fadeIn 0.2s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'equalizer':   'equalizer 1.2s ease infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        equalizer: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':      { transform: 'scaleY(1)' },
        },
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}
export default config
