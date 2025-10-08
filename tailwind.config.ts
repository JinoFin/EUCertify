import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './templates/**/*.{html,css}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#003399',
          foreground: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['"Inter var"', ...defaultTheme.fontFamily.sans],
        serif: ['"Source Serif Pro"', ...defaultTheme.fontFamily.serif]
      }
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(({ addUtilities }) => {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#003399 transparent'
        }
      });
    })
  ]
};

export default config;
