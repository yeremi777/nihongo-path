<script setup lang="ts">
import { decodePracticeHtml, hasJapaneseKanji } from '~/utils/japaneseText'

const props = defineProps<{
  question: string
  sentence?: string
  optionA: string
  optionB: string
  correct: string
  explanation: string
}>()

const { sectionEnabled, toFuriganaHtml } = useFurigana()

const miniPracticeFurigana = computed(() => sectionEnabled.value['mini-practice'])

const selected = ref<string | null>(null)
const displaySentence = ref('')
const displayOptionA = ref('')
const displayOptionB = ref('')

const displayOptions = computed(() => {
  const seed = [
    props.question,
    props.sentence ?? '',
    props.optionA,
    props.optionB,
  ].join('|')

  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  return hash % 2 === 0
    ? [props.optionA, props.optionB]
    : [props.optionB, props.optionA]
})

const isAnswered = computed(() => selected.value !== null)
const isCorrect = computed(() => selected.value === props.correct)

const renderPlainText = (value: string) => decodePracticeHtml(value)

const renderJapaneseField = async (value: string, target: { value: string }) => {
  if (!value) {
    target.value = ''
    return
  }

  if (!miniPracticeFurigana.value || !hasJapaneseKanji(value)) {
    target.value = renderPlainText(value)
    return
  }

  target.value = await toFuriganaHtml(value)
}

const refreshJapaneseFields = async () => {
  await Promise.all([
    renderJapaneseField(props.sentence ?? '', displaySentence),
    renderJapaneseField(props.optionA, displayOptionA),
    renderJapaneseField(props.optionB, displayOptionB)
  ])
}

watch(
  () => [miniPracticeFurigana.value, props.sentence, props.optionA, props.optionB] as const,
  () => {
    refreshJapaneseFields()
  },
  { immediate: true }
)

const cardClass = computed(() => {
  if (!isAnswered.value) {
    return 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]'
  }

  return isCorrect.value
    ? 'border-emerald-400 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-50'
    : 'border-red-400 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950/35 dark:text-red-50'
})

const optionClass = (option: string) => {
  const base = 'rounded-md border px-3 py-2 text-left font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[color:var(--color-bg)]'

  if (!isAnswered.value) {
    return `${base} border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)]`
  }

  if (option === selected.value && option === props.correct) {
    return `${base} border-emerald-500 bg-emerald-600 text-white focus:ring-emerald-500`
  }

  if (option === selected.value) {
    return `${base} border-red-500 bg-red-600 text-white focus:ring-red-500`
  }

  if (option === props.correct) {
    return `${base} border-emerald-400 bg-emerald-100 text-emerald-950 dark:bg-emerald-900/55 dark:text-emerald-50 focus:ring-emerald-500`
  }

  return `${base} border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)] opacity-75`
}

const optionHtml = (option: string) => {
  if (option === props.optionA) return displayOptionA.value || renderPlainText(option)
  if (option === props.optionB) return displayOptionB.value || renderPlainText(option)
  return renderPlainText(option)
}
</script>

<template>
  <section
    class="lesson-practice rounded-lg border p-4 transition-colors"
    :class="cardClass"
  >
    <p class="font-bold leading-7">
      {{ question }}
    </p>
    <p
      v-if="sentence"
      class="mt-2 font-japanese text-lg font-bold leading-8"
      v-html="displaySentence || renderPlainText(sentence)"
    />

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <button
        v-for="option in displayOptions"
        :key="option"
        type="button"
        :class="optionClass(option)"
        :aria-pressed="selected === option"
        @click="selected = option"
      >
        <span v-html="optionHtml(option)" />
      </button>
    </div>

    <div
      v-if="isAnswered"
      class="mt-4 border-t pt-3"
      :class="isCorrect ? 'border-emerald-300 dark:border-emerald-800' : 'border-red-300 dark:border-red-800'"
    >
      <p class="font-bold">
        <span v-if="isCorrect">Correct (✓)</span>
        <span v-else>Incorrect (×)</span>
      </p>
      <p class="mt-1 leading-7">
        {{ explanation }}
      </p>
    </div>
  </section>
</template>
