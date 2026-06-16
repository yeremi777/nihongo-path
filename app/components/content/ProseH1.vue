<script setup lang="ts">
defineProps<{
  id?: string
}>()
</script>

<template>
  <ProseHeading :id="id" :level="1">
    <slot />
  </ProseHeading>
</template>
