import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LEVEL_PROFILES,
  ROOT,
  auditLessonCollection,
  auditLessonMetadata,
  auditPlaceholderLanguage,
  auditReferenceSection,
  collectLessonFiles,
  createIssueCollector,
  printAuditReport,
  rel,
  section,
} from './lesson-audit-shared.mjs'

const KANJI_DIRS = [
  path.join(ROOT, 'content/learn/n3/kanji'),
  path.join(ROOT, 'content/learn/n4/kanji'),
  path.join(ROOT, 'content/learn/n5/kanji'),
]

const RINCIAN_HINT = 'Klik setiap kartu untuk membuka atau menutup catatan singkat tiap kanji.'
const MINI_PRACTICE_RE = /::MiniPractice\n---\n[\s\S]*?\n---\n::/g
const EXAMPLE_CARD_RE = /<div>\s*<p class="jp">[\s\S]*?<\/p>\s*<p>[\s\S]*?<\/p>\s*<\/div>/g

const REQUIRED_SECTIONS = [
  'Tujuan',
  'Daftar Kanji',
  'Rincian Kanji',
  'Peta Kata',
  'Catatan Pemakaian',
  'Contoh Kalimat',
  'Hal yang Mudah Tertukar',
  'Kesalahan Umum',
  'Mini Practice',
  'Referensi',
]

const collectKanjiLessonFiles = () => KANJI_DIRS.flatMap(collectLessonFiles).sort()

