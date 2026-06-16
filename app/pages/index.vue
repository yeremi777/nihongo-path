<script setup lang="ts">
useSeoMeta({
  title: 'Nihongo Path',
  description: '一緒に勉強しましょう。'
})

useHead({
  titleTemplate: '%s'
})

const tracks = [
  {
    title: 'N5',
    description: 'Mulai dari kana, kanji dasar, kosakata, dan pola kalimat sederhana untuk membangun fondasi yang kuat.',
    meta: '4 sections',
    to: '/learn/n5'
  },
  {
    title: 'N4',
    description: 'Perkuat kanji dan kosakata sebelum masuk ke pola bahasa sehari-hari.',
    meta: '3 sections',
    to: '/learn/n4'
  },
  {
    title: 'N3',
    description: 'Bangun kemampuan menengah lewat kanji, kosakata, dan grammar bernuansa.',
    meta: '3 sections',
    to: '/learn/n3'
  }
]
</script>

<template>
  <section class="min-h-screen px-5 py-10 sm:px-8 lg:px-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex items-start justify-between gap-6">
        <div>
          <h1 class="font-japanese text-6xl font-semibold leading-tight tracking-normal text-[color:var(--color-primary)] sm:text-7xl lg:text-8xl">
            日本語の道
          </h1>
          <p class="mt-8 max-w-2xl font-japanese text-3xl leading-relaxed text-[color:var(--color-muted)] sm:text-4xl">
            一緒に勉強しましょう。
          </p>
        </div>

        <ThemeToggle />
      </div>

      <div class="mt-16 grid gap-6 lg:grid-cols-2">
        <LessonCard
          v-for="track in tracks"
          :key="track.to"
          v-bind="track"
        />
      </div>
    </div>
  </section>
</template>
