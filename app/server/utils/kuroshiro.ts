import { createRequire } from 'node:module'
import { dirname } from 'node:path'

const require = createRequire(import.meta.url)
const kuromojiDictPath = dirname(require.resolve('kuromoji/dict/base.dat.gz'))

type KuroshiroInstance = {
  init: (analyzer: unknown) => Promise<void>
  convert: (text: string, options: { mode: string, to: string }) => Promise<string>
}

let kuroshiroPromise: Promise<KuroshiroInstance> | null = null

const resolveDefault = <T>(moduleValue: T): T => {
  const value = moduleValue as { default?: T }
  if (value && typeof value === 'object' && 'default' in value && value.default) {
    return resolveDefault(value.default)
  }
  return moduleValue
}

export const getKuroshiro = async () => {
  if (!kuroshiroPromise) {
    kuroshiroPromise = (async () => {
      const Kuroshiro = resolveDefault(require('kuroshiro'))
      const KuromojiAnalyzer = resolveDefault(require('kuroshiro-analyzer-kuromoji'))

      const kuroshiro = new Kuroshiro() as KuroshiroInstance
      await kuroshiro.init(new KuromojiAnalyzer({ dictPath: kuromojiDictPath }))
      return kuroshiro
    })()
  }

  return kuroshiroPromise
}

export const convertToFuriganaHtml = async (text: string) => {
  const kuroshiro = await getKuroshiro()
  const converted = await kuroshiro.convert(text, {
    mode: 'furigana',
    to: 'hiragana'
  })

  return converted.replace(/<rp>[^<]*<\/rp>/g, '')
}
