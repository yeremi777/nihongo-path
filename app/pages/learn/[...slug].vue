<script setup lang="ts">
type OutlineItem = {
  title: string
  description?: string
  to?: string
  week?: number
  day?: number
  topic?: string
  topicLabel?: string
}

type OutlineSection = {
  key: string
  items: OutlineItem[]
}

type NumberedOutlineItem = OutlineItem & {
  number: string
  enabled: boolean
}

type WeekGroup = {
  week: number
  title: string
  items: NumberedOutlineItem[]
}

type SidebarWeekItem = {
  title: string
  to?: string
  enabled: boolean
}

type SidebarWeekGroup = {
  week: number
  title: string
  items: SidebarWeekItem[]
}

type TocLink = {
  id: string
  text: string
  depth?: number
  children?: TocLink[]
}

type ContentLessonDoc = {
  path?: string
  title?: string
  description?: string
  topic?: string
  topicLabel?: string
  week?: number
  day?: number
  meta?: Record<string, unknown>
}

const readLessonField = <K extends 'topic' | 'topicLabel' | 'week' | 'day'>(
  doc: ContentLessonDoc | null | undefined,
  key: K
): ContentLessonDoc[K] | undefined => {
  if (!doc) return undefined

  const value = doc[key]
  if (value !== undefined && value !== null) return value

  const metaValue = doc.meta?.[key]
  if (metaValue === undefined || metaValue === null) return undefined

  return metaValue as ContentLessonDoc[K]
}

const WEEK_DAY_PATH = /\/week-(\d+)-day-(\d+)$/i

const parseWeekDayLesson = (path: string) => {
  const match = path.match(WEEK_DAY_PATH)
  if (!match) return null

  const week = Number(match[1])
  const day = Number(match[2])
  if (!week || !day) return null

  return {
    week,
    day,
    sortOrder: week * 10 + day
  }
}

const route = useRoute()
const { setFallbackPlacement } = useLessonSearch()

const normalizeSlugParam = (value: unknown) => {
  if (Array.isArray(value)) return value.filter((segment): segment is string => typeof segment === 'string' && Boolean(segment))
  if (typeof value === 'string' && value) return [value]
  return []
}

const uniqueValues = (values: string[]) => [...new Set(values.filter(Boolean))]

const slug = computed(() => normalizeSlugParam(route.params.slug))
const contentPath = computed(() => `/learn/${slug.value.join('/')}`)
const rootPath = computed(() => `/learn/${slug.value[0]}`)
const sectionPath = computed(() => contentPath.value.split('/').slice(0, -1).join('/'))
const levelKey = computed(() => slug.value[0]?.toLowerCase() || 'n3')
const activeSectionKey = computed(() => slug.value[1]?.toLowerCase())
const isLevelRoot = computed(() => slug.value.length === 1)
const isArticlePage = computed(() => slug.value.length > 2)

const contentPathCandidates = computed(() => {
  const normalizedPath = contentPath.value.replace(/\/+$/, '')
  return uniqueValues([
    normalizedPath,
    `${normalizedPath}/index`
  ])
})

const contentStemCandidates = computed(() => {
  const normalizedStem = contentPath.value.replace(/^\/+|\/+$/g, '')
  return uniqueValues([
    normalizedStem,
    `${normalizedStem}/index`
  ])
})

const pageDataKey = computed(() => `learn-page:${contentPath.value}`)
const outlineDataKey = computed(() => `learn-outline:${rootPath.value}`)

const { data: page } = await useAsyncData(pageDataKey, async () => {
  for (const path of contentPathCandidates.value) {
    const doc = await queryCollection('content').path(path).first()
    if (doc) return doc
  }

  for (const stem of contentStemCandidates.value) {
    const doc = await queryCollection('content').where('stem', '=', stem).first()
    if (doc) return doc
  }

  return null
}, {
  default: () => null
})

const isKnownOutlineRoute = computed(() => {
  const validLevels = ['n5', 'n4', 'n3']
  const validSections = ['kana', 'grammar', 'vocabulary', 'kanji']
  const section = activeSectionKey.value

  return validLevels.includes(levelKey.value) &&
    !isArticlePage.value &&
    (!section || validSections.includes(section))
})

if (!page.value && !isKnownOutlineRoute.value && !import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Lesson not found'
  })
}

const { data: levelDocs } = await useAsyncData(outlineDataKey, () => {
  return queryCollection('content')
    .where('path', 'LIKE', `${rootPath.value}/%`)
    .all()
    .then((docs) => docs.map((doc) => {
      const lesson = doc as ContentLessonDoc

      return {
        path: lesson.path,
        title: lesson.title,
        description: lesson.description,
        topic: readLessonField(lesson, 'topic'),
        topicLabel: readLessonField(lesson, 'topicLabel'),
        week: readLessonField(lesson, 'week'),
        day: readLessonField(lesson, 'day'),
        meta: lesson.meta
      }
    }))
}, {
  default: () => []
})

const sidebarSectionLabels: Record<string, string> = {
  kana: 'Kana',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  kanji: 'Kanji'
}

const levelSummaries: Record<string, { title: string, description: string }> = {
  n5: {
    title: 'N5',
    description: 'Mulai dari kana, kosakata dasar, dan pola kalimat sederhana untuk membangun fondasi yang kuat.'
  },
  n4: {
    title: 'N4',
    description: 'Latih pola bahasa sehari-hari agar membaca, mendengar, dan merespons terasa lebih alami.'
  },
  n3: {
    title: 'N3',
    description: 'Perkuat kemampuan menengah dengan tata bahasa bernuansa, kosakata luas, dan pemahaman bacaan.'
  }
}

