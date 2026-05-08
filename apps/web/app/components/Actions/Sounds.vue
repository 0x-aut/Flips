<script setup lang="ts">
import { CloudDownload } from "@lucide/vue";
</script>

<template>
  <section class="w-full h-full">
    <div class="flex justify-between items-center w-full px-1 py-1 h-8 border border-b-[#2e2e2e] border-t-0 border-l-0 border-r-0">
      <span class="font-sans font-light text-xs text-[#555555]">Sounds</span>
      <button class="flex items-center justify-center rounded-sm border border-[#2e2e2e] gap-x-1.5 px-2 py-0.5">
        <CloudDownload :size="13" color="#FFFFFF" :stroke-width="1.5" />
        <span class="font-sans text-xs text-[#FFFFFF] font-light">Add sound</span>
      </button>
    </div>
  </section>
</template>