<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Scissors, Bookmark, Trash2, Copy, ZoomIn, ZoomOut } from '@lucide/vue'
import { useTimelineStore } from '@/stores/timeline'
import { usePlaybackStore } from '@/stores/playback'

const timeline = useTimelineStore()
const playback = usePlaybackStore()

const scrollRef = ref<HTMLElement | null>(null)

const zoom = computed({
  get: () => timeline.zoom,
  set: (v) => timeline.zoom = v
})

// scrub on click/drag along the ruler or track area
function scrubFromEvent(e: MouseEvent) {
  const el = scrollRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const clickX = e.clientX - rect.left + el.scrollLeft
  const time = Math.max(0, clickX / (timeline.zoom * 100))
  timeline.seekTo(time)
  playback.seekTo(time)
}

let scrubbing = false
function onRulerMousedown(e: MouseEvent) {
  scrubbing = true
  scrubFromEvent(e)
}
function onMousemove(e: MouseEvent) {
  if (scrubbing) scrubFromEvent(e)
}
function onMouseup() {
  scrubbing = false
}

// auto scroll playhead into view during playback
watch(() => timeline.currentTime, (t) => {
  const el = scrollRef.value
  if (!el || !playback.playing) return
  const x = t * timeline.zoom * 100
  const { scrollLeft, clientWidth } = el
  if (x > scrollLeft + clientWidth - 80) {
    el.scrollLeft = x - clientWidth / 2
  }
})

// toolbar actions — operate on selected clip
function cutClip() {
  if (!timeline.selectedClipId) return
  // TODO: split clip at currentTime
}

function duplicateClip() {
  if (!timeline.selectedClipId) return
  timeline.duplicateClip(timeline.selectedClipId)
}

function deleteClip() {
  if (!timeline.selectedClipId) return
  timeline.removeClip(timeline.selectedClipId)
}

function addMarker() {
  timeline.addMarker(timeline.currentTime, `M${timeline.markers.length + 1}`)
}

// ruler tick marks
const ticks = computed(() => {
  const count = Math.ceil(timeline.totalDuration) + 1
  return Array.from({ length: count }, (_, i) => {
    const mins = Math.floor(i / 60)
    const secs = i % 60
    return {
      sec: i,
      label: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      x: i * timeline.zoom * 100,
    }
  })
})
</script>

