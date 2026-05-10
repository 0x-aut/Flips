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
    0.5,
    (clip.duration - clip.trim.in - clip.trim.out) / clip.speed
  )
  return {
    left: (clip.startTime * timeline.zoom * 100) + 'px',
    width: (trimmedDuration * timeline.zoom * 100) + 'px',
  }
}
</script>

<template>
  <div
    class="relative w-full flex-shrink-0 border-b border-[#2e2e2e]/40"
    :class="type === 'video' ? 'h-16' : 'h-10'"
  >
    <!-- empty state hint -->
    <div
      v-if="!track?.clips.length"
      class="absolute inset-0 flex items-center px-3 pointer-events-none"
    >
      <span class="text-[#252525] font-sans text-[10px] select-none">
        {{ label }}
      </span>
    </div>

    <!-- clips -->
    <div
      v-for="clip in track?.clips ?? []"
      :key="clip.id"
      class="absolute top-1 bottom-1 rounded-md border cursor-pointer select-none overflow-hidden group transition-all duration-100"
      :class="[
        clip.id === timeline.selectedClipId
          ? 'border-[#0099ff] bg-[#0099ff]/10'
          : 'border-[#3a3a3a] bg-[#252525] hover:border-[#4a4a4a] hover:bg-[#2a2a2a]',
        track?.hidden ? 'opacity-30' : 'opacity-100'
      ]"
      :style="clipStyle(clip)"
      @click="timeline.selectClip(clip.id)"
    >
      <!-- ── VIDEO ── -->
      <template v-if="type === 'video'">
        <div class="flex h-full w-full overflow-hidden">
          <img
            v-for="(frame, i) in clip.thumbnails"
            :key="i"
            :src="frame"
            class="h-full object-cover flex-shrink-0"
            style="width: 48px"
          />
          <div
            v-if="!clip.thumbnails.length"
            class="h-full w-full bg-[#222] flex items-center justify-center"
          >
            <span class="text-[#555] font-sans text-[10px] truncate px-2">
              {{ clip.name }}
            </span>
          </div>
        </div>
        <!-- hover name -->
        <div class="absolute top-1 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span class="text-white font-sans text-[10px] bg-black/60 px-1 py-px rounded">
            {{ clip.name }}
          </span>
        </div>
      </template>

      <!-- ── AUDIO ── -->
      <template v-else>
        <div class="h-full w-full flex items-center px-1.5 gap-x-1.5 overflow-hidden">
          <!-- mini waveform -->
          <div class="flex items-end gap-px h-5 flex-1 overflow-hidden">
            <div
              v-for="n in 60" :key="n"
              class="flex-shrink-0 rounded-full"
              :class="clip.id === timeline.selectedClipId ? 'bg-[#0099ff]/70' : 'bg-[#0099ff]/40'"
              style="width: 2px"
              :style="{ height: (20 + Math.random() * 80) + '%' }"
            />
          </div>
          <!-- clip name -->
          <span class="text-[#555] font-sans text-[9px] truncate flex-shrink-0 max-w-[60px]">
            {{ clip.name }}
          </span>
        </div>
      </template>

      <!-- trim handles — both types -->
      <div class="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-[#0099ff]/50 rounded-l-md transition-colors" />
      <div class="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-[#0099ff]/50 rounded-r-md transition-colors" />
    </div>
  </div>
</template>