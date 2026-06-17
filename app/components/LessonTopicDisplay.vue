<script setup lang="ts">
const props = withDefaults(defineProps<{
  topic: string
  topicLabel: string
  week?: number
  day?: number
  variant?: 'header' | 'card' | 'nav'
  showSchedule?: boolean
}>(), {
  variant: 'header',
  showSchedule: true
})

const scheduleLabel = computed(() => {
  if (!props.showSchedule || props.variant === 'nav' || props.variant === 'card') return undefined

  if (typeof props.week === 'number' && typeof props.day === 'number') {
    return `Week ${props.week} · Day ${props.day}`
  }

  return undefined
})
</script>

<template>
  <div>
    <p
      v-if="scheduleLabel"
      class="font-medium tabular-nums text-[color:var(--color-muted)]"
      :class="variant === 'header' ? 'text-base tracking-wide sm:text-[1.0625rem]' : 'text-xs uppercase tracking-[0.14em]'"
    >
      {{ scheduleLabel }}
    </p>

    <component
      :is="variant === 'header' ? 'h1' : 'h3'"
      class="font-japanese font-semibold leading-tight tracking-normal text-[color:var(--color-text)]"
      :class="[
        variant === 'header' ? 'mt-0 max-w-5xl text-4xl sm:text-5xl lg:text-6xl' : '',
        variant === 'card' ? 'mt-1 text-xl leading-snug sm:text-2xl' : '',
        variant === 'nav' ? 'text-lg leading-snug' : '',
        scheduleLabel && variant !== 'header' ? '' : '',
        !scheduleLabel && variant === 'card' ? 'mt-1' : ''
      ]"
    >
      {{ topic }}
    </component>

    <p
      class="text-[color:var(--color-muted)]"
      :class="[
        variant === 'header' ? 'mt-1.5 max-w-4xl text-lg sm:text-xl' : '',
        variant === 'card' ? 'mt-1.5 text-sm leading-6' : '',
        variant === 'nav' ? 'mt-1 text-sm leading-6' : ''
      ]"
    >
      {{ topicLabel }}
    </p>
  </div>
</template>
