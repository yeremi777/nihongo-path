<script setup lang="ts">
import { isFuriganaSectionKey } from '~/utils/furiganaSections'

const props = defineProps<{
  id?: string
}>()

const route = useRoute()

const furiganaSection = computed(() =>
  isFuriganaSectionKey(props.id) ? props.id : null
)

const showSectionFuriganaToggle = computed(() => {
  if (!furiganaSection.value) return false

  const parts = route.path.split('/').filter(Boolean)
  const section = parts[2]?.toLowerCase()
  return section === 'vocabulary' || section === 'grammar'
})
</script>

<template>
  <div
    class="prose-section-heading"
    :class="{ 'prose-section-heading--furigana': showSectionFuriganaToggle }"
  >
    <ProseHeading :id="id" :level="2">
      <slot />
    </ProseHeading>
    <SectionFuriganaToggle
      v-if="showSectionFuriganaToggle && furiganaSection"
      :section="furiganaSection"
    />
  </div>
</template>