const auditKanjiFile = (file, text) => {
  const { errors, warnings, error, warn } = createIssueCollector(file)
  const lessonMeta = auditLessonMetadata(file, text, error, warn, 'kanji')

  for (const heading of REQUIRED_SECTIONS) {
    if (!new RegExp(`^## ${heading}$`, 'm').test(text)) {
      error(`missing required section ## ${heading}`)
    }
  }

  if (!text.includes('class="lesson-callout"')) {
    error('missing <div class="lesson-callout"> after ## Tujuan')
  }

  const rincianSection = section(text, 'Rincian Kanji')
  if (!rincianSection.includes(RINCIAN_HINT)) {
    error('## Rincian Kanji is missing the learner hint before kanji cards')
  }

  const gridMatches = text.match(/<div class="kanji-card-grid">[\s\S]*?<\/div>/g) ?? []
  if (gridMatches.length !== 1) {
    error(`expected exactly 1 kanji-card-grid wrapper, found ${gridMatches.length}`)
  }

  const allCards = text.match(/<details class="kanji-card"[^>]*>[\s\S]*?<\/details>/g) ?? []
  if (allCards.length === 0) {
    error('expected at least 1 kanji-card')
  }

  const gridCards = (gridMatches[0] ?? '').match(/<details class="kanji-card"/g) ?? []
  if (gridCards.length !== allCards.length) {
    error('every kanji-card must live inside the single kanji-card-grid wrapper')
  }

  const profile = lessonMeta ? LEVEL_PROFILES[lessonMeta.level] : null
  if (profile && allCards.length > profile.maxKanjiCards) {
    warn(`${lessonMeta.level} kanji lesson has ${allCards.length} kanji-card(s); profile target is ${profile.maxKanjiCards} or fewer`)
  }

  for (const [index, card] of allCards.entries()) {
    const cardLabel = `kanji-card ${index + 1}`

    if (!card.includes('class="kanji-char"')) {
      error(`${cardLabel} is missing .kanji-char`)
    }
    if (!card.includes('class="kanji-meta"')) {
      error(`${cardLabel} is missing .kanji-meta`)
    }
    if (!card.includes('class="kanji-reading"')) {
      error(`${cardLabel} is missing .kanji-reading`)
    }

    const cardListItems = card.match(/<li>[\s\S]*?<\/li>/g) ?? []
    for (const [itemIndex, item] of cardListItems.entries()) {
      if (!item.includes('class="ruby-word"')) {
        error(`${cardLabel} list item ${itemIndex + 1} must use ruby-word with <ruby><rt>`)
      }
      if (!item.includes(' - ')) {
        error(`${cardLabel} list item ${itemIndex + 1} is missing an Indonesian gloss after the example word`)
      }
    }

    const cardParagraph = card.match(/<p>([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? ''
    if (cardParagraph.length < 45) {
      error(`${cardLabel} explanation is too short; add context like when/where the kanji appears`)
    }
  }

  const contohSection = section(text, 'Contoh Kalimat')
  if (!contohSection.includes('class="example-list"')) {
    error('## Contoh Kalimat must use <div class="example-list">')
  }
  if (/^\d+\.\s/m.test(contohSection.trim())) {
    error('## Contoh Kalimat must not use numbered Markdown lists; use example-list cards')
  }

  const exampleCards = contohSection.match(EXAMPLE_CARD_RE) ?? []
  if (exampleCards.length < 3 || exampleCards.length > 5) {
    error(`## Contoh Kalimat should have 3-5 JP + Indonesian example cards, found ${exampleCards.length}`)
  }

  for (const [index, card] of exampleCards.entries()) {
    if (!/<p class="jp">[\s\S]*?<\/p>/.test(card)) {
      error(`Contoh Kalimat example ${index + 1} is missing <p class="jp">`)
    }
    if (!/<p>(?!<\/p>)[\s\S]*<\/p>/.test(card.replace(/<p class="jp">[\s\S]*?<\/p>/, ''))) {
      error(`Contoh Kalimat example ${index + 1} is missing Indonesian translation <p>`)
    }
    if (card.includes('<ruby>') || card.includes('class="ruby-word"')) {
      error(`Contoh Kalimat example ${index + 1} must not use furigana; use plain Japanese`)
    }
  }

  const miniSection = section(text, 'Mini Practice')
  if (miniSection.includes('<ruby>') || miniSection.includes('class="ruby-word"')) {
    error('## Mini Practice must use plain Japanese without <ruby> or ruby-word')
  }

  const miniBlocks = text.match(MINI_PRACTICE_RE) ?? []
  if (miniBlocks.length !== 5) {
    error(`expected exactly 5 MiniPractice blocks, found ${miniBlocks.length}`)
  }

  for (const [index, block] of miniBlocks.entries()) {
    const optionA = /^optionA: "([^"]*)"$/m.exec(block)?.[1]
    const optionB = /^optionB: "([^"]*)"$/m.exec(block)?.[1]
    const correct = /^correct: "([^"]*)"$/m.exec(block)?.[1]
    const question = /^question: "([^"]*)"$/m.exec(block)?.[1]

    if (!question || !optionA || !optionB || !correct) {
      error(`MiniPractice ${index + 1} is missing question, optionA, optionB, or correct`)
      continue
    }

    if (correct !== optionA && correct !== optionB) {
      error(`MiniPractice ${index + 1} correct value does not match optionA/optionB exactly`)
    }
  }

  if (text.includes('## Lanjut Berikutnya')) {
    error('must not include ## Lanjut Berikutnya; navigation belongs in the page layout')
  }

  auditPlaceholderLanguage(text, error)
  auditReferenceSection(text, lessonMeta, error, 'kanji')

  if (lessonMeta?.level === 'N3') {
    const contextSignals = ['papan', 'formulir', 'メール', '記事', '広告', '職場', '注文', '健康', '駅', '案内']
    if (!contextSignals.some((signal) => text.includes(signal))) {
      warn('N3 kanji should usually connect cards/examples to real-world reading contexts')
    }
  }

  return { errors, warnings }
}

export function runKanjiAudit() {
  const lessonFiles = collectKanjiLessonFiles()
  const issues = []
  const warnings = []

  auditLessonCollection(
    lessonFiles,
    (message) => issues.push(message),
    (message) => warnings.push(message),
    'kanji',
  )

  for (const file of lessonFiles) {
    const result = auditKanjiFile(file, fs.readFileSync(file, 'utf8'))
    issues.push(...result.errors)
    warnings.push(...result.warnings)
  }

  return { lessonFiles, issues, warnings }
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  printAuditReport({
    name: 'Kanji',
    ...runKanjiAudit(),
  })
}
