export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './content/**/*.md',
    './app/app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        japanese: ['"Noto Sans JP"', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'sans-serif']
      },
      boxShadow: {
        soft: '0 16px 40px rgba(31, 41, 51, 0.08)'
      }
    }
  }
}
