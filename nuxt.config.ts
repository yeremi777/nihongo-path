import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const kuromojiDictSource = resolve(dirname(require.resolve('kuromoji')), '../dict')

const collectContentRoutes = (dir: string, prefix = ''): string[] => {
  if (!existsSync(dir)) return []

  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry)
    const routePart = entry.replace(/\.md$/, '')

    if (statSync(fullPath).isDirectory()) {
      return collectContentRoutes(fullPath, `${prefix}/${entry}`)
    }

    if (!entry.endsWith('.md')) return []

    const route = routePart === 'index'
      ? prefix || '/'
      : `${prefix}/${routePart}`

    return route === '/' ? ['/learn'] : [`/learn${route}`]
  })
}

const contentRoutes = collectContentRoutes(resolve('content/learn'))

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
    '@nuxtjs/color-mode',
    '@vite-pwa/nuxt'
  ],

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: contentRoutes
    },

    hooks: {
      compiled(nitro) {
        const publicDir = nitro.options.output.publicDir
        for (const name of ['favicon.ico', 'favicon.png', 'offline.html']) {
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

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Nihongo Path',
      short_name: 'Nihongo',
      description: 'A structured JLPT learning path from N5 foundation to N3 intermediate study.',
      theme_color: '#b91c1c',
      background_color: '#faf7f2',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/favicon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon.ico',
          sizes: '48x48',
          type: 'image/x-icon'
        }
      ]
    },
    workbox: {
      navigateFallback: '/offline',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: [
        '**/*.{js,css,html,json,ico,png,svg,webp,woff,woff2,txt}'
      ],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/furigana(?:\/.*)?$/,
          handler: 'NetworkOnly',
          options: {
            cacheName: 'furigana-network-only'
          }
        },
        {
          urlPattern: /^\/_nuxt\/.*$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'nuxt-assets',
            expiration: {
              maxEntries: 120,
              maxAgeSeconds: 60 * 60 * 24 * 30
            }
          }
        },
        {
          urlPattern: /^\/(?:api\/_content|_payload|search-data|__nuxt_content)\//,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'content-payloads',
            expiration: {
              maxEntries: 240,
              maxAgeSeconds: 60 * 60 * 24 * 7
            }
          }
        }
      ]
    },
    client: {
      installPrompt: false
    },
    devOptions: {
      enabled: false
    }
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
          name: 'theme-color',
          content: '#b91c1c'
        },
        {
          name: 'description',
          content: 'A structured JLPT learning path from N5 foundation to N3 intermediate study.'
        }
      ]
    }
  },

  compatibilityDate: '2026-06-16'
})
