<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')
const label = computed(() => isDark.value ? 'Switch to light theme' : 'Switch to dark theme')

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      class="inline-flex h-11 w-11 items-center justify-center rounded-md border bg-[color:var(--color-surface)] text-[color:var(--color-muted)] transition hover:text-[color:var(--color-text)]"
      style="border-color: var(--color-border)"
      :aria-label="label"
      :title="label"
      @click="toggleTheme"
    >
      <svg
        v-if="isDark"
        aria-hidden="true"
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      <svg
        v-else
        aria-hidden="true"
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z" />
      </svg>
    </button>
    <template #fallback>
      <button
        type="button"
        aria-label="Toggle theme"
        class="inline-flex h-11 w-11 items-center justify-center rounded-md border bg-[color:var(--color-surface)] text-[color:var(--color-muted)]"
        style="border-color: var(--color-border)"
      >
        <svg
          aria-hidden="true"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z" />
        </svg>
      </button>
    </template>
  </ClientOnly>
</template>
