<script setup lang="ts">
import { Plus } from "@lucide/vue";
</script>

<template>
  <section class="w-full h-full">
    <div class="flex justify-between items-center w-full px-1 py-1 h-8 border border-b-[#2e2e2e] border-t-0 border-l-0 border-r-0">
      <span class="font-sans font-light text-xs text-[#555555]">Captions</span>
      <button class="flex items-center justify-center rounded-sm border border-[#2e2e2e] gap-x-1.5 px-2 py-0.5">
        <Plus :size="13" color="#FFFFFF" :stroke-width="1.5" />
        <span class="font-sans text-xs text-[#FFFFFF] font-light">Generate Captions</span>
      </button>
    </div>
    <!-- This will contain the caption timestamps and the text with the timestamps at the top and text below -->
    <section class="h-[90%] overflow-y-scroll noscrollbar flex flex-col gap-x-0.5">
      <!-- We will make this a component later -->
      <div class="flex flex-col w-full px-1 py-0.75 gap-y-1 hover:bg-[#2e2e2e] cursor-pointer">
        <!-- Timeline -->
        <span class="flex items-center gap-x-1.25 font-sans font-normal text-xs text-[#555555]">
          <text class="text-[#2567EC] opacity-70">0:00</text>
          to
          <text class="text-[#2567EC] opacity-70">0:03</text>
        </span>
        <!-- Caption Text -->
        <span class="text-xs text-[#FAFAFA] font-sans font-normal leading-snug">This is a text for a video that contains captions generated from a runwayml model via api</span>
      </div>
    </section>
  </section>
</template>