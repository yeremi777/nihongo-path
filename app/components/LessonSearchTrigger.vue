<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'field' | 'compact'
  label?: string
}>(), {
  variant: 'field',
  label: 'Search lessons'
})

const { open } = useLessonSearch()
const triggerRef = ref<HTMLElement | null>(null)

const handleOpen = () => {
  open(triggerRef.value)
}
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    :aria-label="label"
    :class="variant === 'compact'
      ? 'inline-flex h-11 w-11 items-center justify-center rounded-md border bg-[color:var(--color-surface)] text-[color:var(--color-muted)] transition hover:text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]'
      : 'flex h-12 w-full items-center gap-3 rounded-md border px-4 text-left text-[color:var(--color-muted)] transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]'"
    style="border-color: var(--color-border)"
    @click="handleOpen"
  >
    <svg aria-hidden="true" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>

    <template v-if="variant === 'field'">
      <span class="text-base">Search...</span>
      <span class="ml-auto rounded border px-2 py-0.5 text-sm" style="border-color: var(--color-border)">/</span>
    </template>
  </button>
</template>
