<script setup lang="ts">
// import { ref, computed } from 'vue'
import { Scissors, Bookmark, Trash2, Copy, ZoomIn, ZoomOut } from '@lucide/vue'
import { useTimelineStore } from '@/stores/timeline'

const timeline = useTimelineStore()
const zoom = computed({
  get: () => timeline.zoom,
  set: (v) => timeline.zoom = v
})
</script>

<template>
  <section class="w-full h-full flex flex-col bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#2e2e2e]">

    <!-- Toolbar -->
    <div class="flex justify-between items-center w-full px-1 py-1 h-8 border-b border-[#2e2e2e] flex-shrink-0">
      <div class="flex gap-x-0.5 items-center">
        <button class="flex items-center justify-center rounded-sm p-1 hover:bg-[#2a2a2a] transition-colors" title="Cut clip">
          <Scissors :size="13" :stroke-width="1.5" class="text-white opacity-80" />
        </button>
        <button class="flex items-center justify-center rounded-sm p-1 hover:bg-[#2a2a2a] transition-colors" title="Duplicate clip">
          <Copy :size="13" :stroke-width="1.5" class="text-white opacity-80" />
        </button>
        <button class="flex items-center justify-center rounded-sm p-1 hover:bg-[#2a2a2a] transition-colors" title="Create marker">
          <Bookmark :size="13" :stroke-width="1.5" class="text-white opacity-80" />
        </button>
        <button class="flex items-center justify-center rounded-sm p-1 hover:bg-[#2a2a2a] transition-colors" title="Delete clip">
          <Trash2 :size="13" :stroke-width="1.5" class="text-white opacity-80" />
        </button>
      </div>

      <!-- Zoom slider -->
      <div class="flex items-center gap-x-1.5 pr-1">
        <ZoomOut :size="11" color="#555" :stroke-width="1.5" />
        <input
          type="range" min="0.5" max="5" step="0.1"
          v-model.number="zoom"
          class="w-20 h-0.5 accent-[#0099ff] cursor-pointer"
        />
        <ZoomIn :size="11" color="#555" :stroke-width="1.5" />
      </div>
    </div>

    <!-- Timeline body — fixed left panel + scrolling right -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Fixed left labels column -->
      <div class="flex flex-col w-10 flex-shrink-0 border-r border-[#2e2e2e]">
        <!-- spacer for ruler row -->
        <div class="h-5 border-b border-[#2e2e2e] flex-shrink-0" />
        <!-- track label slots — match TimelineTrack heights -->
        <div
          v-for="track in timeline.tracks"
          :key="track.id"
          class="h-14 flex-shrink-0 border-b border-[#2e2e2e]/40"
        />
      </div>

      <!-- Scrollable right area -->
      <div class="flex-1 overflow-x-auto overflow-y-hidden relative" id="timeline-scroll">

        <!-- Time ruler -->
        <div class="relative h-5 border-b border-[#2e2e2e] flex-shrink-0 sticky top-0 bg-[#1a1a1a] z-10"
          :style="{ width: (timeline.totalDuration * zoom * 100) + 'px', minWidth: '100%' }"
        >
          <div
            v-for="sec in Math.ceil(timeline.totalDuration) + 1"
            :key="sec"
            class="absolute top-0 flex flex-col items-start"
            :style="{ left: ((sec - 1) * zoom * 100) + 'px' }"
          >
            <div class="w-px h-2 bg-[#3a3a3a]" />
            <span class="text-[#444] font-sans text-[9px] pl-0.5">
              {{ String(Math.floor((sec-1) / 60)).padStart(2,'0') }}:{{ String((sec-1) % 60).padStart(2,'0') }}
            </span>
          </div>
        </div>

        <!-- Tracks -->
        <div
          class="relative"
          :style="{ width: (timeline.totalDuration * zoom * 100) + 'px', minWidth: '100%' }"
        >
          <TimelineCompTrack
            v-for="track in timeline.tracks"
            :key="track.id"
            :track-id="track.id"
            :label="track.label"
            :type="track.type"
          />

          <!-- Playhead -->
          <div
            class="absolute top-0 bottom-0 w-px bg-[#0099ff] z-20 pointer-events-none"
            :style="{ left: (timeline.currentTime * zoom * 100) + 'px' }"
          >
            <div class="w-2.5 h-2.5 bg-[#0099ff] rounded-full -translate-x-[4.5px] -translate-y-px" />
          </div>
        </div>

      </div>
    </div>

  </section>
</template>