<script setup lang="ts">
defineProps<{
  id?: string
}>()
</script>

<template>
  <ProseHeading :id="id" :level="6">
    <slot />
  </ProseHeading>
</template>
