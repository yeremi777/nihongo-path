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
    externals: {
      traceInclude: [
        'kuromoji/dict/base.dat.gz',
        'kuromoji/dict/cc.dat.gz',
        'kuromoji/dict/check.dat.gz',
        'kuromoji/dict/tid.dat.gz',
        'kuromoji/dict/tid_map.dat.gz',
        'kuromoji/dict/tid_pos.dat.gz',
        'kuromoji/dict/unk.dat.gz',
        'kuromoji/dict/unk_char.dat.gz',
        'kuromoji/dict/unk_compat.dat.gz',
        'kuromoji/dict/unk_invoke.dat.gz',
        'kuromoji/dict/unk_map.dat.gz',
        'kuromoji/dict/unk_pos.dat.gz'
      ]
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
