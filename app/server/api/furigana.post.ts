import { convertToFuriganaHtml } from '../utils/kuroshiro'

const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/
const RUBY_RE = /<ruby[\s>]/i

const normalizeTexts = (body: unknown) => {
  if (!body || typeof body !== 'object') return []

  const record = body as { text?: unknown, texts?: unknown }
  if (Array.isArray(record.texts)) {
    return record.texts.filter((value): value is string => typeof value === 'string')
  }

  if (typeof record.text === 'string') {
    return [record.text]
  }

  return []
}

export default defineEventHandler(async (event) => {
  const texts = normalizeTexts(await readBody(event))

  if (texts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must include `text` or `texts`.'
    })
  }

  const results = await Promise.all(texts.map(async (raw) => {
    const text = raw.trim()
    if (!text || !KANJI_RE.test(text) || RUBY_RE.test(text)) {
      return text
    }

    return convertToFuriganaHtml(text)
  }))

  if (texts.length === 1) {
    return { html: results[0] }
  }

  return { html: results }
})
