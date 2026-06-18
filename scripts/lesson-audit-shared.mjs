import fs from 'node:fs'
import path from 'node:path'

export const ROOT = process.cwd()

export const MINI_PRACTICE_RE = /::MiniPractice\n---\n[\s\S]*?\n---\n::/g
export const EXAMPLE_CARD_RE = /<div>\s*<p class="jp">[\s\S]*?<\/p>\s*<p>[\s\S]*?<\/p>\s*<\/div>/g

export const rel = (file) => path.relative(ROOT, file)

export const LEVEL_ORDER = ['N5', 'N4', 'N3']

export const LEVEL_PROFILES = {
  N5: {
    label: 'some basic Japanese',
    maxExampleJapaneseChars: 60,
    maxKanjiCards: 16,
    contexts: ['daily life', 'classroom', 'self', 'family', 'food', 'time', 'place'],
  },
  N4: {
    label: 'basic Japanese',
    maxExampleJapaneseChars: 90,
    maxKanjiCards: 12,
    contexts: ['familiar daily topics', 'travel', 'health', 'school', 'work basics', 'requests'],
  },
  N3: {
    label: 'everyday Japanese to a certain degree',
    maxExampleJapaneseChars: 130,
    maxKanjiCards: 10,
    contexts: ['notices', 'forms', 'email', 'workplace', 'headlines', 'specific everyday texts'],
  },
}

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

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/
const LESSON_PATH_RE = /content\/learn\/(n[345])\/([^/]+)\/week-(\d+)-day-(\d+)\.md$/

export const parseFrontmatter = (text) => {
  const match = FRONTMATTER_RE.exec(text)
  if (!match) return {}

  const frontmatter = {}
  for (const line of match[1].split('\n')) {
    const entry = /^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/.exec(line)
    if (!entry) continue

    const [, key, rawValue] = entry
    const trimmed = rawValue.trim()
    if (/^-?\d+$/.test(trimmed)) {
      frontmatter[key] = Number(trimmed)
    } else if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      frontmatter[key] = trimmed.slice(1, -1)
    } else if (trimmed === 'true' || trimmed === 'false') {
      frontmatter[key] = trimmed === 'true'
    } else if (trimmed) {
      frontmatter[key] = trimmed
    }
  }

  return frontmatter
}

export const lessonPathMeta = (file) => {
  const normalized = rel(file).split(path.sep).join('/')
  const match = LESSON_PATH_RE.exec(normalized)
  if (!match) return null

  return {
    level: match[1].toUpperCase(),
    section: match[2],
    week: Number(match[3]),
    day: Number(match[4]),
    slot: `${match[1].toUpperCase()} ${match[2]} week ${match[3]} day ${match[4]}`,
  }
}

export const createIssueCollector = (file) => {
  const errors = []
  const warnings = []
  const label = rel(file)

  return {
    errors,
    warnings,
    error: (message) => errors.push(`${label}: ${message}`),
    warn: (message) => warnings.push(`${label}: ${message}`),
  }
}

export const groupFilesByLevel = (lessonFiles) => {
  const counts = Object.fromEntries(LEVEL_ORDER.map((level) => [level, 0]))

  for (const file of lessonFiles) {
    const level = lessonPathMeta(file)?.level
    if (level) counts[level] = (counts[level] ?? 0) + 1
  }

  return counts
}

export const printAuditReport = ({ name, lessonFiles, issues, warnings }) => {
  if (issues.length) {
    console.error(`${name} markdown audit failed with ${issues.length} error(s):`)
    for (const issue of issues) console.error(`- ERROR ${issue}`)

    if (warnings.length) {
      console.error(`\n${name} learning-flow warning(s):`)
      for (const warning of warnings) console.error(`- WARN ${warning}`)
    }

    process.exit(1)
  }

  const counts = groupFilesByLevel(lessonFiles)
  console.log(`${name} markdown audit passed for ${lessonFiles.length} lesson file(s).`)
  for (const level of LEVEL_ORDER) {
    console.log(`- ${level}: ${counts[level] ?? 0} file(s)`)
  }

  if (warnings.length) {
    console.warn(`\n${name} learning-flow warning(s), review recommended:`)
    for (const warning of warnings) console.warn(`- WARN ${warning}`)
  }
}

