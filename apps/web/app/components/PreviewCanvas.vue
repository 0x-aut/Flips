<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Play, Pause, Maximize } from '@lucide/vue'
import { usePlaybackStore } from '@/stores/playback'
import { useTimelineStore } from '@/stores/timeline'
import type { Clip } from '@/stores/timeline'

const playback = usePlaybackStore()
const timeline = useTimelineStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const gl = ref<WebGLRenderingContext | null>(null)
const rafId = ref<number>(0)

// track which clip is currently loaded in the video element
const loadedClipId = ref<string | null>(null)

// ── WebGL init (unchanged) ───────────────────────────────────────
function initWebGL() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('webgl')
  if (!ctx) return
  gl.value = ctx

  const vsSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `
  const fsSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_texCoord;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
  `

  const vs = compileShader(ctx, ctx.VERTEX_SHADER, vsSource)!
  const fs = compileShader(ctx, ctx.FRAGMENT_SHADER, fsSource)!
  const program = ctx.createProgram()!
  ctx.attachShader(program, vs)
  ctx.attachShader(program, fs)
  ctx.linkProgram(program)
  ctx.useProgram(program)

  const positions = new Float32Array([-1,-1, 1,-1, -1,1, 1,1])
  const texCoords = new Float32Array([0,1, 1,1, 0,0, 1,0])

  const posBuf = ctx.createBuffer()
  ctx.bindBuffer(ctx.ARRAY_BUFFER, posBuf)
  ctx.bufferData(ctx.ARRAY_BUFFER, positions, ctx.STATIC_DRAW)
  const posLoc = ctx.getAttribLocation(program, 'a_position')
  ctx.enableVertexAttribArray(posLoc)
  ctx.vertexAttribPointer(posLoc, 2, ctx.FLOAT, false, 0, 0)

  const texBuf = ctx.createBuffer()
  ctx.bindBuffer(ctx.ARRAY_BUFFER, texBuf)
  ctx.bufferData(ctx.ARRAY_BUFFER, texCoords, ctx.STATIC_DRAW)
  const texLoc = ctx.getAttribLocation(program, 'a_texCoord')
  ctx.enableVertexAttribArray(texLoc)
  ctx.vertexAttribPointer(texLoc, 2, ctx.FLOAT, false, 0, 0)

  const texture = ctx.createTexture()
  ctx.bindTexture(ctx.TEXTURE_2D, texture)
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE)
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE)
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR)
}

function compileShader(ctx: WebGLRenderingContext, type: number, src: string) {
  const shader = ctx.createShader(type)!
  ctx.shaderSource(shader, src)
  ctx.compileShader(shader)
  return shader
}

// ── Core render loop ─────────────────────────────────────────────
function renderFrame() {
  const ctx = gl.value
  const video = videoRef.value
  if (ctx && video && video.readyState >= 2) {
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, video)
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)
  }
  rafId.value = requestAnimationFrame(renderFrame)
}

// ── Active clip resolution ───────────────────────────────────────
function getActiveClip(t: number): Clip | null {
  const track = timeline.getTrack('video-1')
  if (!track) return null
  return track.clips.find(clip => {
    const end = clip.startTime + (clip.duration - clip.trim.in - clip.trim.out) / clip.speed
    return t >= clip.startTime && t < end
  }) ?? null
}

function getLocalTime(clip: Clip, t: number): number {
  return (t - clip.startTime) / clip.speed + clip.trim.in
}

// ── Playback tick — called on each timeupdate ────────────────────
function onTimeUpdate() {
  const video = videoRef.value
  if (!video) return

  const t = timeline.currentTime
  const activeClip = getActiveClip(t)

  if (!activeClip) {
    // gap between clips or past end — pause
    if (!video.paused) video.pause()
    return
  }

  // swap clip if needed
  if (loadedClipId.value !== activeClip.id) {
    video.src = activeClip.src
    video.load()
    loadedClipId.value = activeClip.id
    video.addEventListener('canplay', () => {
      video.currentTime = getLocalTime(activeClip, t)
      if (playback.playing) video.play()
    }, { once: true })
    return
  }

  // sync local time — only seek if drift > 0.3s
  const expectedLocal = getLocalTime(activeClip, t)
  if (Math.abs(video.currentTime - expectedLocal) > 0.3) {
    video.currentTime = expectedLocal
  }

  // update stores
  playback.updateCurrentTime(t)
}

