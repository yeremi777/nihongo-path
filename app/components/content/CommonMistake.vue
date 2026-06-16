<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
    <p class="font-bold">{{ title || 'Common Mistake' }}</p>
    <div class="mt-2 leading-7">
      <slot />
    </div>
  </div>
</template>
