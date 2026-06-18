import {
  decodePracticeHtml,
  hasJapaneseKanji,
  hasRubyMarkup,
  stripHtmlTags
} from '~/utils/japaneseText'
import type { FuriganaSectionKey } from '~/utils/furiganaSections'
import { FURIGANA_SECTION_KEYS } from '~/utils/furiganaSections'

const conversionCache = new Map<string, string>()

const createSectionState = () =>
  Object.fromEntries(FURIGANA_SECTION_KEYS.map((key) => [key, false])) as Record<FuriganaSectionKey, boolean>

export const useFurigana = () => {
  const sectionEnabled = useState<Record<FuriganaSectionKey, boolean>>(
    'furigana-section-enabled',
    createSectionState
  )
  const ready = useState('furigana-ready', () => false)
  const loading = useState('furigana-loading', () => false)
  const loadingSection = useState<FuriganaSectionKey | null>('furigana-loading-section', () => null)
  const error = useState<string | null>('furigana-error', () => null)

  const storageKey = (section: FuriganaSectionKey) => `nihongo-path:furigana:${section}`

  const restoreSectionPreferences = () => {
    if (!import.meta.client) return

    for (const section of FURIGANA_SECTION_KEYS) {
      sectionEnabled.value[section] = localStorage.getItem(storageKey(section)) === '1'
    }
  }

  const persistSectionPreference = (section: FuriganaSectionKey, value: boolean) => {
    if (!import.meta.client) return
    localStorage.setItem(storageKey(section), value ? '1' : '0')
  }

  const ensureReady = async () => {
    if (ready.value) return true
    if (loading.value) {
      while (loading.value) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      return !error.value
    }

    loading.value = true
    error.value = null

    try {
      await $fetch('/api/furigana', {
        method: 'POST',
        body: { text: '試す' }
      })
      ready.value = true
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Failed to load furigana engine'
      return false
    } finally {
      loading.value = false
    }
  }

  const toFuriganaHtml = async (raw: string) => {
    const value = raw.trim()
    if (!value) return ''

    if (hasRubyMarkup(value)) {
      return decodePracticeHtml(value)
    }

    const plain = stripHtmlTags(value)
    if (!hasJapaneseKanji(plain)) {
      return decodePracticeHtml(value)
    }

    if (conversionCache.has(plain)) {
      return conversionCache.get(plain)!
    }

    const isReady = await ensureReady()
    if (!isReady) {
      return decodePracticeHtml(value)
    }

    try {
      const response = await $fetch<{ html: string }>('/api/furigana', {
        method: 'POST',
        body: { text: plain }
      })

      const html = response.html || plain
      conversionCache.set(plain, html)
      return html
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Furigana conversion failed'
      return decodePracticeHtml(value)
    }
  }

  const toFuriganaHtmlBatch = async (items: string[]) => {
    const results = new Map<string, string>()

    for (const raw of items) {
      const value = raw.trim()
      if (!value) {
        results.set(raw, '')
        continue
      }

      if (hasRubyMarkup(value)) {
        results.set(raw, decodePracticeHtml(value))
        continue
      }

      const plain = stripHtmlTags(value)
      if (!hasJapaneseKanji(plain)) {
        results.set(raw, decodePracticeHtml(value))
        continue
      }

      if (conversionCache.has(plain)) {
        results.set(raw, conversionCache.get(plain)!)
      }
    }

    const pending = items
      .map((raw) => raw.trim())
      .filter((plain) => {
        if (!plain || !hasJapaneseKanji(stripHtmlTags(plain)) || hasRubyMarkup(plain)) {
          return false
        }
        return !conversionCache.has(stripHtmlTags(plain))
      })
      .map((plain) => stripHtmlTags(plain))

    const uniquePending = [...new Set(pending)]

    if (uniquePending.length > 0) {
      const isReady = await ensureReady()
      if (!isReady) {
        for (const raw of items) {
          if (!results.has(raw)) {
            results.set(raw, decodePracticeHtml(raw))
          }
        }
        return results
      }

      try {
        const response = await $fetch<{ html: string[] }>('/api/furigana', {
          method: 'POST',
          body: { texts: uniquePending }
        })

        const converted = Array.isArray(response.html) ? response.html : []
        uniquePending.forEach((plain, index) => {
          const html = converted[index] || plain
          conversionCache.set(plain, html)
        })
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Furigana conversion failed'
      }
    }

    for (const raw of items) {
      if (results.has(raw)) continue

      const plain = stripHtmlTags(raw.trim())
      results.set(raw, conversionCache.get(plain) || decodePracticeHtml(raw))
    }

    return results
  }

  const toggleSection = async (section: FuriganaSectionKey) => {
    const next = !sectionEnabled.value[section]
    sectionEnabled.value = {
      ...sectionEnabled.value,
      [section]: next
    }
    persistSectionPreference(section, next)

    if (next) {
      loadingSection.value = section
      try {
        await ensureReady()
      } finally {
        loadingSection.value = null
      }
    }
  }

  return {
    sectionEnabled,
    ready,
    loading,
    loadingSection,
    error,
    restoreSectionPreferences,
    toFuriganaHtml,
    toFuriganaHtmlBatch,
    toggleSection
  }
}
