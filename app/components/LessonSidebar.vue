<script setup lang="ts">
const sections = [
  {
    level: 'N5',
    links: [
      { label: 'Kana', to: '/learn/n5/kana/hiragana' },
      { label: 'Kanji', to: '/learn/n5/kanji' },
      { label: 'Vocabulary', to: '/learn/n5/vocabulary' },
      { label: 'Grammar', to: '/learn/n5/grammar' }
    ]
  },
  {
    level: 'N4',
    links: [
      { label: 'Kanji', to: '/learn/n4/kanji' },
      { label: 'Vocabulary', to: '/learn/n4/vocabulary' },
      { label: 'Grammar', to: '/learn/n4/grammar' }
    ]
  },
  {
    level: 'N3',
    links: [
      { label: 'Kanji', to: '/learn/n3/kanji' },
      { label: 'Vocabulary', to: '/learn/n3/vocabulary' },
      { label: 'Grammar', to: '/learn/n3/grammar' }
    ]
  }
]
</script>

<template>
  <aside class="lg:sticky lg:top-20">
    <nav class="rounded-lg border bg-[color:var(--color-surface)] p-4" style="border-color: var(--color-border)" aria-label="Lesson navigation">
      <NuxtLink to="/learn" class="mb-4 block text-sm font-bold text-[color:var(--color-primary)]">JLPT Learning Path</NuxtLink>
      <div class="space-y-5">
        <section v-for="section in sections" :key="section.level">
          <div class="mb-2 flex items-center gap-2">
            <LevelBadge :level="section.level" />
          </div>
          <ul class="space-y-1">
            <li v-for="link in section.links" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="block rounded-md px-2 py-1.5 text-sm text-[color:var(--color-muted)] hover:bg-[color:var(--color-primary-soft)] hover:text-[color:var(--color-primary)]"
                active-class="bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)] font-semibold"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </nav>
  </aside>
</template>
