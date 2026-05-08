<script setup lang="ts">
import { ref } from "vue"
import { Calendar, Ellipsis, Check } from "@lucide/vue"

const selected = ref(false)

function alertMe() {
  alert("Alert")
}

function outerAlert() {
  selected.value = !selected.value
}
</script>

<template>
  <div
    @click="outerAlert"
    class="group relative flex justify-left gap-y-2 flex-col w-55 cursor-pointer"
  >
    <!-- TOP OVERLAY (HIDDEN UNTIL HOVER) -->
    <div
      class="absolute flex justify-between w-full px-2 py-2 z-50
             opacity-0 group-hover:opacity-100 transition duration-200"
    >
      <!-- RADIO -->
      <div
        @click.stop="selected = !selected"
        class="h-4.75 w-4.75 rounded-md border flex items-center justify-center transition"
        :class="selected
          ? 'bg-blue-500 border-blue-500'
          : 'border-[#555555] bg-[#121212]'"
      >
        <Check
          v-if="selected"
          :size="12"
          color="white"
          :stroke-width="3"
        />
      </div>

      <!-- ELLIPSIS -->
      <button
        @click.stop="alertMe"
        class="h-4.75 w-4.75 flex justify-center items-center bg-[#121212] rounded-md"
      >
        <Ellipsis :size="13" color="#FAFAFA" :stroke-width="1.5" />
      </button>
    </div>

    <!-- THUMBNAIL -->
    <div class="rounded-2xl h-37.5 w-full bg-[#000000]"></div>

    <!-- META -->
    <div class="flex flex-col gap-y-1">
      <span class="font-sans text-[#FAFAFA] text-xs font-medium">
        New project
      </span>

      <div class="flex gap-x-1 items-center">
        <Calendar :size="12" color="#555555" :stroke-width="1.5" />
        <span class="font-sans text-[#555555] leading-snug text-xs font-normal">
          Created May 1st
        </span>
      </div>
    </div>
  </div>
</template>