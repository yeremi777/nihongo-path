<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  level?: 'N5' | 'N4' | 'N3' | string
  category?: string
  status?: string
  meta?: string
  to: string
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="group relative flex min-h-44 flex-col rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 transition hover:border-[color:var(--color-primary)] md:min-h-48"
  >
    <span class="absolute right-6 top-6 text-2xl leading-none text-[color:var(--color-muted)] transition group-hover:text-[color:var(--color-primary)]" aria-hidden="true">↗</span>
    <p class="pr-8 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
      {{ meta || category || level }}
    </p>
    <h3 class="mt-8 max-w-xl text-2xl font-semibold leading-tight tracking-normal text-[color:var(--color-text)]">
      {{ title }}
    </h3>
    <p v-if="description" class="mt-4 max-w-2xl text-base leading-7 text-[color:var(--color-muted)]">
      {{ description }}
    </p>
  </NuxtLink>
</template>