const defaultOutlines: Record<string, OutlineSection[]> = {
  n5: [
    {
      key: 'kana',
      items: [
        { title: 'Hiragana', topic: 'ひらがな', topicLabel: 'Hiragana', to: '/learn/n5/kana/hiragana' },
        { title: 'Katakana', topic: 'カタカナ', topicLabel: 'Katakana', to: '/learn/n5/kana/katakana' }
      ]
    },
    {
      key: 'kanji',
      items: []
    },
    {
      key: 'vocabulary',
      items: []
    },
    {
      key: 'grammar',
      items: []
    }
  ],
  n4: [
    {
      key: 'kanji',
      items: []
    },
    {
      key: 'vocabulary',
      items: []
    },
    {
      key: 'grammar',
      items: []
    }
  ],
  n3: [
    {
      key: 'kanji',
      items: []
    },
    {
      key: 'vocabulary',
      items: []
    },
    {
      key: 'grammar',
      items: []
    }
  ]
}

watch(isArticlePage, (value) => {
  setFallbackPlacement(value ? 'toolbar' : 'sidebar')
}, { immediate: true })

const contentOutlineBySection = computed<Record<string, OutlineItem[]>>(() => {
  const result: Record<string, Array<OutlineItem & { sortOrder: number }>> = {}
  const root = rootPath.value

  for (const doc of levelDocs.value || []) {
    const lesson = doc as ContentLessonDoc
    if (!lesson.path?.startsWith(`${root}/`)) continue

    const schedule = parseWeekDayLesson(lesson.path)
    if (!schedule) continue

    const relative = lesson.path.slice(root.length + 1)
    const [sectionKey, lessonSlug] = relative.split('/')
    if (!sectionKey || !lessonSlug || lessonSlug === 'index') continue

    if (!result[sectionKey]) result[sectionKey] = []

    result[sectionKey].push({
      title: lesson.title || lessonSlug,
      topic: readLessonField(lesson, 'topic'),
      topicLabel: readLessonField(lesson, 'topicLabel'),
      week: schedule.week ?? readLessonField(lesson, 'week'),
      day: schedule.day ?? readLessonField(lesson, 'day'),
      to: lesson.path,
      sortOrder: schedule.sortOrder
    })
  }

  return Object.fromEntries(
    Object.entries(result).map(([sectionKey, items]) => [
      sectionKey,
      items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ sortOrder, ...item }) => item)
    ])
  )
})

const availableSections = computed(() => {
  const defaults = defaultOutlines[levelKey.value] || []

  return defaults.map((section) => {
    const contentItems = contentOutlineBySection.value[section.key]
    if (!contentItems?.length) return section

    return {
      ...section,
      items: contentItems
    }
  })
})

const sections = computed(() => {
  if (!activeSectionKey.value) return availableSections.value

  const active = availableSections.value.find((section) => section.key === activeSectionKey.value)
  return active ? [active] : []
})

const sidebarSections = computed(() => {
  return availableSections.value.map((section) => ({
    ...section,
    sidebarTitle: sidebarSectionLabels[section.key] || section.key,
    href: `${rootPath.value}/${section.key}`,
    active: section.key === activeSectionKey.value
  }))
})

const formatSidebarItemTitle = (title: string, day?: number) => {
  if (typeof day === 'number') return `Day ${day}`

  // Turns:
  // - "Week 1 Day 1 - 駐車場" -> "Day 1"
  // - "Week 1 Day 2" -> "Day 2"
  // Keeps other titles as-is.
  const match = title.match(/week\s*\d+\s*day\s*(\d+)/i)
  if (match?.[1]) return `Day ${match[1]}`
  return title
}

const sectionHasWeeks = (section: OutlineSection) =>
  section.items.some((item) => typeof item.week === 'number')

const sidebarSectionWeekGroups = computed<Record<string, SidebarWeekGroup[]>>(() => {
  const result: Record<string, SidebarWeekGroup[]> = {}

  for (const section of availableSections.value) {
    const groups = new Map<number, SidebarWeekItem[]>()

    for (const item of section.items) {
      const week = item.week ?? 1

      const sidebarItem: SidebarWeekItem = {
        title: formatSidebarItemTitle(item.title, item.day),
        to: item.to,
        enabled: Boolean(item.to && existingLinks.value.has(item.to))
      }

      if (!groups.has(week)) groups.set(week, [])
      groups.get(week)!.push(sidebarItem)
    }

    const weekGroups = [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([week, items]) => ({
        week,
        title: sectionHasWeeks(section) ? `Week ${week}` : '',
        items
      }))

    result[section.key] = weekGroups
  }

  return result
})

const levelSectionCards = computed(() => {
  return availableSections.value.map((section, index) => ({
    key: section.key,
    title: sidebarSectionLabels[section.key] || section.key,
    number: String(index + 1).padStart(2, '0'),
    to: `${rootPath.value}/${section.key}`
  }))
})

const existingLinks = computed(() => {
  return new Set((levelDocs.value || []).map((doc: any) => doc.path))
})

const numberedSections = computed(() => {
  let count = 0

  return sections.value.map((section) => ({
    ...section,
    items: section.items.map((item): NumberedOutlineItem => {
      count += 1
      return {
        ...item,
        number: String(count).padStart(2, '0'),
        enabled: Boolean(item.to && existingLinks.value.has(item.to))
      }
    })
  }))
})

const numberedWeekGroups = computed<WeekGroup[]>(() => {
  let count = 0
  const groups = new Map<number, NumberedOutlineItem[]>()

  for (const section of sections.value) {
    for (const item of section.items) {
      const week = item.week ?? 1
      count += 1

      const numberedItem: NumberedOutlineItem = {
        ...item,
        number: String(count).padStart(2, '0'),
        enabled: Boolean(item.to && existingLinks.value.has(item.to))
      }

      if (!groups.has(week)) {
        groups.set(week, [])
      }

      groups.get(week)!.push(numberedItem)
    }
  }

  return [...groups.entries()]
    .sort(([weekA], [weekB]) => weekA - weekB)
    .map(([week, items]) => ({
      week,
      title: sectionHasWeeks(sections.value[0]) ? `Week ${week}` : '',
      items
    }))
})

