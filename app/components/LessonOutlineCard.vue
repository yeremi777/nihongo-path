<script setup lang="ts">
const props = defineProps<{
  number: string
  title: string
  topic?: string
  topicLabel?: string
  week?: number
  day?: number
  enabled?: boolean
  to?: string
}>()

const NuxtLink = resolveComponent('NuxtLink')

const isClickable = computed(() => Boolean(props.enabled && props.to))

const hasTopic = computed(() => Boolean(props.topic && props.topicLabel))

const scheduleLabel = computed(() => {
  if (typeof props.week === 'number' && typeof props.day === 'number') {
    return `Week ${props.week} · Day ${props.day}`
  }

  if (typeof props.day === 'number') {
    return `Day ${props.day}`
  }

  return undefined
})
</script>

<template>
  <component
    :is="isClickable ? NuxtLink : 'div'"
    :to="isClickable ? to : undefined"
    class="group flex min-h-[8.5rem] flex-col rounded-lg border bg-[color:var(--color-surface)] p-5 transition sm:min-h-[9rem] sm:p-6"
    :class="isClickable
      ? 'border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]'
      : 'border-[color:var(--color-border)] opacity-70'"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span class="text-lg font-bold tabular-nums text-[color:var(--color-primary)]">
          {{ number }}
        </span>
        <span
          v-if="scheduleLabel"
          class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]"
        >
          {{ scheduleLabel }}
        </span>
      </div>

      <span
        class="shrink-0 pt-0.5 text-xl leading-none text-[color:var(--color-muted)] transition"
        :class="isClickable ? 'group-hover:text-[color:var(--color-primary)]' : ''"
        aria-hidden="true"
      >
        {{ isClickable ? '↗' : '·' }}
      </span>
    </div>

    <div class="mt-auto pt-5">
      <template v-if="hasTopic">
        <h3 class="font-japanese text-xl font-semibold leading-snug text-[color:var(--color-text)] sm:text-2xl">
          {{ topic }}
        </h3>
        <p class="mt-1.5 text-sm leading-6 text-[color:var(--color-muted)]">
          {{ topicLabel }}
        </p>
      </template>

      <h3
        v-else
        class="text-xl font-semibold leading-snug text-[color:var(--color-text)]"
      >
        {{ title }}
      </h3>
    </div>
  </component>
</template>