export const auditLessonMetadata = (file, text, push, warn, expectedSection) => {
  const meta = lessonPathMeta(file)
  if (!meta) {
    push('file path must match content/learn/<n5|n4|n3>/<section>/week-X-day-Y.md')
    return null
  }

  if (meta.section !== expectedSection) {
    push(`path section must be ${expectedSection}, found ${meta.section}`)
  }

  const frontmatter = parseFrontmatter(text)
  const requiredFields = ['title', 'description', 'level', 'category', 'topic', 'topicLabel', 'week', 'day', 'status']
  for (const field of requiredFields) {
    if (frontmatter[field] === undefined || frontmatter[field] === '') {
      push(`frontmatter is missing required field "${field}"`)
    }
  }

  if (frontmatter.level && frontmatter.level !== meta.level) {
    push(`frontmatter level "${frontmatter.level}" does not match path level "${meta.level}"`)
  }

  if (frontmatter.category && frontmatter.category !== expectedSection) {
    push(`frontmatter category "${frontmatter.category}" does not match "${expectedSection}"`)
  }

  if (frontmatter.week !== undefined && frontmatter.week !== meta.week) {
    push(`frontmatter week ${frontmatter.week} does not match path week ${meta.week}`)
  }

  if (frontmatter.day !== undefined && frontmatter.day !== meta.day) {
    push(`frontmatter day ${frontmatter.day} does not match path day ${meta.day}`)
  }

  if (frontmatter.status === 'placeholder') {
    push('lesson file must not use status: "placeholder"')
  }

  if (typeof frontmatter.topic === 'string' && frontmatter.topic.trim().length < 2) {
    warn('topic is very short; lesson cards may not communicate the lesson focus')
  }

  if (typeof frontmatter.topicLabel === 'string' && frontmatter.topicLabel.trim().length < 6) {
    warn('topicLabel is very short; review whether it explains the learner-facing meaning')
  }

  return { ...meta, frontmatter }
}

export const auditLessonCollection = (lessonFiles, push, warn, sectionName) => {
  const seenSlots = new Map()
  const groups = new Map()

  for (const file of lessonFiles) {
    const meta = lessonPathMeta(file)
    if (!meta) continue

    const slot = `${meta.level}:${meta.section}:${meta.week}:${meta.day}`
    const previous = seenSlots.get(slot)
    if (previous) {
      push(`${rel(file)}: duplicate ${meta.slot}; already used by ${rel(previous)}`)
    } else {
      seenSlots.set(slot, file)
    }

    const groupKey = `${meta.level}:${meta.section}:${meta.week}`
    if (!groups.has(groupKey)) groups.set(groupKey, [])
    groups.get(groupKey).push(meta.day)
  }

  for (const [groupKey, days] of groups) {
    const sortedDays = [...new Set(days)].sort((a, b) => a - b)
    const expected = Array.from({ length: sortedDays.at(-1) ?? 0 }, (_, index) => index + 1)
    const missing = expected.filter((day) => !sortedDays.includes(day))
    if (missing.length) {
      warn(`${groupKey.replaceAll(':', ' ')} has missing day slot(s): ${missing.join(', ')}`)
    }
  }

  const counts = groupFilesByLevel(lessonFiles)
  for (const level of LEVEL_ORDER) {
    if ((counts[level] ?? 0) === 0) {
      warn(`${level} has no ${sectionName} lesson files`)
    }
  }
}

export const extractJapaneseExampleSentences = (text) => {
  const examples = []
  const matches = text.matchAll(/<p class="jp">([\s\S]*?)<\/p>/g)
  for (const match of matches) {
    examples.push(match[1].replace(/<[^>]+>/g, '').trim())
  }
  return examples
}

