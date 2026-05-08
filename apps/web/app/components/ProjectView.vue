<script setup lang="ts">
import { ref, computed } from "vue"
import { Calendar, Ellipsis, Check } from "@lucide/vue"

const selected = ref(false)

const props = defineProps<{
  project: {
    id: number
    name: string
    ratio: string
    createdAt: number
  }
}>()

const emit = defineEmits<{
  open: [id: number]
}>()

const formattedDate = computed(() => {
  return new Date(props.project.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  )
})

function toggleSelected() {
  selected.value = !selected.value
}

function openProject() {
  emit("open", props.project.id)
}
</script>

<template>
  <div
    class="group relative flex flex-col gap-y-2 w-55 cursor-pointer"
  >

    <!-- Overlay -->
    <div
      class="absolute flex justify-between w-full px-2 py-2 z-50
             opacity-0 group-hover:opacity-100 transition duration-200"
    >

      <!-- Selection -->
      <button
        @click.stop="toggleSelected"
        class="h-4.75 w-4.75 rounded-md border flex items-center justify-center transition"
        :class="selected
          ? 'bg-[#2567EC] border-[#2567EC]'
          : 'border-[#555555] bg-[#121212]'"
      >
        <Check
          v-if="selected"
          :size="12"
          color="white"
          :stroke-width="3"
        />
      </button>

      <!-- Menu -->
      <button
        class="h-4.75 w-4.75 flex justify-center items-center bg-[#121212] rounded-md hover:bg-[#1a1a1a] transition-colors"
      >
        <Ellipsis
          :size="13"
          color="#FAFAFA"
          :stroke-width="1.5"
        />
      </button>
    </div>

    <!-- Thumbnail -->
    <div
      @click="openProject"
      class="rounded-2xl h-37.5 w-full bg-[#000000] border border-[#1f1f1f] overflow-hidden relative"
    >

      <!-- Fake preview -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]"
      />

      <!-- Ratio badge -->
      <div
        class="flex px-1.5 item-center justify-center absolute bottom-2 right-2 rounded-md bg-black/70 backdrop-blur-md border border-white/5"
      >
        <span class="text-[10px] text-[#d0d0d0] font-sans leading-snug">
          {{ project.ratio }}
        </span>
      </div>
    </div>

    <!-- Metadata -->
    <div class="flex flex-col gap-y-1">
      <span
        class="font-sans text-[#FAFAFA] text-xs font-medium truncate"
      >
        {{ project.name }}
      </span>

      <div class="flex gap-x-1 items-center">
        <Calendar
          :size="12"
          color="#555555"
          :stroke-width="1.5"
        />

        <span
          class="font-sans text-[#555555] leading-snug text-xs font-normal"
        >
          {{ formattedDate }}
        </span>
      </div>
    </div>

  </div>
</template>