// ── Video element events ─────────────────────────────────────────
function onVideoTimeUpdate() {
  const video = videoRef.value
  if (!video || !playback.playing) return

  const activeClip = getActiveClip(timeline.currentTime)
  if (!activeClip) return

  // advance timeline time based on video playback
  const newTimelineTime = activeClip.startTime + (video.currentTime - activeClip.trim.in) * activeClip.speed
  timeline.currentTime = newTimelineTime
  playback.updateCurrentTime(newTimelineTime)
}

function onVideoEnded() {
  // find next clip
  const track = timeline.getTrack('video-1')
  if (!track) return

  const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime)
  const currentClip = sorted.find(c => c.id === loadedClipId.value)
  if (!currentClip) return

  const currentIndex = sorted.indexOf(currentClip)
  const nextClip = sorted[currentIndex + 1]

  if (nextClip) {
    // advance timeline to next clip start
    timeline.currentTime = nextClip.startTime
    timeline.selectClip(nextClip.id)
    onTimeUpdate() // trigger clip swap
  } else {
    // end of all clips
    playback.playing = false
    playback.pause()
  }
}

// ── Controls ─────────────────────────────────────────────────────
function togglePlay() {
  const video = videoRef.value
  if (!video) return
  if (playback.playing) {
    video.pause()
    playback.pause()
  } else {
    video.play()
    playback.play()
  }
}

function onProgressClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  const t = pct * timeline.totalDuration
  timeline.seekTo(t)
  playback.seekTo(t)
  onTimeUpdate() // immediately swap to correct clip
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

// watch external timeline seeks (ruler click)
watch(() => timeline.currentTime, (t) => {
  const video = videoRef.value
  if (!video) return
  const activeClip = getActiveClip(t)
  if (!activeClip) return
  if (loadedClipId.value !== activeClip.id) {
    onTimeUpdate()
    return
  }
  const expected = getLocalTime(activeClip, t)
  if (Math.abs(video.currentTime - expected) > 0.3) {
    video.currentTime = expected
  }
})

// watch first clip load
watch(() => timeline.getTrack('video-1')?.clips.length, (len) => {
  if (len === 1 && !loadedClipId.value) {
    const clip = timeline.getTrack('video-1')!.clips[0]
    timeline.selectClip(clip.id)
    onTimeUpdate()
  }
}, { immediate: true })

onMounted(() => {
  initWebGL()
  renderFrame()
})

onUnmounted(() => {
  cancelAnimationFrame(rafId.value)
})
</script>

<template>
  <div class="flex flex-col h-full w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg overflow-hidden">

    <div class="flex-1 flex items-center justify-center bg-[#0d0d0d] relative">
      <canvas
        ref="canvasRef"
        class="max-w-full max-h-full"
        style="aspect-ratio: 16/9"
        width="1280"
        height="720"
      />
      <div
        v-if="!timeline.getTrack('video-1')?.clips.length"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span class="text-[#333] font-sans text-xs">No clips in timeline</span>
      </div>
      <video
        ref="videoRef"
        class="hidden"
        crossorigin="anonymous"
        @timeupdate="onVideoTimeUpdate"
        @ended="onVideoEnded"
      />
    </div>

    <div class="flex items-center gap-x-3 px-3 h-9 border-t border-[#2e2e2e] flex-shrink-0">
      <button
        class="flex items-center justify-center w-6 h-6 rounded-md hover:bg-[#2a2a2a] transition-colors flex-shrink-0"
        @click="togglePlay"
      >
        <component :is="playback.playing ? Pause : Play" :size="13" color="#fff" :stroke-width="1.5" />
      </button>

      <span class="text-[#555] font-sans text-[11px] tabular-nums flex-shrink-0">
        {{ formatTime(timeline.currentTime) }}
        <span class="text-[#333]"> / </span>
        {{ formatTime(timeline.totalDuration) }}
      </span>

      <div
        class="flex-1 h-[2px] bg-[#2a2a2a] rounded-full relative cursor-pointer"
        @click="onProgressClick"
      >
        <div
          class="absolute left-0 top-0 h-full bg-[#0099ff] rounded-full"
          :style="{ width: timeline.totalDuration > 0 ? (timeline.currentTime / timeline.totalDuration * 100) + '%' : '0%' }"
        />
      </div>

      <button class="flex items-center justify-center w-6 h-6 rounded-md hover:bg-[#2a2a2a] transition-colors flex-shrink-0">
        <Maximize :size="13" color="#555" :stroke-width="1.5" />
      </button>
    </div>
  </div>
</template>