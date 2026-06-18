import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.cwd()
const KANJI_DIRS = [
  path.join(ROOT, 'content/learn/n3/kanji'),
  path.join(ROOT, 'content/learn/n4/kanji'),
  path.join(ROOT, 'content/learn/n5/kanji'),
]

const RINCIAN_HINT = 'Klik setiap kartu untuk membuka atau menutup catatan singkat tiap kanji.'
const MINI_PRACTICE_RE = /::MiniPractice\n---\n[\s\S]*?\n---\n::/g
const EXAMPLE_CARD_RE = /<div>\s*<p class="jp">[\s\S]*?<\/p>\s*<p>[\s\S]*?<\/p>\s*<\/div>/g

const rel = (file) => path.relative(ROOT, file)

const section = (text, heading) => {
  const withNext = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## )`, 'm').exec(text)
  if (withNext) return withNext[1]

  const last = new RegExp(`^## ${heading}\\n([\\s\\S]*)$`, 'm').exec(text)
  return last?.[1] ?? ''
}

const collectKanjiLessonFiles = () => KANJI_DIRS.flatMap((dir) => {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((file) => /^week-\d+-day-\d+\.md$/.test(file))
    .map((file) => path.join(dir, file))
}).sort()

const auditKanjiFile = (file, text) => {
  const issues = []
  const label = rel(file)
  const push = (message) => issues.push(`${label}: ${message}`)

  if (!text.includes('class="lesson-callout"')) {
    push('missing <div class="lesson-callout"> after ## Tujuan')
  }

  const rincianSection = section(text, 'Rincian Kanji')
  if (!rincianSection.includes(RINCIAN_HINT)) {
    push('## Rincian Kanji is missing the learner hint before kanji cards')
  }

  const gridMatches = text.match(/<div class="kanji-card-grid">[\s\S]*?<\/div>/g) ?? []
  if (gridMatches.length !== 1) {
    push(`expected exactly 1 kanji-card-grid wrapper, found ${gridMatches.length}`)
  }

  const allCards = text.match(/<details class="kanji-card"[^>]*>[\s\S]*?<\/details>/g) ?? []
  if (allCards.length === 0) {
    push('expected at least 1 kanji-card')
  }

  const gridCards = (gridMatches[0] ?? '').match(/<details class="kanji-card"/g) ?? []
  if (gridCards.length !== allCards.length) {
    push('every kanji-card must live inside the single kanji-card-grid wrapper')
  }

  for (const [index, card] of allCards.entries()) {
    const cardLabel = `kanji-card ${index + 1}`

    if (!card.includes('class="kanji-char"')) {
      push(`${cardLabel} is missing .kanji-char`)
    }
    if (!card.includes('class="kanji-meta"')) {
      push(`${cardLabel} is missing .kanji-meta`)
    }
    if (!card.includes('class="kanji-reading"')) {
      push(`${cardLabel} is missing .kanji-reading`)
    }
  }

  const contohSection = section(text, 'Contoh Kalimat')
  if (!contohSection.includes('class="example-list"')) {
    push('## Contoh Kalimat must use <div class="example-list">')
  }
  if (/^\d+\.\s/m.test(contohSection.trim())) {
    push('## Contoh Kalimat must not use numbered Markdown lists; use example-list cards')
  }

  const exampleCards = contohSection.match(EXAMPLE_CARD_RE) ?? []
  if (exampleCards.length < 3 || exampleCards.length > 5) {
    push(`## Contoh Kalimat should have 3-5 JP + Indonesian example cards, found ${exampleCards.length}`)
  }

  for (const [index, card] of exampleCards.entries()) {
    if (!/<p class="jp">[\s\S]*?<\/p>/.test(card)) {
      push(`Contoh Kalimat example ${index + 1} is missing <p class="jp">`)
    }
    if (!/<p>(?!<\/p>)[\s\S]*<\/p>/.test(card.replace(/<p class="jp">[\s\S]*?<\/p>/, ''))) {
      push(`Contoh Kalimat example ${index + 1} is missing Indonesian translation <p>`)
    }
    if (card.includes('<ruby>') || card.includes('class="ruby-word"')) {
      push(`Contoh Kalimat example ${index + 1} must not use furigana; use plain Japanese`)
    }
  }

  const miniSection = section(text, 'Mini Practice')
  if (miniSection.includes('<ruby>') || miniSection.includes('class="ruby-word"')) {
    push('## Mini Practice must use plain Japanese without <ruby> or ruby-word')
  }

  const miniBlocks = text.match(MINI_PRACTICE_RE) ?? []
  if (miniBlocks.length !== 5) {
    push(`expected exactly 5 MiniPractice blocks, found ${miniBlocks.length}`)
  }

  for (const [index, block] of miniBlocks.entries()) {
    const optionA = /^optionA: "([^"]*)"$/m.exec(block)?.[1]
    const optionB = /^optionB: "([^"]*)"$/m.exec(block)?.[1]
    const correct = /^correct: "([^"]*)"$/m.exec(block)?.[1]
    const question = /^question: "([^"]*)"$/m.exec(block)?.[1]

    if (!question || !optionA || !optionB || !correct) {
      push(`MiniPractice ${index + 1} is missing question, optionA, optionB, or correct`)
      continue
    }

    if (correct !== optionA && correct !== optionB) {
      push(`MiniPractice ${index + 1} correct value does not match optionA/optionB exactly`)
    }
  }

  if (text.includes('## Lanjut Berikutnya')) {
    push('must not include ## Lanjut Berikutnya; navigation belongs in the page layout')
  }

  return issues
}

export function runKanjiAudit() {
  const lessonFiles = collectKanjiLessonFiles()
  const issues = lessonFiles.flatMap((file) => auditKanjiFile(file, fs.readFileSync(file, 'utf8')))

  return { lessonFiles, issues }
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const { lessonFiles, issues } = runKanjiAudit()

  if (issues.length) {
    console.error(`Kanji markdown audit failed with ${issues.length} issue(s):`)
    for (const issue of issues) console.error(`- ${issue}`)
    process.exit(1)
  }

  console.log(`Kanji markdown audit passed for ${lessonFiles.length} N3/N4/N5 kanji lessons.`)
}