const activeMobileWeekGroups = computed(() => {
  const key = activeSectionKey.value
  if (!key) return []

  return (sidebarSectionWeekGroups.value[key] || []).filter((group) => group.title)
})

const activeSectionItems = computed<NumberedOutlineItem[]>(() => {
  return numberedSections.value[0]?.items || []
})

const currentLessonIndex = computed(() => {
  return activeSectionItems.value.findIndex((item) => item.to === contentPath.value)
})

const previousLesson = computed<NumberedOutlineItem | null>(() => {
  if (currentLessonIndex.value <= 0) return null

  return activeSectionItems.value[currentLessonIndex.value - 1] || null
})

const nextLesson = computed<NumberedOutlineItem | null>(() => {
  if (currentLessonIndex.value < 0) return null

  return activeSectionItems.value[currentLessonIndex.value + 1] || null
})

const articleToc = computed<TocLink[]>(() => {
  const links = ((page.value as any)?.body?.toc?.links || []) as TocLink[]

  const sectionLinks = Array.isArray(links) ? links.filter((link) => link.id && link.text) : []

  return [
    {
      id: articleTopAnchorId.value,
      text: pageTitle.value,
      depth: 1
    },
    ...sectionLinks
  ]
})

const mobileArticleToc = computed(() => {
  return articleToc.value
})

const eyebrow = computed(() => {
  const doc = page.value as any
  const sectionKey = activeSectionKey.value || doc.category?.toLowerCase()
  const sectionTitle = sectionKey ? sidebarSectionLabels[sectionKey] : undefined
  return [doc.level, sectionTitle].filter(Boolean).join(' · ') || 'Nihongo Path'
})

const levelRootHref = computed(() => rootPath.value)

const openSidebarSections = ref<Record<string, boolean>>({})
const openSidebarWeeks = ref<Record<string, boolean>>({})
const mobileSidebarOpen = ref(false)
const mobileTocOpen = ref(false)
const openMobileContentWeeks = ref<Record<string, boolean>>({})

const currentLessonWeek = computed(() => {
  const doc = page.value as { week?: number } | null
  if (typeof doc?.week === 'number') return doc.week

  const lessonSlug = slug.value[2]
  const match = lessonSlug?.match(/^week-(\d+)-day-/)
  return match ? Number(match[1]) : 1
})

const lessonWeekDay = computed(() => {
  const doc = page.value as { week?: number; day?: number } | null
  if (typeof doc?.week === 'number' && typeof doc?.day === 'number') {
    return { week: doc.week, day: doc.day }
  }

  const lessonSlug = slug.value[slug.value.length - 1]
  const match = lessonSlug?.match(/^week-(\d+)-day-(\d+)/)
  if (match) {
    return { week: Number(match[1]), day: Number(match[2]) }
  }

  return null
})

const articleTopAnchorId = computed(() => {
  const weekDay = lessonWeekDay.value
  if (weekDay) return `w${weekDay.week}d${weekDay.day}`

  const lessonSlug = slug.value[slug.value.length - 1] || 'article'
  return lessonSlug.replace(/[^a-z0-9-]/gi, '')
})

const defaultOpenSidebarWeek = computed(() => {
  if (!isArticlePage.value) return 1
  return currentLessonWeek.value
})

watch(
  activeSectionKey,
  (sectionKey) => {
    if (!sectionKey) return
    openSidebarSections.value[sectionKey] = true
  },
  { immediate: true }
)

const isSidebarSectionOpen = (sectionKey: string, sectionActive: boolean) => {
  const stored = openSidebarSections.value[sectionKey]
  if (stored !== undefined) return stored
  return sectionActive
}

const isSidebarWeekOpen = (sectionKey: string, week: number, sectionActive: boolean) => {
  const key = `${sectionKey}:${week}`
  const stored = openSidebarWeeks.value[key]
  if (stored !== undefined) return stored
  return isArticlePage.value && sectionActive && week === defaultOpenSidebarWeek.value
}

const onSectionToggle = (key: string, event: Event) => {
  const el = event.target as HTMLDetailsElement | null
  if (!el) return
  openSidebarSections.value[key] = el.open
}

const onWeekToggle = (key: string, event: Event) => {
  const el = event.target as HTMLDetailsElement | null
  if (!el) return
  openSidebarWeeks.value[key] = el.open
}

const toggleSidebarSection = (key: string) => {
  const section = sidebarSections.value.find((item) => item.key === key)
  const sectionActive = section?.active ?? false
  openSidebarSections.value[key] = !isSidebarSectionOpen(key, sectionActive)
}

