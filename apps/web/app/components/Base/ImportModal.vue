<script setup lang="ts">
import { ref } from "vue";
import { db } from "@/db";
import { X, Upload, Sparkles, Wand2, ArrowLeft } from "@lucide/vue";
import type { MediaAsset } from "#shared/types/Media";
import { useRunway } from "@/composables/useRunway";

const emit = defineEmits<{ close: [] }>();

type Mode = null | 'import' | 'generate' | 'muse'
const mode = ref<Mode>(null)
const importing = ref(false)
const dragOver = ref(false)
const generatePrompt = ref('')
const generateImageFile = ref<File | null>(null)
const generateImageDataUri = ref<string | undefined>(undefined)

const { generateClip } = useRunway()

function select(m: Mode) { mode.value = m }
function back() { mode.value = null }

// ── Generate ────────────────────────────────────────────────────
async function handleGenerate() {
  if (!generatePrompt.value.trim()) return
  emit('close') // close immediately, task circle handles the rest
  await generateClip(generatePrompt.value, generateImageDataUri.value)
  generatePrompt.value = ''
  generateImageFile.value = null
  generateImageDataUri.value = undefined
}

async function handleReferenceImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  generateImageFile.value = file
  const reader = new FileReader()
  reader.onload = () => { generateImageDataUri.value = reader.result as string }
  reader.readAsDataURL(file)
}

// ── Import ──────────────────────────────────────────────────────
function generateVideoThumbnail(file: File): Promise<{ thumbnail: string; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.playsInline = true
    video.addEventListener("loadedmetadata", () => { video.currentTime = Math.min(1, video.duration * 0.1) })
    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas")
      canvas.width = 240; canvas.height = 135
      canvas.getContext("2d")!.drawImage(video, 0, 0, 240, 135)
      const thumbnail = canvas.toDataURL("image/jpeg", 0.7)
      URL.revokeObjectURL(url)
      resolve({ thumbnail, duration: video.duration })
    })
    video.load()
  })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

