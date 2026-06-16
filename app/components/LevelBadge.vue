<script setup lang="ts">
const props = defineProps<{
  level?: 'N5' | 'N4' | 'N3' | string
}>()

const classes = computed(() => {
  switch (props.level) {
    case 'N5':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800'
    case 'N4':
      return 'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800'
    case 'N3':
      return 'bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-800'
    default:
      return 'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700'
  }
})
</script>

<template>
  <span class="inline-flex items-center rounded px-2 py-1 text-xs font-bold ring-1" :class="classes">
    {{ level || 'JLPT' }}
  </span>
</template>
