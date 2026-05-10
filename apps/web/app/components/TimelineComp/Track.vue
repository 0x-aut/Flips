<script setup lang="ts">
import { computed } from 'vue'
import { Volume2, VolumeX, Eye, EyeOff } from '@lucide/vue'
import { useTimelineStore } from '@/stores/timeline'

const props = defineProps<{
  trackId: string
  label: string
  type: 'video' | 'audio'
}>()

const timeline = useTimelineStore()
const track = computed(() => timeline.getTrack(props.trackId))

function clipStyle(clip: any) {
  const trimmedDuration = Math.max(
    0.5, // minimum 0.5s visible width
    (clip.duration - clip.trim.in - clip.trim.out) / clip.speed
  )
  return {
    left: (clip.startTime * timeline.zoom * 100) + 'px',
    width: (trimmedDuration * timeline.zoom * 100) + 'px',
  }
}
</script>

<template>
  <div class="flex w-full h-14 flex-shrink-0 border-b border-[#2e2e2e]/40">

    <!-- Clip strip -->
    <div class="relative flex-1 h-full overflow-visible">
      <div
        v-for="clip in track?.clips ?? []"
        :key="clip.id"
        class="absolute top-1 bottom-1 rounded-md border cursor-pointer select-none overflow-hidden group transition-opacity"
        :class="[
          clip.id === timeline.selectedClipId
            ? 'border-[#0099ff] bg-[#0099ff]/10'
            : 'border-[#3a3a3a] bg-[#252525] hover:border-[#4a4a4a]',
          track?.hidden ? 'opacity-30' : 'opacity-100'
        ]"
        :style="clipStyle(clip)"
        @click="timeline.selectClip(clip.id)"
      >
        {{ clip.name }} {{ clipStyle(clip) }}
        <!-- Video thumbnails -->
        <div v-if="type === 'video'" class="flex h-full w-full overflow-hidden">
          <img
            v-for="(frame, i) in clip.thumbnails"
            :key="i"
            :src="frame"
            class="h-full object-cover flex-shrink-0"
            style="width: 48px"
          />
          <div
            v-if="!clip.thumbnails.length"
            class="h-full w-full bg-[#2a2a2a] flex items-center justify-center"
          >
            <span class="text-[#444] font-sans text-[10px] truncate px-2">{{ clip.name }}</span>
          </div>
        </div>

        <!-- Audio waveform -->
        <div v-else class="h-full w-full flex items-center px-2">
          <div class="flex items-end gap-px h-4 w-full overflow-hidden">
            <div
              v-for="n in 80" :key="n"
              class="bg-[#0099ff]/60 rounded-full flex-shrink-0"
              style="width: 2px"
              :style="{ height: (30 + Math.random() * 70) + '%' }"
            />
          </div>
        </div>

        <!-- Hover label -->
        <div class="absolute top-1 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="text-white font-sans text-[10px] bg-black/50 px-1 rounded">
            {{ clip.name }}
          </span>
        </div>

        <!-- Trim handles -->
        <div class="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-[#0099ff]/40 rounded-l-md" />
        <div class="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-[#0099ff]/40 rounded-r-md" />
      </div>
    </div>
  </div>
</template>