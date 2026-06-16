<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="my-6 rounded-lg border bg-[color:var(--color-primary-soft)]/50 p-4" style="border-color: var(--color-border)">
    <p class="font-bold text-[color:var(--color-primary)]">{{ title || 'Mini Practice' }}</p>
    <div class="mt-3 leading-7">
      <slot />
    </div>
  </div>
</template>
