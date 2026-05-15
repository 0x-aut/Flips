import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'

export interface Clip {
  id: string
  mediaAssetId?: number
  name: string
  src: string
  duration: number
  startTime: number
  trim: { in: number; out: number }
  speed: number
  thumbnails: string[]
}

export interface Track {
  id: string
  label: string
  type: 'video' | 'audio'
  clips: Clip[]
  muted: boolean
  hidden: boolean
}

export const useTimelineStore = defineStore('timeline', () => {
  const tracks = ref<Track[]>([
    { id: 'video-1', label: 'Video 1', type: 'video', clips: [], muted: false, hidden: false },
    { id: 'audio-1', label: 'Audio 1', type: 'audio', clips: [], muted: false, hidden: false },
  ])

  const zoom = ref(1)                          // 1 = 100px per second
  const currentTime = ref(0)                   // playhead position in seconds
  const selectedClipId = ref<string | null>(null)
  const activeClipSrc = ref<string | null>(null)

  // total duration — minimum 30s, expands to fit all clips
  const totalDuration = computed(() => {
    let max = 0
    for (const track of tracks.value) {
      for (const clip of track.clips) {
        const end = clip.startTime + (clip.duration - clip.trim.in - clip.trim.out) / clip.speed
        if (end > max) max = end
      }
    }
    return max
  })

  // pixel width of the full timeline canvas
  const timelineWidth = computed(() => totalDuration.value * zoom.value * 100)

  // playhead position in pixels
  const playheadX = computed(() => currentTime.value * zoom.value * 100)

  function updateCurrentTime(seconds: number) {
    currentTime.value = seconds
    console.log("current time: ", currentTime.value)
  }
  
  function getTrack(id: string) {
    return tracks.value.find(t => t.id === id)
  }

  function addClipToTrack(trackId: string, clip: Omit<Clip, 'id'>) {
    const track = getTrack(trackId)
    if (!track) return
    const id = nanoid()
    track.clips.push({ ...clip, id })
    // auto select the new clip
    selectedClipId.value = id
    activeClipSrc.value = clip.src
  }

  function addAudioToTrack(trackId: string, clip: Omit<Clip, "id">) {
    const track = getTrack(trackId)
    if (!track) return
    const id = nanoid()
    track.clips.push({ ...clip, id })
  }

  function removeClip(clipId: string) {
    for (const track of tracks.value) {
      const idx = track.clips.findIndex(c => c.id === clipId)
      if (idx !== -1) {
        track.clips.splice(idx, 1)
        if (selectedClipId.value === clipId) {
          selectedClipId.value = null
          activeClipSrc.value = null
        }
        break
      }
    }
  }

  function selectClip(clipId: string) {
    selectedClipId.value = clipId
    for (const track of tracks.value) {
      const clip = track.clips.find(c => c.id === clipId)
      if (clip) {
        activeClipSrc.value = clip.src
        break
      }
    }
  }

  function duplicateClip(clipId: string) {
    for (const track of tracks.value) {
      const clip = track.clips.find(c => c.id === clipId)
      if (clip) {
        const newClip: Clip = {
          ...clip,
          id: nanoid(),
          startTime: clip.startTime + (clip.duration - clip.trim.in - clip.trim.out),
        }
        track.clips.push(newClip)
        break
      }
    }
  }

  function updateClipTrim(clipId: string, trimIn: number, trimOut: number) {
    for (const track of tracks.value) {
      const clip = track.clips.find(c => c.id === clipId)
      if (clip) {
        clip.trim.in = Math.max(0, trimIn)
        clip.trim.out = Math.max(0, trimOut)
        break
      }
    }
  }

  function updateClipStartTime(clipId: string, startTime: number) {
    for (const track of tracks.value) {
      const clip = track.clips.find(c => c.id === clipId)
      if (clip) {
        clip.startTime = Math.max(0, startTime)
        break
      }
    }
  }

  function updateClipSrc(clipId: string, src: string) {
    for (const track of tracks.value) {
      const clip = track.clips.find(c => c.id === clipId)
      if (clip) {
        clip.src = src
        activeClipSrc.value = src  // update preview canvas too
        break
      }
    }
  }

  function toggleTrackMute(trackId: string) {
    const track = getTrack(trackId)
    if (track) track.muted = !track.muted
  }

  function toggleTrackVisibility(trackId: string) {
    const track = getTrack(trackId)
    if (track) track.hidden = !track.hidden
  }

  function seekTo(time: number) {
    currentTime.value = Math.max(0, Math.min(time, totalDuration.value))
  }

  function addMarker(time: number, label: string) {
    // markers stored separately — scaffold for now
    markers.value.push({ id: nanoid(), time, label })
  }

  const markers = ref<{ id: string; time: number; label: string }[]>([])

  return {
    // state
    tracks,
    zoom,
    currentTime,
    selectedClipId,
    activeClipSrc,
    markers,
    // computed
    totalDuration,
    timelineWidth,
    playheadX,
    // actions
    updateCurrentTime,
    getTrack,
    addClipToTrack,
    removeClip,
    selectClip,
    duplicateClip,
    updateClipTrim,
    updateClipSrc,
    updateClipStartTime,
    toggleTrackMute,
    toggleTrackVisibility,
    seekTo,
    addMarker,
  }
}, {
  persist: {
    storage: piniaPluginPersistedstate.localStorage(),
    pick: ['zoom', 'currentTime', 'markers', 'tracks']
  }
})