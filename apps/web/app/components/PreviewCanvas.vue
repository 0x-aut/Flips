<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Play, Pause, Maximize } from '@lucide/vue'
import { usePlaybackStore } from '@/stores/playback'
import { useTimelineStore } from '@/stores/timeline'

const playback = usePlaybackStore()
const timeline = useTimelineStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const gl = ref<WebGLRenderingContext | null>(null)
const rafId = ref<number>(0)

// WebGL setup
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

  // fullscreen quad
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

function renderFrame() {
  const ctx = gl.value
  const video = videoRef.value
  if (!ctx || !video || video.readyState < 2) {
    rafId.value = requestAnimationFrame(renderFrame)
    return
  }
  ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, video)
  ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)
  rafId.value = requestAnimationFrame(renderFrame)
}

function togglePlay() {
  const video = videoRef.value
  if (!video) return
  if (playback.playing) {
    video.pause()
    playback.playing = false
  } else {
    video.play()
    playback.playing = true
  }
}

// format seconds → mm:ss
function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

const currentTime = ref(0)
const duration = ref(0)

function onTimeUpdate() {
  // currentTime.value = videoRef.value?.currentTime ?? 0
  const t = videoRef.value?.currentTime ?? 0
  currentTime.value = t
  playback.updateCurrentTime(t) // will have to check this
  timeline.updateCurrentTime(t) // will have to check this
  // I can update this here to edit the current time in the localstorage as well
}
function onLoadedMetadata() {
  duration.value = videoRef.value?.duration ?? 0
}

// watch active clip from timeline store
watch(() => timeline.activeClipSrc, (src) => {
  const t = videoRef.value?.currentTime ?? 0
  const video = videoRef.value
  if (!video || !src) return
  video.src = src
  video.load()
  playback.playing = false
  if (Math.abs(video.currentTime - t) > 0.1) {
    video.currentTime = t
  }
})

function onProgressClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  const t = pct * duration.value
  if (videoRef.value) videoRef.value.currentTime = pct * duration.value
  timeline.seekTo(t)
}

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

    <!-- Canvas area -->
    <div class="flex-1 flex items-center justify-center bg-[#0d0d0d] relative">
      <canvas
        ref="canvasRef"
        class="max-w-full max-h-full"
        style="aspect-ratio: 16/9"
        width="1280"
        height="720"
      />
      <!-- empty state -->
      <div
        v-if="!timeline.activeClipSrc"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span class="text-[#333] font-sans text-xs">No clip selected</span>
      </div>
      <!-- hidden video source for WebGL texture -->
      <video
        ref="videoRef"
        class="hidden"
        crossorigin="anonymous"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
      />
    </div>

    <!-- Controls bar -->
    <div class="flex items-center gap-x-3 px-3 h-9 border-t border-[#2e2e2e] flex-shrink-0">

      <!-- Play / pause -->
      <button
        class="flex items-center justify-center w-6 h-6 rounded-md hover:bg-[#2a2a2a] transition-colors flex-shrink-0"
        @click="togglePlay"
      >
        <component
          :is="playback.playing ? Pause : Play"
          :size="13"
          color="#fff"
          :stroke-width="1.5"
        />
      </button>

      <!-- Time -->
      <span class="text-[#555] font-sans text-[11px] tabular-nums flex-shrink-0">
        {{ formatTime(currentTime) }}
        <span class="text-[#333]"> / </span>
        {{ formatTime(duration) }}
      </span>

      <!-- Progress bar -->
      <div class="flex-1 h-[2px] bg-[#2a2a2a] rounded-full relative cursor-pointer"
        @click="onProgressClick"
      >
        <div
          class="absolute left-0 top-0 h-full bg-[#0099ff] rounded-full transition-none"
          :style="{ width: duration ? (currentTime / duration * 100) + '%' : '0%' }"
        />
      </div>

      <!-- Fullscreen (no-op for now) -->
      <button class="flex items-center justify-center w-6 h-6 rounded-md hover:bg-[#2a2a2a] transition-colors flex-shrink-0">
        <Maximize :size="13" color="#555" :stroke-width="1.5" />
      </button>

    </div>
  </div>
</template>