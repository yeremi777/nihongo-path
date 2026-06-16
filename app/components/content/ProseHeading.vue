<script setup lang="ts">
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const props = defineProps<{
  id?: string
  level: HeadingLevel
}>()

const tag = computed(() => `h${props.level}`)

const showAnchor = computed(() => {
  if (!props.id) return false

  const { headings } = useRuntimeConfig().public.mdc
  const anchorLinks = headings?.anchorLinks
  const key = `h${props.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  if (typeof anchorLinks === 'boolean') {
    return anchorLinks
  }

  return Boolean(anchorLinks?.[key])
})
</script>

<template>
  <component :is="tag" :id="id" class="prose-heading group">
    <span class="prose-heading-text">
      <slot />
    </span>
    <a
      v-if="id && showAnchor"
      :href="`#${id}`"
      class="prose-heading-anchor"
      aria-label="Link to this section"
    >
      #
    </a>
  </component>
</template>
