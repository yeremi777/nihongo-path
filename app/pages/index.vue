<script setup lang="ts">
import { levelTracks } from '~/utils/levelTracks'

useSeoMeta({
  title: 'Nihongo Path',
  description: '一緒に勉強しましょう。'
})

useHead({
  titleTemplate: '%s'
})
</script>

<template>
  <section class="min-h-screen px-5 py-10 sm:px-8 lg:px-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex items-start justify-between gap-6">
        <div>
          <h1 class="font-japanese text-[clamp(3.15rem,13.5vw,6rem)] font-semibold leading-[1.08] tracking-normal text-[color:var(--color-primary)] sm:text-7xl lg:text-8xl">
            日本語の道
          </h1>
          <p class="mt-8 max-w-2xl whitespace-nowrap font-japanese text-[clamp(1.45rem,6.1vw,2.25rem)] leading-relaxed text-[color:var(--color-muted)] sm:text-4xl">
            一緒に勉強しましょう。
          </p>
        </div>

        <ThemeToggle />
      </div>

      <div class="mt-16 grid gap-6 lg:grid-cols-2">
        <LessonCard
          v-for="track in levelTracks"
          :key="track.to"
          :title="track.title"
          :description="track.description"
          :meta="track.meta"
          :to="track.to"
        />
      </div>
    </div>
  </section>
</template>