export const japaneseCharCount = (value) => {
  const matches = value.match(/[\u3040-\u30ff\u3400-\u9fff]/g)
  return matches?.length ?? 0
}

export const auditLevelExampleLength = (text, lessonMeta, warn) => {
  if (!lessonMeta) return

  const profile = LEVEL_PROFILES[lessonMeta.level]
  if (!profile) return

  const examples = extractJapaneseExampleSentences(section(text, 'Contoh Kalimat'))
  for (const [index, sentence] of examples.entries()) {
    const count = japaneseCharCount(sentence)
    if (count > profile.maxExampleJapaneseChars) {
      warn(
        `Contoh Kalimat example ${index + 1} has ${count} Japanese characters; ${lessonMeta.level} profile expects about ${profile.maxExampleJapaneseChars} or fewer`,
      )
    }
  }
}

export const auditPlaceholderLanguage = (text, push) => {
  const placeholderPatterns = [
    /will be added later/i,
    /\bplaceholder\b/i,
    /planned topics/i,
    /pelajaran akan disusun/i,
  ]

  for (const pattern of placeholderPatterns) {
    if (pattern.test(text)) {
      push(`contains leftover placeholder/planning language matching ${pattern}`)
      return
    }
  }
}

const REFERENCE_TOPIC_CACHE = new Map()
const CURRICULUM_GRAMMAR_MNN_CACHE = new Map()

const normalizeReferenceText = (value) =>
  value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[・]/g, ' ')
    .trim()

const normalizeTopicText = (value) =>
  value
    .replace(/[。．.]+$/g, '')
    .replace(/\s+/g, '')
    .trim()

const referenceListPath = (level, sectionName) => {
  const levelKey = level.toLowerCase()
  return path.join(ROOT, 'public/references', levelKey, `${levelKey}_${sectionName}_list.md`)
}

const curriculumTocPath = (level) => {
  const levelKey = level.toLowerCase()
  return path.join(ROOT, 'public/references', levelKey, `${levelKey}_curriculum_toc.md`)
}

