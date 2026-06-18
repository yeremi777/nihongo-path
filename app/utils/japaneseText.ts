const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/

export const hasJapaneseKanji = (value: string) => KANJI_RE.test(value)

export const hasRubyMarkup = (value: string) =>
  value.includes('<ruby>') || value.includes('&lt;ruby&gt;')

export const decodePracticeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('&lt;ruby&gt;', '<ruby>')
    .replaceAll('&lt;/ruby&gt;', '</ruby>')
    .replaceAll('&lt;rt&gt;', '<rt>')
    .replaceAll('&lt;/rt&gt;', '</rt>')
    .replaceAll('&lt;rp&gt;', '<rp>')
    .replaceAll('&lt;/rp&gt;', '</rp>')

export const stripHtmlTags = (value: string) =>
  value.replace(/<[^>]+>/g, '')
