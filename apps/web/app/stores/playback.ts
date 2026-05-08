// stores/playback.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlaybackStore = defineStore('playback', () => {
  // ── Core state ──────────────────────────────────────────
  const playing = ref(false)
  const currentTime = ref(0)      // single source of truth — seconds
  const duration = ref(0)         // total duration of active clip
  const volume = ref(1)           // 0–1
  const muted = ref(false)
  const playbackRate = ref(1)     // 0.25, 0.5, 1, 1.5, 2

  // ── Derived ─────────────────────────────────────────────
  const progress = computed(() =>
    duration.value > 0 ? currentTime.value / duration.value : 0
  )

  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

  const remainingTime = computed(() => duration.value - currentTime.value)

  // ── Actions ─────────────────────────────────────────────
  function play() {
    playing.value = true
  }

  function pause() {
    playing.value = false
  }

  function togglePlay() {
    playing.value = !playing.value
  }

  function seekTo(time: number) {
    currentTime.value = Math.max(0, Math.min(time, duration.value))
  }

  function seekByPercent(pct: number) {
    seekTo(pct * duration.value)
  }

  function skipForward(seconds = 5) {
    seekTo(currentTime.value + seconds)
  }

  function skipBackward(seconds = 5) {
    seekTo(currentTime.value - seconds)
  }

  function setDuration(d: number) {
    duration.value = d
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
    if (v > 0) muted.value = false
  }

  function toggleMute() {
    muted.value = !muted.value
  }

  function setPlaybackRate(rate: number) {
    playbackRate.value = rate
  }

  function reset() {
    playing.value = false
    currentTime.value = 0
    duration.value = 0
    playbackRate.value = 1
  }

  // ── Helpers ─────────────────────────────────────────────
  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return {
    // state
    playing,
    currentTime,
    duration,
    volume,
    muted,
    playbackRate,
    // derived
    progress,
    formattedCurrentTime,
    formattedDuration,
    remainingTime,
    // actions
    play,
    pause,
    togglePlay,
    seekTo,
    seekByPercent,
    skipForward,
    skipBackward,
    setDuration,
    setVolume,
    toggleMute,
    setPlaybackRate,
    reset,
  }
})