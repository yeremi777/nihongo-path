<script setup lang="ts">
defineProps<{
  title?: string
  pattern?: string
}>()
</script>

<template>
  <div class="my-6 rounded-lg border bg-[color:var(--color-surface)] p-4" style="border-color: var(--color-border)">
    <p class="text-sm font-bold text-[color:var(--color-primary)]">{{ title || 'Grammar Pattern' }}</p>
    <pre v-if="pattern" class="mt-3 whitespace-pre-wrap rounded-md border p-3 font-japanese text-lg" style="border-color: var(--color-border)">{{ pattern }}</pre>
    <div class="mt-3 text-[color:var(--color-text)]">
      <slot />
    </div>
  </div>
</template>
