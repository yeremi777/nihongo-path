import { cpSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const kuromojiDictSource = resolve(dirname(require.resolve('kuromoji')), '../dict')

export default defineNuxtConfig({
  srcDir: 'app',

  // Avoids a Vite dev pre-transform race where `#app-manifest` is resolved
  // before Nitro writes `.nuxt/manifest/meta/dev.json`.
  experimental: {
    appManifest: false
  },

  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode'
  ],

  nitro: {
    hooks: {
      compiled(nitro) {
        cpSync(kuromojiDictSource, join(nitro.options.output.serverDir, 'node_modules/kuromoji/dict'), {
          recursive: true
        })
      }
    }
  },

  css: [
    '@fontsource-variable/plus-jakarta-sans',
    '~/assets/css/main.css'
  ],

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: ''
  },

  app: {
    head: {
      titleTemplate: '%s · Nihongo Path',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        {
          name: 'description',
          content: 'A structured JLPT learning path from N5 foundation to N3 intermediate study.'
        }
      ]
    }
  },

  compatibilityDate: '2026-06-16'
})
