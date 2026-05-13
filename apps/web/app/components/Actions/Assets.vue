<script setup lang="ts">
import { ref } from "vue";
import { CloudDownload, Trash2 } from "@lucide/vue";
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
import { from } from "rxjs";
import { map } from "rxjs/operators";
import { db } from "@/db";
import type { MediaAsset } from "#shared/types/Media";
import { useTimelineStore } from "@/stores/timeline";

const showImport = ref(false);
const timeline = useTimelineStore();

const assets = useObservable<MediaAsset[]>(
  from(
    liveQuery(() => db.media.orderBy("createdAt").reverse().toArray())
  ).pipe(
    map(items =>
      items.map(item => ({
        ...item,
        previewUrl: item.file instanceof Blob
          ? URL.createObjectURL(item.file)
          : item.previewUrl,
      }))
    )
  ),
  { initialValue: null }
);

function addToTimeline(asset: MediaAsset) {
  const trackId = asset.type === 'audio' ? 'audio-1' : 'video-1'
  const duration = typeof asset.duration === 'number' && asset.duration > 0
    ? asset.duration
    : 5 // fallback 5 seconds

  timeline.addClipToTrack(trackId, {
    name: asset.name,
    src: asset.previewUrl,
    mediaAssetId: asset.id,
    duration,
    startTime: 0,
    trim: { in: 0, out: 0 },
    speed: 1,
    thumbnails: asset.thumbnail ? [asset.thumbnail] : [],
  })
  console.log('tracks after add:', JSON.stringify(timeline.tracks.map(t => ({ id: t.id, clips: t.clips.length }))))
}



async function deleteAsset(e: MouseEvent, asset: MediaAsset) {
  e.stopPropagation() // prevent addToTimeline from firing
  if (!asset.id) return
  try {
    await db.media.delete(asset.id)
    // also remove any timeline clips referencing this asset
    // by matching src to the asset's previewUrl isn't reliable across sessions
    // so we match by name as a best effort for now
    for (const track of timeline.tracks) {
      const toRemove = track.clips.filter(c => c.name === asset.name)
      toRemove.forEach(c => timeline.removeClip(c.id))
    }
  } catch (error) {
    console.error('Delete failed:', error)
  }
}
</script>
<template>
  <section class="w-full h-full">
    <!-- Top bar -->
    <div class="flex justify-between items-center w-full px-1 py-1 h-8 border border-b-[#2e2e2e] border-t-0 border-l-0 border-r-0">
      <span class="font-sans font-light text-xs text-[#555555]">Assets</span>
      <button
        class="flex items-center justify-center rounded-sm border border-[#2e2e2e] gap-x-1.5 px-2 py-0.5 hover:bg-[#1e1e1e] transition-colors"
        @click="showImport = true"
      >
        <CloudDownload :size="13" color="#FFFFFF" :stroke-width="1.5" />
        <span class="font-sans text-xs text-[#FFFFFF] font-light">Import</span>
      </button>
    </div>

    <BaseImportModal v-if="showImport" @close="showImport = false" />

    <!-- Loading -->
    <div
      v-if="assets === null"
      class="flex items-center justify-center h-[calc(100%-32px)]"
    >
      <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5" stroke="#2a2a2a" stroke-width="1.5"/>
        <circle cx="7" cy="7" r="5" stroke="#444" stroke-width="1.5" stroke-dasharray="8 24" stroke-linecap="round"/>
      </svg>
    </div>

    <!-- Empty -->
    <div
      v-else-if="assets.length === 0"
      class="flex flex-col items-center justify-center h-[calc(100%-32px)] gap-y-2 px-4"
    >
      <span class="text-[#333] font-sans text-xs text-center">
        No assets yet. Import media or generate a clip.
      </span>
    </div>

    <!-- Grid -->
    <section
      v-else
      class="h-[calc(100%-32px)] overflow-y-auto noscrollbar p-2 grid grid-cols-2 gap-1 content-start auto-rows-[96px]"
    >
      <div
        v-for="asset in assets"
        :key="asset.id"
        class="group relative rounded-lg overflow-hidden bg-[#111] border border-[#2a2a2a] cursor-pointer hover:border-[#3a3a3a] transition-colors"
        @click="addToTimeline(asset)"
      >
        <!-- Image -->
        <img
          v-if="asset.type === 'image'"
          :src="asset.previewUrl"
          class="w-full h-full object-cover"
        />

        <!-- Video -->
        <div v-else-if="asset.type === 'video'" class="w-full h-full relative">
          <img
            v-if="asset.thumbnail"
            :src="asset.thumbnail"
            class="w-full h-full object-cover"
          />
          <video
            v-else
            :src="asset.previewUrl"
            class="w-full h-full object-cover"
            preload="metadata"
          />
          <div class="absolute bottom-1 left-1.5">
            <span class="text-[10px] font-sans text-white/70 bg-black/50 px-1 py-px rounded">
              {{ asset.formattedDuration ?? 'video' }}
            </span>
          </div>
        </div>

        <!-- Audio -->
        <div
          v-else-if="asset.type === 'audio'"
          class="w-full h-full flex flex-col items-center justify-center gap-y-1 bg-[#141414]"
        >
          <div class="flex items-end gap-px h-6">
            <div
              v-for="n in 12" :key="n"
              class="bg-[#0099ff]/50 rounded-full w-[3px]"
              :style="{ height: (30 + Math.random() * 70) + '%' }"
            />
          </div>
          <span class="text-[#444] font-sans text-[10px] truncate px-2 w-full text-center">
            {{ asset.name }}
          </span>
        </div>

        <!-- Hover overlay — name at bottom -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
        <div class="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="text-white font-sans text-[10px] truncate block">{{ asset.name }}</span>
        </div>

        <!-- Delete button — top right -->
        <button
          class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all w-5 h-5 rounded-md bg-black/60 hover:bg-red-500/80 flex items-center justify-center"
          @click="deleteAsset($event, asset)"
          title="Delete asset"
        >
          <Trash2 :size="10" color="white" :stroke-width="1.5" />
        </button>
      </div>
    </section>
  </section>
</template>
