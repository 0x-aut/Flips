<script setup lang="ts">
useSeoMeta({
  title: "Flips"
})
const { getOrCreateToken } = useIdentity();

onMounted(() => {
  getOrCreateToken();
})

</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
