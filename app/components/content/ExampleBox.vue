<script setup lang="ts">
defineProps<{
  japanese?: string
  english?: string
  indonesian?: string
}>()
</script>

<template>
  <div class="my-6 rounded-lg border bg-[color:var(--color-surface)] p-4" style="border-color: var(--color-border)">
    <p v-if="japanese" class="font-japanese text-xl leading-8 text-[color:var(--color-text)]">{{ japanese }}</p>
    <p v-if="english" class="mt-3 text-sm text-[color:var(--color-muted)]"><strong>English:</strong> {{ english }}</p>
    <p v-if="indonesian" class="mt-1 text-sm text-[color:var(--color-muted)]"><strong>Indonesian:</strong> {{ indonesian }}</p>
    <slot />
  </div>
</template>
