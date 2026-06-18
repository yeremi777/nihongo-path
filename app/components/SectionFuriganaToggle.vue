<script setup lang="ts">
import type { FuriganaSectionKey } from '~/utils/furiganaSections'

const props = defineProps<{
  section: FuriganaSectionKey
}>()

const {
  sectionEnabled,
  loadingSection,
  error,
  restoreSectionPreferences,
  toggleSection
} = useFurigana()

const { applySection } = useFuriganaSection()

const enabled = computed(() => sectionEnabled.value[props.section])
const isLoading = computed(() => loadingSection.value === props.section)

const label = computed(() => {
  if (isLoading.value) return 'Loading furigana'
  if (error.value) return `Furigana unavailable: ${error.value}`
  return enabled.value ? 'Hide furigana' : 'Show furigana'
})

const syncSection = async () => {
  if (props.section === 'contoh-kalimat') {
    await nextTick()
    await applySection(props.section)
  }
}

onMounted(async () => {
  restoreSectionPreferences()
  if (enabled.value) {
    await syncSection()
  }
})

async function onToggle() {
  await toggleSection(props.section)
  await syncSection()
}
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      class="section-furigana-toggle"
      :class="{ 'section-furigana-toggle--on': enabled }"
      :aria-label="label"
      :title="label"
      :aria-pressed="enabled"
      :disabled="isLoading"
      @click="onToggle"
    >
      <svg
        v-if="isLoading"
        aria-hidden="true"
        class="section-furigana-toggle__icon animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 3a9 9 0 1 0 9 9" />
      </svg>
      <span v-else class="section-furigana-toggle__mark" aria-hidden="true">
        <span class="section-furigana-toggle__ruby">ふり</span>
        <span class="section-furigana-toggle__base">文</span>
      </span>
    </button>
    <template #fallback>
      <span class="section-furigana-toggle section-furigana-toggle--placeholder" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
