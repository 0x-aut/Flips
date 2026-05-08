// stores/timeline.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'

export interface Clip {
  id: string
  name: string
  src: string
  duration: number
  startTime: number
  trim: { in: number; out: number }
  speed: number
  thumbnails?: string[]
}

export interface Track {
  id: string
  label: string
  type: 'video' | 'audio'
  clips: Clip[]
}

export const useTimelineStore = defineStore(
  'timeline',
  () => {
    const tracks = ref<Track[]>([
      { id: 'video-1', label: 'Video 1', type: 'video', clips: [] },
      { id: 'audio-1', label: 'Audio 1', type: 'audio', clips: [] },
    ])
  
    const zoom = ref(1)
    const currentTime = ref(0)
    const selectedClipId = ref<string | null>(null)
    const activeClipSrc = ref<string | null>(null)
  
    const totalDuration = computed(() => {
      let max = 30 // minimum 30s canvas
      for (const track of tracks.value) {
        for (const clip of track.clips) {
          const end = clip.startTime + clip.duration - clip.trim.in - clip.trim.out
          if (end > max) max = end
        }
      }
      return max
    })
  
    function getTrack(id: string) {
      return tracks.value.find(t => t.id === id)
    }
  
    function addClipToTrack(trackId: string, clip: Omit<Clip, 'id'>) {
      const track = getTrack(trackId)
      if (!track) return
      track.clips.push({ ...clip, id: nanoid() })
    }
  
    function selectClip(clipId: string) {
      selectedClipId.value = clipId
      for (const track of tracks.value) {
        const clip = track.clips.find(c => c.id === clipId)
        if (clip) { activeClipSrc.value = clip.src; break }
      }
    }
  
    return {
      tracks, zoom, currentTime, selectedClipId,
      activeClipSrc, totalDuration,
      getTrack, addClipToTrack, selectClip
    }
  }, {
    persist: {
      storage: piniaPluginPersistedstate.cookies(),
    }
  }
)