export const loadReferenceTopics = (level, sectionName) => {
  const cacheKey = `${level}:${sectionName}`
  if (REFERENCE_TOPIC_CACHE.has(cacheKey)) return REFERENCE_TOPIC_CACHE.get(cacheKey)

  const topics = new Map()
  const file = referenceListPath(level, sectionName)
  if (!fs.existsSync(file)) {
    REFERENCE_TOPIC_CACHE.set(cacheKey, topics)
    return topics
  }

  let currentWeek = null
  const text = fs.readFileSync(file, 'utf8')

  for (const line of text.split('\n')) {
    const weekMatch = /^##\s+Week\s+(\d+)\b/i.exec(line)
    if (weekMatch) {
      currentWeek = Number(weekMatch[1])
      continue
    }

    const dayHeadingMatch = /^###\s+Day\s+(\d+)\s+—\s+(.+)$/.exec(line)
    if (currentWeek && dayHeadingMatch) {
      const rawTopic = dayHeadingMatch[2].trim()
      const topic = /^Additional\b/i.test(rawTopic)
        ? rawTopic
        : rawTopic.replace(/\s+\(.+$/, '').trim()
      topics.set(`${currentWeek}:${Number(dayHeadingMatch[1])}`, topic)
    }
  }

  REFERENCE_TOPIC_CACHE.set(cacheKey, topics)
  return topics
}

const collectLessonNumbers = (value) => {
  const lessons = []
  const matches = value.matchAll(/L(\d+)(?:\s*-\s*L?(\d+))?/gi)

  for (const match of matches) {
    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : start

    if (!Number.isFinite(start) || !Number.isFinite(end)) continue

    if (end > start) {
      for (let lesson = start; lesson <= end; lesson += 1) lessons.push(lesson)
    } else {
      lessons.push(start)
    }
  }

  return lessons
}

const formatIndonesianList = (items) => {
  const uniqueItems = [...new Set(items)].sort((a, b) => a - b)

  if (uniqueItems.length === 0) return ''
  if (uniqueItems.length === 1) return String(uniqueItems[0])
  if (uniqueItems.length === 2) return `${uniqueItems[0]} dan ${uniqueItems[1]}`

  return `${uniqueItems.slice(0, -1).join(', ')}, dan ${uniqueItems.at(-1)}`
}

export const loadGrammarMnnLessons = (level) => {
  const cacheKey = level
  if (CURRICULUM_GRAMMAR_MNN_CACHE.has(cacheKey)) return CURRICULUM_GRAMMAR_MNN_CACHE.get(cacheKey)

  const lessonsBySlot = new Map()
  const file = curriculumTocPath(level)
  if (!fs.existsSync(file)) {
    CURRICULUM_GRAMMAR_MNN_CACHE.set(cacheKey, lessonsBySlot)
    return lessonsBySlot
  }

  let inGrammarSection = false
  let currentWeek = null
  const text = fs.readFileSync(file, 'utf8')

  for (const line of text.split('\n')) {
    if (/^##\s+文法\s+GRAMMAR\b/.test(line)) {
      inGrammarSection = true
      currentWeek = null
      continue
    }

    if (inGrammarSection && /^##\s+/.test(line) && !/^##\s+文法\s+GRAMMAR\b/.test(line)) {
      inGrammarSection = false
      currentWeek = null
      continue
    }

    if (!inGrammarSection) continue

    const weekMatch = /^###\s+Week\s+(\d+)\b/i.exec(line)
    if (weekMatch) {
      currentWeek = Number(weekMatch[1])
      continue
    }

    if (!currentWeek || !line.startsWith('|')) continue

    const cells = line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())

    if (cells.length < 9 || !/^g\d+$/i.test(cells[0]) || !/^\d+$/.test(cells[1])) continue

    const day = Number(cells[1])
    const mnnCell = cells.at(-1) ?? ''
    const lessonNumbers = collectLessonNumbers(mnnCell)
    if (!lessonNumbers.length) continue

    const slot = `${currentWeek}:${day}`
    lessonsBySlot.set(slot, [...(lessonsBySlot.get(slot) ?? []), ...lessonNumbers])
  }

  CURRICULUM_GRAMMAR_MNN_CACHE.set(cacheKey, lessonsBySlot)
  return lessonsBySlot
}

const sourceTitle = (sectionName) => sectionName[0].toUpperCase() + sectionName.slice(1)

const additionalTopicTitle = (referenceTopic, lessonMeta) => {
  const parenthetical = /\(([^)]+)\)\s*$/.exec(referenceTopic)?.[1]
  return parenthetical || lessonMeta.frontmatter?.topic || referenceTopic.replace(/^Additional\s+\w+\s*/i, '').trim()
}

const primaryReferenceLine = (lessonMeta, sectionName) => {
  const topic = loadReferenceTopics(lessonMeta.level, sectionName).get(`${lessonMeta.week}:${lessonMeta.day}`)
  if (!topic) return null

  if (/^Additional\b/i.test(topic)) {
    return `- Soumatome ${lessonMeta.level} ${sourceTitle(sectionName)}, Minggu ${lessonMeta.week} Hari ${lessonMeta.day}: ${additionalTopicTitle(topic, lessonMeta)}`
  }

  return `- Soumatome ${lessonMeta.level} ${sourceTitle(sectionName)}, Minggu ${lessonMeta.week} Hari ${lessonMeta.day}: ${topic}`
}

const minnaReferenceLine = (lessonMeta) => {
  const source = lessonMeta.level === 'N5'
    ? 'Minna no Nihongo I'
    : 'Minna no Nihongo II'
  const lessonNumbers = loadGrammarMnnLessons(lessonMeta.level).get(`${lessonMeta.week}:${lessonMeta.day}`) ?? []
  const lessonText = formatIndonesianList(lessonNumbers)

  if (!lessonText) {
    return `- ${source} sebagai validasi bentuk dasar`
  }

  return `- ${source}, pelajaran ${lessonText} sebagai validasi bentuk dasar`
}

