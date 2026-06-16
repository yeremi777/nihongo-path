<script setup lang="ts">
defineProps<{
  main?: string[]
  extra?: string[]
}>()
</script>

<template>
  <div class="my-6 rounded-lg border bg-[color:var(--color-surface)] p-4" style="border-color: var(--color-border)">
    <p class="font-bold text-[color:var(--color-text)]">References</p>
    <div v-if="main?.length" class="mt-3">
      <p class="text-sm font-semibold text-[color:var(--color-muted)]">Main reference</p>
      <ul class="mt-1 list-disc pl-5">
        <li v-for="item in main" :key="item">{{ item }}</li>
      </ul>
    </div>
    <div v-if="extra?.length" class="mt-3">
      <p class="text-sm font-semibold text-[color:var(--color-muted)]">Additional reference</p>
      <ul class="mt-1 list-disc pl-5">
        <li v-for="item in extra" :key="item">{{ item }}</li>
      </ul>
    </div>
    <slot />
  </div>
</template>