const scrollToWeekContent = async (sectionKey: string, week: number) => {
  const weekId = `week-${week}`
  const onSectionIndex = activeSectionKey.value === sectionKey && !isArticlePage.value

  if (onSectionIndex) {
    await nextTick()
    const target = document.getElementById(weekId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
  }

  await navigateTo(`${rootPath.value}/${sectionKey}#${weekId}`)
}

const isMobileContentWeekOpen = (week: number) => {
  const sectionKey = activeSectionKey.value || 'section'
  return Boolean(openMobileContentWeeks.value[`${sectionKey}:${week}`])
}

const toggleMobileContentWeek = (week: number) => {
  const sectionKey = activeSectionKey.value
  if (!sectionKey) return

  const key = `${sectionKey}:${week}`
  openMobileContentWeeks.value[key] = !openMobileContentWeeks.value[key]
}

const syncWeekFromHash = async () => {
  if (isLevelRoot.value || isArticlePage.value || typeof document === 'undefined') return

  const match = route.hash.match(/^#week-(\d+)$/i)
  if (!match) return

  const week = Number(match[1])
  const sectionKey = activeSectionKey.value
  if (!sectionKey) return

  openSidebarWeeks.value[`${sectionKey}:${week}`] = true

  await nextTick()
  requestAnimationFrame(() => {
    const target = document.getElementById(`week-${week}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const toggleSidebarWeek = async (key: string) => {
  const [sectionKey, weekValue] = key.split(':')
  const week = Number(weekValue)
  const section = sidebarSections.value.find((item) => item.key === sectionKey)
  const sectionActive = section?.active ?? false
  const willOpen = !isSidebarWeekOpen(sectionKey, week, sectionActive)

  openSidebarWeeks.value[key] = willOpen

  if (willOpen) {
    await scrollToWeekContent(sectionKey, week)
  }
}

const pageTitle = computed(() => {
  if (isLevelRoot.value && levelSummaries[levelKey.value]) {
    return levelSummaries[levelKey.value].title
  }

  if (activeSectionKey.value && !isArticlePage.value) {
    const sectionTitle = sidebarSectionLabels[activeSectionKey.value]
    const levelTitle = levelSummaries[levelKey.value]?.title || levelKey.value.toUpperCase()
    if (sectionTitle) return `${levelTitle} - ${sectionTitle}`
  }

  const doc = page.value as ContentLessonDoc | null
  if (hasLessonTopic(doc)) return doc!.topic!

  const title = doc?.title
  return typeof title === 'string' ? title : 'Learn'
})

const lessonTopic = computed(() => {
  const doc = page.value as ContentLessonDoc | null
  const topic = readLessonField(doc, 'topic')
  const topicLabel = readLessonField(doc, 'topicLabel')

  if (!topic || !topicLabel) return null

  return {
    topic,
    topicLabel,
    week: readLessonField(doc, 'week'),
    day: readLessonField(doc, 'day')
  }
})

const sectionWeekHref = computed(() => {
  if (!activeSectionKey.value || !lessonWeekDay.value) return null
  return `${sectionPath.value}#week-${lessonWeekDay.value.week}`
})

const activeSectionLabel = computed(() => {
  const key = activeSectionKey.value
  return key ? sidebarSectionLabels[key] : 'Section'
})

const normalizeDescription = (value: unknown) => {
  if (typeof value !== 'string') return ''

  return value.replace(/\s+/g, ' ').trim()
}

const pageDescription = computed(() => {
  if (isLevelRoot.value && levelSummaries[levelKey.value]) {
    return normalizeDescription(levelSummaries[levelKey.value].description)
  }

  const description = (page.value as any)?.description
  return normalizeDescription(description)
})

const activeTocId = ref('')
const TOC_SCROLL_OFFSET = 168
let tocScrollRaf = 0
let tocClickLockUntil = 0

type TocSection = {
  id: string
  el: HTMLElement
}

const getTocSections = (): TocSection[] => {
  const rootId = articleTopAnchorId.value

  return articleToc.value
    .filter((link) => link.id !== rootId)
    .map((link) => ({
      id: link.id,
      el: document.getElementById(link.id)
    }))
    .filter((section): section is TocSection => Boolean(section.el))
}

const updateActiveToc = () => {
  if (!isArticlePage.value || typeof document === 'undefined') return
  if (Date.now() < tocClickLockUntil) return

  const sections = getTocSections()
  const rootId = articleTopAnchorId.value

  if (!sections.length) {
    activeTocId.value = rootId
    return
  }

  const scrollY = window.scrollY
  const anchorY = TOC_SCROLL_OFFSET
  const scrollPos = scrollY + anchorY
  const nearBottom = scrollY + window.innerHeight >= document.documentElement.scrollHeight - 64
  const hashId = route.hash?.replace('#', '')

  const firstTop = sections[0].el.getBoundingClientRect().top + scrollY
  if (scrollPos < firstTop) {
    activeTocId.value = rootId
    return
  }

  if (hashId && (hashId === rootId || sections.some((section) => section.id === hashId))) {
    const hashEl = document.getElementById(hashId)
    if (hashEl) {
      const hashRect = hashEl.getBoundingClientRect()
      if (hashRect.top < window.innerHeight && hashRect.bottom > 0) {
        activeTocId.value = hashId
        return
      }
    }
  }

  for (const section of sections) {
    const rect = section.el.getBoundingClientRect()
    if (rect.top <= anchorY && rect.bottom > anchorY) {
      activeTocId.value = section.id
      return
    }
  }

  const positions = sections.map((section) => ({
    id: section.id,
    top: section.el.getBoundingClientRect().top + scrollY
  }))

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].top
    const end = positions[i + 1]?.top ?? Number.POSITIVE_INFINITY
    if (scrollPos >= start && scrollPos < end) {
      activeTocId.value = positions[i].id
      return
    }
  }

  if (nearBottom) {
    const visible = sections.filter((section) => {
      const rect = section.el.getBoundingClientRect()
      return rect.bottom > 0 && rect.top < window.innerHeight
    })

    if (visible.length) {
      activeTocId.value = visible[visible.length - 1].id
      return
    }
  }

  let lastPassed = sections[0].id
  for (const section of sections) {
    if (section.el.getBoundingClientRect().top <= anchorY) {
      lastPassed = section.id
    }
  }

  activeTocId.value = lastPassed
}

const scheduleTocUpdate = () => {
  if (tocScrollRaf) return

  tocScrollRaf = requestAnimationFrame(() => {
    tocScrollRaf = 0
    updateActiveToc()
  })
}

const scrollToTocTarget = (id: string) => {
  if (typeof document === 'undefined') return

  const target = document.getElementById(id)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

  if (id === articleTopAnchorId.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const onTocLinkClick = (id: string) => {
  activeTocId.value = id
  tocClickLockUntil = Date.now() + 800
  scrollToTocTarget(id)
}

const onMobileTocLinkClick = (id: string) => {
  mobileTocOpen.value = false
  onTocLinkClick(id)
}

const initTocSpy = async () => {
  if (!isArticlePage.value || typeof document === 'undefined') return

  await nextTick()
  requestAnimationFrame(() => {
    updateActiveToc()
  })
}

const closeOpenKanjiCards = async () => {
  if (!isArticlePage.value) return
  await nextTick()

  if (typeof document === 'undefined') return

  document.querySelectorAll<HTMLDetailsElement>('.prose .kanji-card[open]').forEach((card) => {
    card.open = false
  })
}

onMounted(() => {
  closeOpenKanjiCards()
  if (!route.hash) {
    activeTocId.value = articleTopAnchorId.value
  }
  initTocSpy()
  syncWeekFromHash()
  window.addEventListener('scroll', scheduleTocUpdate, { passive: true })
})

watch(() => route.fullPath, () => {
  mobileSidebarOpen.value = false
  mobileTocOpen.value = false
  closeOpenKanjiCards()
  const hashId = route.hash?.replace('#', '')
  activeTocId.value = hashId || articleTopAnchorId.value
  initTocSpy()
  syncWeekFromHash()
})

watch(() => route.hash, () => {
  const hashId = route.hash?.replace('#', '')
  if (hashId) {
    activeTocId.value = hashId
    tocClickLockUntil = Date.now() + 800
    setTimeout(updateActiveToc, 850)
  } else {
    updateActiveToc()
  }
})

watch(() => (page.value as any)?.body, () => {
  initTocSpy()
}, { flush: 'post' })

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleTocUpdate)
  if (tocScrollRaf) cancelAnimationFrame(tocScrollRaf)
})

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value || 'Nihongo Path lesson'
})
</script>

