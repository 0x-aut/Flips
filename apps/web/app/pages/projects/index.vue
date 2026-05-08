<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";
</script>

<template>
  <main class="mr-8.25 ml-8.25 mt-4 flex flex-col gap-y-10">
    <nav class="flex w-full items-center justify-between">
      <span class="font-sans text-white flex gap-x-2 items-center">
        <NuxtLink to="/" class="text-[#555555] font-medium text-sm leading-snug">Home</NuxtLink>
        <ChevronRight :size="13" color="#555555" :stroke-width="1.5" />
        <span class="text-sm font-medium leading-snug">All Projects</span>
      </span>
      <div class="flex items-center">
        <button class="flex items-center gap-x-1 justify-center pl-3 pr-3 pt-1 pb-1 bg-[#FAFAFA] rounded-lg">
          <span class="font-sans text-sm text-[#121212] font-medium leading-snug">New project</span>
        </button>
      </div>
    </nav>
    <!-- Selection and options section and projects section -->
    <section>
      <div class="flex gap-x-2">
        <ProjectView />
      </div>
    </section>
  </main>
</template>