async function handleFiles(e: Event | DragEvent) {
  let files: File[] = []
  if (e instanceof DragEvent) {
    files = Array.from(e.dataTransfer?.files ?? [])
    dragOver.value = false
  } else {
    files = Array.from((e.target as HTMLInputElement).files ?? [])
  }
  if (!files.length) return
  importing.value = true
  for (const file of files) {
    try {
      const previewUrl = URL.createObjectURL(file)
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'audio'
      let thumbnail, duration, formattedDuration
      if (type === 'video') {
        const result = await generateVideoThumbnail(file)
        thumbnail = result.thumbnail
        duration = result.duration
        formattedDuration = formatDuration(result.duration)
      }
      await db.media.add({ name: file.name, type, size: file.size, file, previewUrl, thumbnail, duration, formattedDuration, createdAt: new Date() } as MediaAsset)
    } catch (error) { console.error('Import failed:', error) }
  }
  importing.value = false
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      @mousedown.self="emit('close')"
    >
      <div
        class="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
        :class="mode ? 'w-[400px]' : 'w-[320px]'"
        style="transition-timing-function: cubic-bezier(0.34,1.56,0.64,1)"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-3.5 py-2.5 border-b border-[#2e2e2e]">
          <div class="flex items-center gap-x-2">
            <button v-if="mode" class="flex items-center justify-center w-5 h-5 rounded hover:bg-[#2a2a2a] transition-colors" @click="back">
              <ArrowLeft :size="12" color="#666" :stroke-width="1.5" />
            </button>
            <span class="text-white font-sans text-xs">
              {{ mode === 'import' ? 'Import media' : mode === 'generate' ? 'Generate clip' : mode === 'muse' ? 'Muse' : 'Add media' }}
            </span>
          </div>
          <button class="flex items-center justify-center w-5 h-5 rounded hover:bg-[#2a2a2a] transition-colors" @click="emit('close')">
            <X :size="12" color="#555" :stroke-width="1.5" />
          </button>
        </div>

        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
          mode="out-in"
        >
          <!-- Picker -->
          <div v-if="!mode" class="flex flex-col p-2 gap-y-1">
            <button class="flex items-center gap-x-3 px-3 py-2.5 rounded-lg hover:bg-[#1e1e1e] transition-colors text-left group" @click="select('import')">
              <div class="flex items-center justify-center w-7 h-7 rounded-md bg-[#1e1e1e] border border-[#2e2e2e] flex-shrink-0 group-hover:border-[#3a3a3a] transition-colors">
                <Upload :size="13" color="#888" :stroke-width="1.5" />
              </div>
              <div class="flex flex-col gap-y-0.5">
                <span class="text-white font-sans text-xs">Import media</span>
                <span class="text-[#555] font-sans text-[11px]">Upload from your device</span>
              </div>
            </button>
            <button class="flex items-center gap-x-3 px-3 py-2.5 rounded-lg hover:bg-[#1e1e1e] transition-colors text-left group" @click="select('generate')">
              <div class="flex items-center justify-center w-7 h-7 rounded-md bg-[#1e1e1e] border border-[#2e2e2e] flex-shrink-0 group-hover:border-[#3a3a3a] transition-colors">
                <Sparkles :size="13" color="#888" :stroke-width="1.5" />
              </div>
              <div class="flex flex-col gap-y-0.5">
                <span class="text-white font-sans text-xs">Generate with AI</span>
                <span class="text-[#555] font-sans text-[11px]">Describe a scene, Runway creates it</span>
              </div>
            </button>
            <button class="flex items-center gap-x-3 px-3 py-2.5 rounded-lg hover:bg-[#1e1e1e] transition-colors text-left group" @click="select('muse')">
              <div class="flex items-center justify-center w-7 h-7 rounded-md bg-[#2567EC]/10 border border-[#2567EC]/20 flex-shrink-0 group-hover:border-[#2567EC]/40 transition-colors">
                <Wand2 :size="13" color="#2567EC" :stroke-width="1.5" />
              </div>
              <div class="flex flex-col gap-y-0.5">
                <div class="flex items-center gap-x-1.5">
                  <span class="text-white font-sans text-xs">Muse</span>
                  <span class="text-[10px] font-sans px-1 py-px rounded-full bg-[#2567EC]/10 text-[#2567EC] border border-[#2567EC]/20">AI</span>
                </div>
                <span class="text-[#555] font-sans text-[11px]">Auto-assemble clips from your footage</span>
              </div>
            </button>
          </div>

          <!-- Import -->
          <div v-else-if="mode === 'import'" class="flex flex-col p-2 gap-y-2">
            <div
              class="flex flex-col items-center justify-center gap-y-2 border border-dashed rounded-lg py-8 px-4 cursor-pointer transition-colors"
              :class="dragOver ? 'border-[#2567EC]/50 bg-[#2567EC]/5' : 'border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1a1a1a]'"
              @click="!importing && ($refs.fileInput as HTMLInputElement)?.click()"
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @drop.prevent="handleFiles"
            >
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1e1e] border border-[#2e2e2e]">
                <Upload v-if="!importing" :size="14" color="#666" :stroke-width="1.5" />
                <svg v-else class="animate-spin w-4 h-4" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#2a2a2a" stroke-width="1.5"/>
                  <circle cx="7" cy="7" r="5" stroke="#0099ff" stroke-width="1.5" stroke-dasharray="8 24" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="flex flex-col items-center gap-y-0.5">
                <span class="text-white font-sans text-xs">{{ importing ? 'Processing...' : dragOver ? 'Drop to import' : 'Drop files here' }}</span>
                <span v-if="!importing" class="text-[#444] font-sans text-[11px]">or click to browse</span>
              </div>
              <input ref="fileInput" type="file" accept="video/*,image/*,audio/*" multiple class="hidden" @change="handleFiles" />
            </div>
            <p class="text-[#333] font-sans text-[10px] text-center pb-1">MP4, MOV, WebM, MP3, WAV, PNG, JPG</p>
          </div>

          <!-- Generate -->
          <div v-else-if="mode === 'generate'" class="flex flex-col p-2 gap-y-2">
            <textarea
              v-model="generatePrompt"
              placeholder="Describe the scene you want to generate..."
              class="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-white font-sans text-xs placeholder-[#444] outline-none resize-none focus:border-[#3a3a3a] transition-colors"
              rows="4"
            />
            <div
              class="flex items-center gap-x-2 px-2 py-1.5 border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg cursor-pointer transition-colors"
              @click="($refs.refImageInput as HTMLInputElement)?.click()"
            >
              <Upload :size="11" color="#555" :stroke-width="1.5" />
              <span class="text-[#444] font-sans text-[11px]">
                {{ generateImageFile ? generateImageFile.name : 'Attach reference image (optional)' }}
              </span>
              <input ref="refImageInput" type="file" accept="image/*" class="hidden" @change="handleReferenceImage" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#444] font-sans text-[10px]">Runway Seedance2 · ~5s</span>
              <button
                class="flex items-center gap-x-1.5 px-3 py-1.5 bg-[#2567EC] hover:bg-[#1d5bd4] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!generatePrompt.trim()"
                @click="handleGenerate"
              >
                <Sparkles :size="11" color="#fff" :stroke-width="1.5" />
                <span class="text-white font-sans text-xs">Generate</span>
              </button>
            </div>
          </div>

          <!-- Muse -->
          <div v-else-if="mode === 'muse'" class="flex flex-col p-2 gap-y-2">
            <div
              class="flex flex-col items-center justify-center gap-y-2 border border-dashed rounded-lg py-6 px-4 cursor-pointer transition-colors border-[#2a2a2a] hover:border-[#2567EC]/30 hover:bg-[#2567EC]/5"
              @click="($refs.museInput as HTMLInputElement)?.click()"
            >
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2567EC]/10 border border-[#2567EC]/20">
                <Wand2 :size="14" color="#2567EC" :stroke-width="1.5" />
              </div>
              <div class="flex flex-col items-center gap-y-0.5">
                <span class="text-white font-sans text-xs">Upload your clips</span>
                <span class="text-[#444] font-sans text-[11px]">Multiple files, any order</span>
              </div>
              <input ref="museInput" type="file" accept="video/*" multiple class="hidden" @change="handleFiles" />
            </div>
            <textarea
              placeholder="Describe your vision — tone, style, narrative..."
              class="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-white font-sans text-xs placeholder-[#444] outline-none resize-none focus:border-[#3a3a3a] transition-colors"
              rows="3"
            />
            <div class="flex items-center justify-between">
              <span class="text-[#444] font-sans text-[10px]">Muse will order, trim and transform your clips</span>
              <button class="flex items-center gap-x-1.5 px-3 py-1.5 bg-[#2567EC] hover:bg-[#1d5bd4] rounded-lg transition-colors">
                <Wand2 :size="11" color="#fff" :stroke-width="1.5" />
                <span class="text-white font-sans text-xs">Run Muse</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>