<template>
  <header class="sticky top-0 z-30 border-b bg-[color:var(--color-bg)]/92 backdrop-blur" style="border-color: var(--color-border)">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="flex items-center gap-3 text-base font-semibold tracking-normal">
        <span class="flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--color-primary)] font-bold text-white">日</span>
        <span>Nihongo Path</span>
      </NuxtLink>

      <nav class="hidden items-center gap-1 text-sm font-medium text-[color:var(--color-muted)] sm:flex">
        <NuxtLink class="rounded-md px-3 py-2 hover:bg-[color:var(--color-primary-soft)] hover:text-[color:var(--color-primary)]" to="/learn">Learn</NuxtLink>
        <NuxtLink class="rounded-md px-3 py-2 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300" to="/learn/n5">N5</NuxtLink>
        <NuxtLink class="rounded-md px-3 py-2 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-950 dark:hover:text-sky-300" to="/learn/n4">N4</NuxtLink>
        <NuxtLink class="rounded-md px-3 py-2 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-950 dark:hover:text-violet-300" to="/learn/n3">N3</NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <ThemeToggle />
        <NuxtLink to="/learn" class="rounded-md border px-3 py-2 text-sm font-semibold text-[color:var(--color-primary)] sm:hidden" style="border-color: var(--color-border)">
          Learn
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
