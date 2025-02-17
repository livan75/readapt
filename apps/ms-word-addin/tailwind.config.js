/* eslint-env node */
const daisy = require('daisyui')
const daisyThemeLight = require('daisyui/src/colors/themes')['[data-theme=light]']

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.vue'],
  plugins: [daisy],
  daisyui: {
    themes: [
      {
        light: {
          ...daisyThemeLight,
          primary: '#4B8AE7',
          secondary: '#6C757D',
          accent: '#80669D',
          'accent-content': '#FFFFFF',
          warning: '#DC3545',
          'warning-content': '#FFFFFF',
          '--btn-text-case': 'none'
        }
      }
    ],
    logs: false
  },
  theme: {
    screens: {
      xs: '250px',
      tall: { raw: '(min-height: 600px)' }
    }
  }
}
