<script setup lang="ts">
import type { SearchResult } from '#content/types'

const props = defineProps<{
  scopePath: string
}>()

const router = useRouter()
const { isOpen, close, open, anchorRect, fallbackPlacement } = useLessonSearch()

const query = ref('')
const results = ref<SearchResult[]>([])
const activeIndex = ref(0)
const isSearching = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const { search } = useSearchCollection('content')

let searchTimer: ReturnType<typeof setTimeout> | null = null

const panelStyle = computed(() => {
  if (typeof window === 'undefined') {
    return {}
  }

  const panelMaxWidth = 384
  const gap = 8
  const viewportPadding = 16

  if (anchorRect.value) {
    const anchor = anchorRect.value
    const width = Math.min(panelMaxWidth, window.innerWidth - viewportPadding * 2)
    const useRightAlign = anchor.right > window.innerWidth * 0.55
    const left = useRightAlign
      ? Math.max(viewportPadding, anchor.right - width)
      : Math.max(viewportPadding, Math.min(anchor.left, window.innerWidth - width - viewportPadding))
    const maxHeight = Math.max(192, window.innerHeight - anchor.top - gap - viewportPadding)

    return {
      top: `${anchor.top + gap}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`
    }
  }

  const width = Math.min(panelMaxWidth, window.innerWidth - viewportPadding * 2)

  if (fallbackPlacement.value === 'toolbar') {
    return {
      top: '4.75rem',
      right: '1rem',
      left: 'auto',
      width: `${width}px`,
      maxHeight: 'calc(100vh - 6.25rem)'
    }
  }

  return {
    top: '9.5rem',
    left: '1rem',
    right: 'auto',
    width: `${Math.min(width, 320)}px`,
    maxHeight: 'calc(100vh - 11rem)'
  }
})

const hasQuery = computed(() => query.value.trim().length > 0)
const canSearch = computed(() => query.value.trim().length >= 2)

const resultMeta = (result: SearchResult) => {
  const path = result.id.split('#')[0] || ''
  const segments = path.replace(/^\/learn\//, '').split('/').filter(Boolean)

  if (segments.length >= 3) {
    return `${segments[0]?.toUpperCase()} · ${segments[1]} · ${segments[2]}`
  }

  if (segments.length === 2) {
    return `${segments[0]?.toUpperCase()} · ${segments[1]}`
  }

  const titles = result.titles.filter(Boolean)
  return titles.length ? titles.join(' · ') : path
}

const resultSnippet = (result: SearchResult) => {
  return result.snippets?.content || result.snippets?.title || result.content
}

const runSearch = async (value: string) => {
  const term = value.trim()

  if (term.length < 2) {
    results.value = []
    activeIndex.value = 0
    isSearching.value = false
    return
  }

  isSearching.value = true

  try {
    const matches = await search(term, {
      limit: 24,
      minTermLength: 2,
      snippet: {
        columns: ['content', 'title'],
        around: 24,
        tag: 'mark'
      }
    })

    results.value = matches.filter((result) => result.id.startsWith(props.scopePath))
    activeIndex.value = 0
  } finally {
    isSearching.value = false
  }
}

watch(query, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  if (value.trim().length < 2) {
    results.value = []
    activeIndex.value = 0
    isSearching.value = false
    return
  }

  isSearching.value = true
  searchTimer = setTimeout(() => {
    runSearch(value)
  }, 200)
})

watch(isOpen, (open) => {
  if (!open) {
    query.value = ''
    results.value = []
    activeIndex.value = 0
    isSearching.value = false
    return
  }

  nextTick(() => {
    inputRef.value?.focus()
  })
})

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

const navigateToResult = async (result: SearchResult) => {
  close()
  await router.push(result.id)
}

const onGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === '/' && !isOpen.value && !isTypingTarget(event.target)) {
    event.preventDefault()
    open()
    return
  }

  if (!isOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'ArrowDown' && results.value.length) {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
    return
  }

  if (event.key === 'ArrowUp' && results.value.length) {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    return
  }

  if (event.key === 'Enter' && results.value[activeIndex.value]) {
    event.preventDefault()
    navigateToResult(results.value[activeIndex.value])
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="lesson-search-overlay fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]"
      @click.self="close"
    >
      <div
        class="lesson-search-panel fixed flex flex-col overflow-hidden rounded-2xl border bg-[color:var(--color-surface)] shadow-2xl"
        :style="panelStyle"
        style="border-color: var(--color-border)"
        role="dialog"
        aria-modal="true"
        aria-label="Search lessons"
      >
        <div class="flex items-center gap-3 border-b px-4 py-3" style="border-color: var(--color-border)">
          <svg aria-hidden="true" class="h-5 w-5 shrink-0 text-[color:var(--color-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            ref="inputRef"
            v-model="query"
            type="search"
            class="min-w-0 flex-1 bg-transparent text-base text-[color:var(--color-text)] outline-none placeholder:text-[color:var(--color-muted)]"
            placeholder="Search chapters, indices..."
            autocomplete="off"
            spellcheck="false"
          >

          <button
            type="button"
            class="rounded-md border px-2 py-1 text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-text)]"
            style="border-color: var(--color-border)"
            aria-label="Close search"
            @click="close"
          >
            Esc
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <p
            v-if="!hasQuery"
            class="py-8 text-center text-sm text-[color:var(--color-muted)]"
          >
            Type at least 2 characters to search.
          </p>

          <p
            v-else-if="hasQuery && !canSearch"
            class="py-8 text-center text-sm text-[color:var(--color-muted)]"
          >
            Type at least 2 characters to search.
          </p>

          <p
            v-else-if="isSearching"
            class="py-8 text-center text-sm text-[color:var(--color-muted)]"
          >
            Searching...
          </p>

          <p
            v-else-if="canSearch && !results.length"
            class="py-8 text-center text-sm text-[color:var(--color-muted)]"
          >
            No results found.
          </p>

          <ul v-else class="space-y-1">
            <li
              v-for="(result, index) in results"
              :key="result.id"
            >
              <button
                type="button"
                class="lesson-search-result w-full rounded-xl border px-4 py-3 text-left transition"
                :class="index === activeIndex
                  ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)]/35'
                  : 'border-transparent hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-bg)]'"
                @click="navigateToResult(result)"
                @mouseenter="activeIndex = index"
              >
                <p class="text-sm font-semibold text-[color:var(--color-text)]">
                  {{ result.title || 'Untitled' }}
                </p>
                <p class="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                  {{ resultMeta(result) }}
                </p>
                <p
                  v-if="resultSnippet(result)"
                  class="lesson-search-snippet mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--color-muted)]"
                  v-html="resultSnippet(result)"
                />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lesson-search-snippet :deep(mark) {
  border-radius: 0.2rem;
  background: color-mix(in srgb, var(--color-primary-soft) 80%, transparent);
  color: var(--color-text);
  padding: 0 0.15rem;
}
</style>