<template>
  <section
    class="w-full h-full flex flex-col bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#2e2e2e]"
    @mousemove="onMousemove"
    @mouseup="onMouseup"
    @mouseleave="onMouseup"
  >
    <!-- Toolbar -->
    <div class="flex justify-between items-center w-full px-1 py-1 h-8 border-b border-[#2e2e2e] flex-shrink-0">
      <div class="flex gap-x-0.5 items-center">
        <button
          class="flex items-center justify-center rounded-sm p-1 hover:bg-[#2a2a2a] transition-colors disabled:opacity-30"
          :disabled="!timeline.selectedClipId"
          title="Cut clip"
          @click="cutClip"
        >
          <Scissors :size="13" :stroke-width="1.5" class="text-white" />
        </button>
        <button
          class="flex items-center justify-center rounded-sm p-1 hover:bg-[#2a2a2a] transition-colors disabled:opacity-30"
          :disabled="!timeline.selectedClipId"
          title="Duplicate clip"
          @click="duplicateClip"
        >
          <Copy :size="13" :stroke-width="1.5" class="text-white" />
        </button>
        <button
          class="flex items-center justify-center rounded-sm p-1 hover:bg-[#2a2a2a] transition-colors"
          title="Add marker"
          @click="addMarker"
        >
          <Bookmark :size="13" :stroke-width="1.5" class="text-white" />
        </button>
        <button
          class="flex items-center justify-center rounded-sm p-1 hover:bg-[#2a2a2a] transition-colors disabled:opacity-30"
          :disabled="!timeline.selectedClipId"
          title="Delete clip"
          @click="deleteClip"
        >
          <Trash2 :size="13" :stroke-width="1.5" class="text-white" />
        </button>
      </div>

      <!-- Zoom -->
      <div class="flex items-center gap-x-1.5 pr-1">
        <ZoomOut :size="11" color="#555" :stroke-width="1.5" />
        <input
          type="range" min="0.2" max="8" step="0.1"
          v-model.number="zoom"
          class="w-20 h-0.5 accent-[#0099ff] cursor-pointer"
        />
        <ZoomIn :size="11" color="#555" :stroke-width="1.5" />
      </div>
    </div>

    <!-- Timeline body -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Fixed left column -->
      <div class="flex flex-col w-10 flex-shrink-0 border-r border-[#2e2e2e]">
        <div class="h-5 flex-shrink-0 border-b border-[#2e2e2e]" />
      
        <template v-for="track in timeline.tracks" :key="track.id">
          <!-- video track label row -->
          <div
            class="flex flex-col items-center justify-center gap-y-1 border-b border-[#2e2e2e]/40 flex-shrink-0 px-1"
            :class="track.type === 'video' ? 'h-16' : 'h-10'"
          >
            <button
              class="flex items-center justify-center w-5 h-5 rounded hover:bg-[#2a2a2a] transition-colors"
              @click="timeline.toggleTrackMute(track.id)"
              :title="track.muted ? 'Unmute' : 'Mute'"
            >
              <component
                :is="track.muted ? VolumeX : Volume2"
                :size="11"
                :color="track.muted ? '#555' : '#888'"
                :stroke-width="1.5"
              />
            </button>
            <button
              v-if="track.type === 'video'"
              class="flex items-center justify-center w-5 h-5 rounded hover:bg-[#2a2a2a] transition-colors"
              @click="timeline.toggleTrackVisibility(track.id)"
              :title="track.hidden ? 'Show' : 'Hide'"
            >
              <component
                :is="track.hidden ? EyeOff : Eye"
                :size="11"
                :color="track.hidden ? '#555' : '#888'"
                :stroke-width="1.5"
              />
            </button>
          </div>
      
          <!-- separator between video and audio -->
          <div
            v-if="track.type === 'video'"
            class="h-px bg-[#2e2e2e] flex-shrink-0"
          />
        </template>
      </div>
      
      <!-- Scrollable content -->
      <div ref="scrollRef" class="flex-1 overflow-x-auto overflow-y-hidden relative select-none"
        style="scrollbar-width: thin; scrollbar-color: #2e2e2e transparent;">
        <div class="relative" :style="{ width: timeline.timelineWidth + 'px', minWidth: '100%' }">
      
          <!-- Ruler -->
          <div class="relative h-5 border-b border-[#2e2e2e] bg-[#1a1a1a] sticky top-0 z-10 cursor-pointer"
            @mousedown="onRulerMousedown">
            <div v-for="tick in ticks" :key="tick.sec"
              class="absolute top-0 flex flex-col"
              :style="{ left: tick.x + 'px' }">
              <div class="w-px h-2 bg-[#3a3a3a]" />
              <span class="text-[#444] font-sans text-[9px] pl-0.5 leading-none mt-0.5">
                {{ tick.label }}
              </span>
            </div>
            <!-- markers -->
            <div v-for="marker in timeline.markers" :key="marker.id"
              class="absolute top-0 bottom-0"
              :style="{ left: (marker.time * timeline.zoom * 100) + 'px' }">
              <div class="w-px h-full bg-[#f59e0b]/60" />
              <span class="absolute top-0 left-1 text-[9px] font-sans text-[#f59e0b] whitespace-nowrap">
                {{ marker.label }}
              </span>
            </div>
          </div>
      
          <!-- Tracks + playhead -->
          <div
            class="relative"
            :style="{ height: trackAreaHeight + 'px' }"
          >
            <template v-for="track in timeline.tracks" :key="track.id">
              <TimelineCompTrack
                :trackId="track.id"
                :label="track.label"
                :type="track.type"
              />
              <!-- visual separator between video and audio -->
              <div v-if="track.type === 'video'" class="w-full h-px bg-[#2e2e2e]" />
            </template>
      
            <!-- Playhead -->
            <div
              class="absolute top-0 bottom-0 z-20 pointer-events-none"
              :style="{ left: timeline.playheadX + 'px' }"
            >
              <div class="w-2.5 h-2.5 bg-[#0099ff] rounded-full -translate-x-[4.5px]" />
              <div class="w-px bg-[#0099ff] mx-auto" style="height: calc(100% - 10px)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>