<template>
  <div>
  <article
    v-if="isArticlePage"
    class="min-h-screen pb-8"
  >
    <div class="article-toolbar px-5 py-3 sm:px-8 lg:px-12">
      <div class="mx-auto flex max-w-[92rem] items-center justify-between gap-6">
        <nav class="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold" aria-label="Lesson breadcrumb">
          <NuxtLink
            :to="sectionPath"
            class="text-[color:var(--color-muted)] transition hover:text-[color:var(--color-primary)]"
          >
            ← {{ activeSectionLabel }}
          </NuxtLink>
          <template v-if="sectionWeekHref && lessonWeekDay">
            <span class="text-[color:var(--color-muted)]/50" aria-hidden="true">/</span>
            <NuxtLink
              :to="sectionWeekHref"
              class="text-[color:var(--color-muted)] transition hover:text-[color:var(--color-primary)]"
            >
              Week {{ lessonWeekDay.week }}
            </NuxtLink>
          </template>
        </nav>
        <div class="flex items-center gap-2">
          <button
            v-if="mobileArticleToc.length"
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)] transition hover:text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] lg:hidden"
            :aria-expanded="mobileTocOpen"
            aria-controls="mobile-article-toc"
            aria-label="Open contents"
            title="Contents"
            @click="mobileTocOpen = true"
          >
            <svg
              aria-hidden="true"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M8 6h13" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </svg>
          </button>
          <LessonSearchTrigger variant="compact" />
          <ThemeToggle />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="mobileTocOpen && mobileArticleToc.length"
        class="fixed inset-0 z-50 lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-article-toc-title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/45"
          aria-label="Close contents"
          @click="mobileTocOpen = false"
        />

        <aside
          id="mobile-article-toc"
          class="absolute right-0 top-0 flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col border-l bg-[color:var(--color-surface)] shadow-2xl"
          style="border-color: var(--color-border)"
        >
          <div class="flex items-center justify-between gap-4 border-b px-5 py-2.5" style="border-color: var(--color-border)">
            <div class="min-w-0">
              <p id="mobile-article-toc-title" class="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                On This Page
              </p>
            </div>
            <button
              type="button"
              class="mobile-drawer-close"
              aria-label="Close contents"
              @click="mobileTocOpen = false"
            >
              <svg
                aria-hidden="true"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <nav class="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-1.5" aria-label="Article contents">
            <NuxtLink
              v-for="link in mobileArticleToc"
              :key="link.id"
              :to="`${contentPath}#${link.id}`"
              class="block rounded-md py-3 text-sm font-semibold leading-5 transition"
              :class="[
                link.id === articleTopAnchorId ? 'px-3' : link.depth && link.depth > 2 ? 'ml-6 px-3' : 'ml-3 px-3',
                link.id === activeTocId
                  ? 'bg-[color:var(--color-primary-soft)] text-[color:var(--color-text)]'
                  : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-bg)] hover:text-[color:var(--color-text)]'
              ]"
              @click="onMobileTocLinkClick(link.id)"
            >
              {{ link.text }}
            </NuxtLink>
          </nav>
        </aside>
      </div>
    </Teleport>

    <div class="mx-auto max-w-[92rem] px-5 pt-8 sm:px-8 lg:px-12">
      <div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <main class="min-w-0">
          <header :id="articleTopAnchorId" class="article-top-anchor border-b pb-6 sm:pb-8" style="border-color: var(--color-border)">
            <p class="text-base font-semibold tracking-wide">
              <span class="text-[color:var(--color-primary)]">{{ eyebrow }}</span>
              <span
                v-if="lessonWeekDay"
                class="text-[color:var(--color-muted)]"
              >
                — Week {{ lessonWeekDay.week }} Day {{ lessonWeekDay.day }}
              </span>
            </p>

            <h1 v-if="!lessonTopic" class="mt-5 max-w-5xl text-4xl font-semibold leading-tight tracking-normal text-[color:var(--color-text)] sm:mt-6 sm:text-5xl lg:text-6xl">
              {{ pageTitle }}
            </h1>
            <LessonTopicDisplay
              v-else
              class="mt-5 sm:mt-6"
              variant="header"
              :show-schedule="false"
              :topic="lessonTopic.topic"
              :topic-label="lessonTopic.topicLabel"
              :week="lessonTopic.week"
              :day="lessonTopic.day"
            />
            <p v-if="pageDescription" class="mt-4 max-w-none text-pretty text-sm leading-6 text-[color:var(--color-muted)]/90 sm:mt-5 sm:text-base sm:leading-7">
              {{ pageDescription }}
            </p>
          </header>

          <div class="prose prose-nihongo max-w-none">
            <ContentRenderer :value="page" />
          </div>

          <nav
            v-if="previousLesson || nextLesson"
            class="mt-8 grid gap-4 border-t pt-6 sm:pt-8 md:grid-cols-2"
            style="border-color: var(--color-border)"
            aria-label="Lesson navigation"
          >
            <NuxtLink
              v-if="previousLesson?.enabled && previousLesson.to"
              :to="previousLesson.to"
              class="group rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:border-[color:var(--color-primary)]"
            >
              <span class="text-sm font-semibold text-[color:var(--color-muted)]">
                ← Previous
              </span>
              <strong v-if="!hasLessonTopic(previousLesson)" class="mt-3 block text-lg font-semibold leading-snug text-[color:var(--color-text)]">
                {{ previousLesson.title }}
              </strong>
              <LessonTopicDisplay
                v-else
                class="mt-3"
                variant="nav"
                :topic="previousLesson.topic!"
                :topic-label="previousLesson.topicLabel!"
              />
            </NuxtLink>

            <div
              v-else-if="previousLesson"
              class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 opacity-70"
            >
              <span class="text-sm font-semibold text-[color:var(--color-muted)]">
                ← Previous
              </span>
              <strong v-if="!hasLessonTopic(previousLesson)" class="mt-3 block text-lg font-semibold leading-snug text-[color:var(--color-text)]">
                {{ previousLesson.title }}
              </strong>
              <LessonTopicDisplay
                v-else
                class="mt-3"
                variant="nav"
                :topic="previousLesson.topic!"
                :topic-label="previousLesson.topicLabel!"
              />
              <span class="mt-2 block text-sm text-[color:var(--color-muted)]">
                Planned
              </span>
            </div>

            <NuxtLink
              v-if="nextLesson?.enabled && nextLesson.to"
              :to="nextLesson.to"
              class="group rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-right transition hover:border-[color:var(--color-primary)]"
              :class="previousLesson ? '' : 'md:col-start-2'"
            >
              <span class="text-sm font-semibold text-[color:var(--color-muted)]">
                Next →
              </span>
              <strong v-if="!hasLessonTopic(nextLesson)" class="mt-3 block text-lg font-semibold leading-snug text-[color:var(--color-text)]">
                {{ nextLesson.title }}
              </strong>
              <LessonTopicDisplay
                v-else
                class="mt-3"
                variant="nav"
                :topic="nextLesson.topic!"
                :topic-label="nextLesson.topicLabel!"
              />
            </NuxtLink>

            <div
              v-else-if="nextLesson"
              class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-right opacity-70"
              :class="previousLesson ? '' : 'md:col-start-2'"
            >
              <span class="text-sm font-semibold text-[color:var(--color-muted)]">
                Next →
              </span>
              <strong v-if="!hasLessonTopic(nextLesson)" class="mt-3 block text-lg font-semibold leading-snug text-[color:var(--color-text)]">
                {{ nextLesson.title }}
              </strong>
              <LessonTopicDisplay
                v-else
                class="mt-3"
                variant="nav"
                :topic="nextLesson.topic!"
                :topic-label="nextLesson.topicLabel!"
              />
              <span class="mt-2 block text-sm text-[color:var(--color-muted)]">
                Planned
              </span>
            </div>
          </nav>
        </main>

        <aside v-if="articleToc.length" class="hidden lg:block">
          <div class="sticky top-[4.75rem]">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              On This Page
            </p>
            <nav class="toc-rail mt-5 space-y-1 border-l" style="border-color: var(--color-border)">
              <NuxtLink
                v-for="link in articleToc"
                :key="link.id"
                :to="`${contentPath}#${link.id}`"
                class="toc-rail-link block py-1.5 text-sm font-semibold leading-6 transition-[color] duration-200"
                :class="[
                  link.id === articleTopAnchorId ? 'toc-rail-link--root' : 'toc-rail-link--section',
                  link.depth && link.depth > 2 ? 'toc-rail-link--nested' : '',
                  link.id === activeTocId
                    ? 'toc-rail-link--active text-[color:var(--color-text)]'
                    : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]'
                ]"
                @click="onTocLinkClick(link.id)"
              >
                {{ link.text }}
              </NuxtLink>
            </nav>
          </div>
        </aside>
      </div>
    </div>
  </article>

  <section v-else class="min-h-screen lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]">
    <div class="article-toolbar px-5 py-3 sm:px-8 lg:hidden">
      <div class="flex items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-2">
          <button
            type="button"
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)] transition hover:text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
            :aria-expanded="mobileSidebarOpen"
            aria-controls="mobile-section-panel"
            aria-label="Open sections"
            title="Sections"
            @click="mobileSidebarOpen = true"
          >
            <svg
              aria-hidden="true"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <p class="font-japanese text-base font-semibold text-[color:var(--color-primary)]">日本語の道</p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <LessonSearchTrigger variant="compact" />
          <ThemeToggle />
        </div>
      </div>
    </div>

    <header class="border-b px-5 py-8 sm:px-8 lg:hidden" style="border-color: var(--color-border)">
      <div>
        <h1 class="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-[color:var(--color-text)] sm:text-5xl">
          {{ pageTitle }}
        </h1>
        <p v-if="pageDescription" class="mt-4 max-w-4xl text-base leading-7 text-[color:var(--color-muted)] sm:text-lg sm:leading-8">
          {{ pageDescription }}
        </p>
      </div>
    </header>

    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Sections"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/45"
        aria-label="Close sections"
        @click="mobileSidebarOpen = false"
      />

      <aside
        id="mobile-section-panel"
        class="relative flex h-full flex-col border-r bg-[color:var(--color-surface)] shadow-2xl"
        style="border-color: var(--color-border); width: min(20rem, calc(100vw - 3rem))"
      >
        <div class="border-b px-5 py-5" style="border-color: var(--color-border)">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-japanese text-base font-semibold text-[color:var(--color-primary)]">日本語の道</p>
              <h2 class="mt-3 text-xl font-semibold leading-tight text-[color:var(--color-text)]">
                {{ levelSummaries[levelKey]?.title || levelKey.toUpperCase() }}
              </h2>
            </div>

            <button
              type="button"
              class="mobile-drawer-close"
              aria-label="Close sections"
              @click="mobileSidebarOpen = false"
            >
              <svg
                aria-hidden="true"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto px-5 py-6" aria-label="Mobile section navigation">
          <NuxtLink
            to="/learn"
            class="text-base font-semibold text-[color:var(--color-text)] hover:text-[color:var(--color-primary)]"
            @click="mobileSidebarOpen = false"
          >
            ← All tracks
          </NuxtLink>

          <div class="mt-8">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
              Sections
            </p>
            <div class="mt-4 grid gap-2">
              <NuxtLink
                v-for="section in sidebarSections"
                :key="`mobile-section-${section.key}`"
                :to="section.href"
                class="rounded-md border px-3 py-3 text-sm font-bold transition"
                :class="section.active
                  ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:border-[color:var(--color-primary)]'"
                @click="mobileSidebarOpen = false"
              >
                {{ section.sidebarTitle }}
              </NuxtLink>
            </div>
          </div>

          <div
            v-if="activeMobileWeekGroups.length"
            class="mt-8"
          >
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
              Jump to Content
            </p>

            <div class="mt-4 space-y-5">
              <section
                v-for="group in activeMobileWeekGroups"
                :key="`mobile-week-${group.week}`"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-3 text-left text-sm font-bold text-[color:var(--color-text)] transition hover:border-[color:var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
                  :aria-expanded="isMobileContentWeekOpen(group.week)"
                  @click="toggleMobileContentWeek(group.week)"
                >
                  <span>{{ group.title }}</span>
                  <svg
                    aria-hidden="true"
                    class="h-4 w-4 shrink-0 transition-transform"
                    :class="isMobileContentWeekOpen(group.week) ? 'rotate-180' : ''"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <div
                  v-if="isMobileContentWeekOpen(group.week)"
                  class="mt-2 grid gap-1"
                >
                  <template
                    v-for="item in group.items"
                    :key="`mobile-week-${group.week}-${item.title}`"
                  >
                    <NuxtLink
                      v-if="item.enabled && item.to"
                      :to="item.to"
                      class="rounded-md px-3 py-2.5 text-sm font-semibold text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-bg)] hover:text-[color:var(--color-text)]"
                      :class="item.to === contentPath ? 'bg-[color:var(--color-primary-soft)] text-[color:var(--color-text)]' : ''"
                      @click="mobileSidebarOpen = false"
                    >
                      {{ item.title }}
                    </NuxtLink>

                    <span
                      v-else
                      class="rounded-md px-3 py-2.5 text-sm font-semibold text-[color:var(--color-muted)]/65"
                    >
                      {{ item.title }}
                    </span>
                  </template>
                </div>
              </section>
            </div>
          </div>
        </nav>
      </aside>
    </div>

    <aside class="hidden border-b bg-[color:var(--color-surface)]/55 lg:sticky lg:top-0 lg:block lg:h-screen lg:border-b-0 lg:border-r" style="border-color: var(--color-border)">
      <div class="flex h-full flex-col">
        <div class="border-b px-6 py-6" style="border-color: var(--color-border)">
          <p class="font-japanese text-lg font-semibold text-[color:var(--color-primary)]">日本語の道</p>
          <h2 class="mt-4 text-xl font-semibold leading-tight text-[color:var(--color-text)]">
            <template v-if="isLevelRoot">{{ pageTitle }}</template>
            <template v-else>
              <NuxtLink
                :to="levelRootHref"
                class="transition hover:text-[color:var(--color-primary)]"
              >
                {{ levelSummaries[levelKey]?.title || levelKey.toUpperCase() }}
              </NuxtLink>
              <span v-if="activeSectionKey">
                - {{ sidebarSectionLabels[activeSectionKey] }}
              </span>
            </template>
          </h2>
        </div>

        <div class="border-b px-5 py-4" style="border-color: var(--color-border)">
          <LessonSearchTrigger />
        </div>

        <nav class="flex-1 overflow-y-auto px-6 py-8">
          <NuxtLink to="/learn" class="text-base font-semibold text-[color:var(--color-text)] hover:text-[color:var(--color-primary)]">
            ← All tracks
          </NuxtLink>

          <div class="mt-10 space-y-8">
            <div>
              <p class="text-sm font-bold uppercase tracking-normal text-[color:var(--color-muted)]">Sections</p>
              <div class="mt-5 space-y-3">
                <div
                  v-for="section in sidebarSections"
                  :key="section.key"
                  class="group"
                >
                  <div class="flex items-center justify-between gap-2">
                    <NuxtLink
                      :to="section.href"
                      class="min-w-0 truncate text-base font-semibold leading-6 transition"
                      :class="section.active ? 'text-[color:var(--color-primary)]' : 'text-[color:var(--color-text)] hover:text-[color:var(--color-primary)]'"
                    >
                      {{ section.sidebarTitle }}
                    </NuxtLink>

                    <button
                      type="button"
                      class="shrink-0 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/40 p-1.5 text-[color:var(--color-muted)] transition hover:text-[color:var(--color-text)] hover:border-[color:var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
                      :aria-expanded="isSidebarSectionOpen(section.key, section.active)"
                      :aria-controls="`sidebar-${section.key}`"
                      @click="toggleSidebarSection(section.key)"
                    >
                      <svg
                        aria-hidden="true"
                        class="h-4 w-4 transition-transform"
                        :class="isSidebarSectionOpen(section.key, section.active) ? 'rotate-180' : ''"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div
                    v-show="isSidebarSectionOpen(section.key, section.active)"
                    :id="`sidebar-${section.key}`"
                    class="mt-3 space-y-2 pl-3"
                  >
                    <template v-for="group in (sidebarSectionWeekGroups[section.key] || [])" :key="`${section.key}-week-${group.week}`">
                      <template v-if="group.title">
                        <button
                          type="button"
                          class="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-[color:var(--color-muted)] transition hover:text-[color:var(--color-text)]"
                          :aria-expanded="isSidebarWeekOpen(section.key, group.week, section.active)"
                          :aria-controls="`sidebar-${section.key}-week-${group.week}`"
                          @click="toggleSidebarWeek(`${section.key}:${group.week}`)"
                        >
                          <span>{{ group.title }}</span>
                          <svg
                            aria-hidden="true"
                            class="h-3.5 w-3.5 shrink-0 text-[color:var(--color-muted)] transition-transform"
                            :class="isSidebarWeekOpen(section.key, group.week, section.active) ? 'rotate-180' : ''"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
                          </svg>
                        </button>

                        <div
                          v-show="isSidebarWeekOpen(section.key, group.week, section.active)"
                          :id="`sidebar-${section.key}-week-${group.week}`"
                          class="mt-2 space-y-2 pl-3"
                        >
                          <template v-for="item in group.items" :key="`${section.key}-${group.week}-${item.title}`">
                            <NuxtLink
                              v-if="item.enabled && item.to"
                              :to="item.to"
                              class="block truncate text-sm font-semibold text-[color:var(--color-text)] hover:text-[color:var(--color-primary)]"
                            >
                              {{ item.title }}
                            </NuxtLink>
                            <span
                              v-else
                              class="block truncate text-sm font-semibold text-[color:var(--color-muted)] opacity-70"
                            >
                              {{ item.title }}
                            </span>
                          </template>
                        </div>
                      </template>
                      <div v-else class="mt-2 space-y-2 pl-3">
                        <template v-for="item in group.items" :key="`${section.key}-${group.week}-${item.title}`">
                          <NuxtLink
                            v-if="item.enabled && item.to"
                            :to="item.to"
                            class="block truncate text-sm font-semibold text-[color:var(--color-text)] hover:text-[color:var(--color-primary)]"
                          >
                            {{ item.title }}
                          </NuxtLink>
                          <span
                            v-else
                            class="block truncate text-sm font-semibold text-[color:var(--color-muted)] opacity-70"
                          >
                            {{ item.title }}
                          </span>
                        </template>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div class="flex items-center justify-between border-t px-6 py-5" style="border-color: var(--color-border)">
          <span class="text-sm font-semibold text-[color:var(--color-muted)]">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>

    <main class="px-5 pb-10 pt-8 sm:px-8 lg:px-12 lg:py-10">
      <div class="mx-auto max-w-7xl">
        <h1 class="hidden max-w-5xl text-5xl font-semibold leading-tight tracking-normal text-[color:var(--color-text)] sm:text-6xl lg:block">
          {{ pageTitle }}
        </h1>
        <p v-if="pageDescription" class="mt-6 hidden max-w-5xl text-xl leading-8 text-[color:var(--color-muted)] lg:block">
          {{ pageDescription }}
        </p>

        <div class="space-y-12 lg:mt-14 lg:space-y-16">
          <section v-if="isLevelRoot">
            <h2 class="text-2xl font-semibold tracking-normal text-[color:var(--color-text)] sm:text-3xl">
              Bagian Utama
            </h2>

            <div class="mt-5 grid gap-4 sm:gap-5 xl:grid-cols-2">
              <NuxtLink
                v-for="section in levelSectionCards"
                :key="section.key"
                :to="section.to"
                class="group relative flex min-h-28 flex-col justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:border-[color:var(--color-primary)] sm:min-h-32 sm:p-6"
              >
                <span class="absolute right-5 top-5 text-xl text-[color:var(--color-muted)] transition group-hover:text-[color:var(--color-primary)] sm:right-6 sm:top-6" aria-hidden="true">
                  ↗
                </span>
                <span class="text-base font-bold tabular-nums text-[color:var(--color-primary)] sm:text-lg">
                  {{ section.number }}
                </span>
                <h3 class="mt-5 pr-8 text-xl font-semibold leading-snug text-[color:var(--color-text)] sm:mt-6 sm:text-2xl">
                  {{ section.title }}
                </h3>
              </NuxtLink>
            </div>
          </section>

          <section
            v-else
            v-for="group in numberedWeekGroups"
            :id="`week-${group.week}`"
            :key="`week-${group.week}`"
          >
            <h2
              v-if="group.title"
              class="text-3xl font-semibold tracking-normal text-[color:var(--color-text)]"
            >
              {{ group.title }}
            </h2>

            <div
              class="mt-6 grid gap-4 sm:gap-5 lg:grid-cols-2 2xl:grid-cols-3"
              :class="group.title ? '' : 'mt-0'"
            >
              <LessonOutlineCard
                v-for="item in group.items"
                :key="`week-${group.week}-${item.number}`"
                :number="item.number"
                :title="item.title"
                :topic="item.topic"
                :topic-label="item.topicLabel"
                :week="item.week"
                :day="item.day"
                :enabled="item.enabled"
                :to="item.to"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  </section>

  <ClientOnly>
    <LessonSearch :scope-path="rootPath" />
  </ClientOnly>
  </div>
</template>
