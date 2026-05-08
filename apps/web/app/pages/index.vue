<script setup lang="ts">
import { ArrowRight } from "@lucide/vue";
</script>

<template>
  <main class="flex flex-col gap-y-2 justify-center items-center h-screen w-screen">
    <div class="flex flex-col gap-y-3 items-center">
      <div class="flex flex-col gap-y-1 items-center">
        <span class="font-sans text-6xl font-semibold text-[#FFFFFF]">Your AI video editor</span>
        <span class="font-sans text-md text-[#555555]">An AI video editor that generates, edits and exports video for whatever category you want</span>
      </div>
      <NuxtLink to="/projects" class="flex items-center gap-x-1 justify-center pl-3 pr-3 pt-2 pb-2 bg-[#FAFAFA] rounded-lg">
        <span class="font-sans text-sm text-[#121212] font-medium leading-snug">Try early beta</span>
        <ArrowRight :size="13" color="#121212" :stroke-width="1.5" />
      </NuxtLink>
    </div>
  </main>
</template>