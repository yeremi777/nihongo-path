import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

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
        const publicDir = nitro.options.output.publicDir
        for (const name of ['favicon.ico', 'favicon.png']) {
          const src = resolve('public/' + name)
          if (existsSync(src)) cpSync(src, join(publicDir, name))
        }

        cpSync(kuromojiDictSource, join(nitro.options.output.serverDir, 'node_modules/kuromoji/dict'), {
          recursive: true
        })

        const serverDir = resolve(nitro.options.output.serverDir)
        const fallbackFunctionDir = resolve(nitro.options.output.dir, 'functions/__fallback.func')
        const fallbackRelativeToServer = relative(serverDir, fallbackFunctionDir)
        const fallbackIsInsideServer =
          fallbackRelativeToServer === '' ||
          (!fallbackRelativeToServer.startsWith('..') && !isAbsolute(fallbackRelativeToServer))

        if (!fallbackIsInsideServer) {
          rmSync(fallbackFunctionDir, { recursive: true, force: true })
          mkdirSync(dirname(fallbackFunctionDir), { recursive: true })
          cpSync(serverDir, fallbackFunctionDir, {
            recursive: true
          })

          writeFileSync(
            join(fallbackFunctionDir, '.vc-config.json'),
            JSON.stringify({
              runtime: 'nodejs20.x',
              handler: 'index.mjs',
              launcherType: 'Nodejs',
              shouldAddHelpers: false,
              supportsResponseStreaming: true
            }, null, 2)
          )

          writeFileSync(
            join(nitro.options.output.dir, 'config.json'),
            JSON.stringify({
              version: 3,
              routes: [
                { handle: 'filesystem' },
                { src: '/(.*)', dest: '/__fallback' }
              ]
            }, null, 2)
          )
        }
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
      link: [
        { rel: 'icon', href: '/favicon.ico' }
      ],
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