export const expectedReferenceLines = (lessonMeta, sectionName) => {
  if (!lessonMeta) return { lines: [], missingSource: null }

  const { level } = lessonMeta
  const title = sourceTitle(sectionName)
  const firstLine = primaryReferenceLine(lessonMeta, sectionName)

  if (!firstLine) {
    return {
      lines: [],
      missingSource: `could not find local reference topic for ${lessonMeta.level} ${sectionName} week ${lessonMeta.week} day ${lessonMeta.day}`,
    }
  }

  const references = [firstLine]

  if (sectionName === 'grammar') {
    if (level === 'N5' || level === 'N4') references.push(minnaReferenceLine(lessonMeta))
    if (level === 'N3') references.push('- Shinkanzen N3 Grammar sebagai validasi nuansa dan perbandingan konteks')
  }

  if (sectionName === 'vocabulary' && level === 'N3') {
    references.push('- Shinkanzen N3 Vocabulary sebagai validasi kosakata dan perbandingan konteks')
  }

  if (sectionName === 'kanji' && level === 'N3') {
    references.push('- Shinkanzen N3 Kanji sebagai validasi kanji dan perbandingan konteks')
  }

  references.push(`- JLPT Sensei ${level} ${title} List`)
  references.push(`- JTest4You ${level} ${title} List`)

  if (sectionName !== 'kanji') {
    references.push(`- Bunpro ${level} ${title}`)
  }

  return { lines: references, missingSource: null }
}

export const auditReferenceSection = (text, lessonMeta, push, sectionName) => {
  if (!lessonMeta) return

  const references = section(text, 'Referensi')
  const referenceLines = references
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))

  if (!referenceLines.length) {
    push('## Referensi must contain bullet references')
    return
  }

  const { lines: expectedLines, missingSource } = expectedReferenceLines(lessonMeta, sectionName)
  if (missingSource) {
    push(missingSource)
    return
  }

  const additionalLabel = `Additional ${sectionName[0].toUpperCase()}${sectionName.slice(1)}`
  const additionalLines = referenceLines.slice(expectedLines.length)
  const comparableLines = referenceLines.slice(0, expectedLines.length)

  if (comparableLines.length !== expectedLines.length) {
    push(`## Referensi must contain ${expectedLines.length} canonical source bullet(s) before any ${additionalLabel} bullet`)
  } else {
    for (const [index, expectedLine] of expectedLines.entries()) {
      if (comparableLines[index] !== expectedLine) {
        push(`## Referensi bullet ${index + 1} must be exactly: ${expectedLine}`)
      }
    }
  }

  for (const line of additionalLines) {
    if (!line.includes(additionalLabel)) {
      push(`## Referensi has an unexpected source bullet; use "${additionalLabel}: ..." for supplemental material: ${line}`)
    }
  }
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
    const sentence = fieldValue(block, 'sentence')
    const optionA = fieldValue(block, 'optionA')
    const optionB = fieldValue(block, 'optionB')
    const correct = fieldValue(block, 'correct')

    if (!question || !sentence || !optionA || !optionB || !correct) {
      push(`MiniPractice ${index + 1} is missing question, sentence, optionA, optionB, or correct`)
      continue
    }

    if (
      sentence === '____' ||
      sentence === '文脈に合う表現を選びましょう。' ||
      sentence === 'Pilih kalimat Jepang yang tepat untuk konteks ini.' ||
      sentence.startsWith('Konteks pola:')
    ) {
      push(`MiniPractice ${index + 1} uses a weak fallback sentence instead of a concrete prompt`)
    }

    if (question.startsWith('Pilih contoh yang sesuai')) {
      push(`MiniPractice ${index + 1} uses a weak generated question`)
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
