import fs from 'node:fs'
import path from 'node:path'

export const ROOT = process.cwd()

export const MINI_PRACTICE_RE = /::MiniPractice\n---\n[\s\S]*?\n---\n::/g
export const EXAMPLE_CARD_RE = /<div>\s*<p class="jp">[\s\S]*?<\/p>\s*<p>[\s\S]*?<\/p>\s*<\/div>/g

export const rel = (file) => path.relative(ROOT, file)

export const section = (text, heading) => {
  const withNext = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## )`, 'm').exec(text)
  if (withNext) return withNext[1]

  const last = new RegExp(`^## ${heading}\\n([\\s\\S]*)$`, 'm').exec(text)
  return last?.[1] ?? ''
}

export const collectLessonFiles = (dir) => {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((file) => /^week-\d+-day-\d+\.md$/.test(file))
    .map((file) => path.join(dir, file))
    .sort()
}

// Furigana policy: runtime-only for vocab/grammar ## Contoh Kalimat and ## Mini Practice.
// Markdown should stay plain Japanese; auditFuriganaQuality flags bad manual <ruby> when present.
// (e.g. 今 + 夜/よる instead of 今夜/こんや).
const UNSAFE_SPLIT_RUBY_PATTERNS = [
  /今<ruby>夜<rt>よる<\/rt><\/ruby>/,
  /毎<ruby>朝<rt>あさ<\/rt><\/ruby>/,
  /小<ruby>学校<rt>がっこう<\/rt><\/ruby>/,
  /四<ruby>人<rt>ひと<\/rt><\/ruby>/,
  /携帯<ruby>電話<rt>でんわ<\/rt><\/ruby>/,
  /仕<ruby>上がる<rt>あがる<\/rt><\/ruby>/,
  /仕<ruby>上<rt>[^<]+<\/rt><\/ruby>/,
]

export const auditFuriganaQuality = (text, push) => {
  if (!text.includes('<ruby>')) return

  for (const pattern of UNSAFE_SPLIT_RUBY_PATTERNS) {
    if (pattern.test(text)) {
      push('unsafe split furigana: tag the whole kanji compound, not part of a compound')
      return
    }
  }
}

// Vocabulary and grammar lessons use runtime furigana; markdown stays plain Japanese.
export const auditNoMarkdownFurigana = (text, push, sectionNames = ['Contoh Kalimat', 'Mini Practice']) => {
  for (const heading of sectionNames) {
    const block = section(text, heading)
    if (!block) continue

    if (block.includes('<ruby>') || block.includes('class="ruby-word"')) {
      push(`## ${heading} must use plain Japanese without <ruby> or ruby-word (runtime furigana is used instead)`)
    }
  }
}

export const fieldValue = (block, key) => {
  const match = new RegExp(`^${key}: "((?:\\\\.|[^"\\\\])*)"`, 'm').exec(block)
  return match?.[1]?.replace(/\\"/g, '"') ?? ''
}

export const auditContohKalimat = (contohSection, push) => {
  if (!contohSection.includes('class="example-list"')) {
    push('## Contoh Kalimat must use <div class="example-list">')
  }
  if (/^\d+\.\s/m.test(contohSection.trim())) {
    push('## Contoh Kalimat must not use numbered Markdown lists; use example-list cards')
  }

  const exampleCards = contohSection.match(EXAMPLE_CARD_RE) ?? []
  if (exampleCards.length < 4 || exampleCards.length > 6) {
    push(`## Contoh Kalimat should have 4-6 JP + Indonesian example cards, found ${exampleCards.length}`)
  }

  for (const [index, card] of exampleCards.entries()) {
    const jpMatch = /<p class="jp">([\s\S]*?)<\/p>/.exec(card)
    if (!jpMatch) {
      push(`Contoh Kalimat example ${index + 1} is missing <p class="jp">`)
      continue
    }
    if (!/<p>(?!<\/p>)[\s\S]*<\/p>/.test(card.replace(/<p class="jp">[\s\S]*?<\/p>/, ''))) {
      push(`Contoh Kalimat example ${index + 1} is missing Indonesian translation <p>`)
    }
  }
}

export const auditMiniPractice = (text, push) => {
  const miniBlocks = text.match(MINI_PRACTICE_RE) ?? []
  if (miniBlocks.length !== 5) {
    push(`expected exactly 5 MiniPractice blocks, found ${miniBlocks.length}`)
  }

  for (const [index, block] of miniBlocks.entries()) {
    const question = fieldValue(block, 'question')
    const optionA = fieldValue(block, 'optionA')
    const optionB = fieldValue(block, 'optionB')
    const correct = fieldValue(block, 'correct')

    if (!question || !optionA || !optionB || !correct) {
      push(`MiniPractice ${index + 1} is missing question, optionA, optionB, or correct`)
      continue
    }

    if (correct !== optionA && correct !== optionB) {
      push(`MiniPractice ${index + 1} correct value does not match optionA/optionB exactly`)
    }
  }
}

export const auditCommonLessonShell = (text, push, { requiredSections, wordStripSection }) => {
  if (!text.includes('class="lesson-callout"')) {
    push('missing <div class="lesson-callout"> after ## Tujuan')
  }

  for (const heading of requiredSections) {
    if (!new RegExp(`^## ${heading}$`, 'm').test(text)) {
      push(`missing required section ## ${heading}`)
    }
  }

  const stripSection = section(text, wordStripSection)
  if (!stripSection.includes('class="word-strip"')) {
    push(`## ${wordStripSection} must include <div class="word-strip">`)
  }

  if (text.includes('## Lanjut Berikutnya')) {
    push('must not include ## Lanjut Berikutnya; navigation belongs in the page layout')
  }
}
