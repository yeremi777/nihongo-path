<script setup lang="ts">
defineProps<{
  id?: string
}>()
</script>

<template>
  <ProseHeading :id="id" :level="5">
    <slot />
  </ProseHeading>
</template>
