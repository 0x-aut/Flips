<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { Download, ArrowUp, CircleCheck, CircleAlert } from "@lucide/vue";
import { useAiStore } from "@/stores/ai";
import { useRunway } from '@/composables/useRunway'
import { db } from "@/db";
import type { Project } from "#shared/types/Media"

const pageRoute = useRoute();

const project = ref<Project | null>(null);

const project_id = ref<number|null>(null);



// Editing project name 
const editingTitle = ref(false)
// const projectTitle = ref(project.name || "New project")
const projectTitle = ref("New project")

watch(project, (value) => {
  if (value) {
    projectTitle.value = value.name
  }
})


const titleInputRef = ref<HTMLInputElement|null>(null)

async function beginTitleEdit() {
  editingTitle.value = true
  await nextTick()
  titleInputRef.value?.focus()
  titleInputRef.value?.select()
}

async function saveProjectTitle() {
  editingTitle.value = false
  const trimmed = projectTitle.value.trim()
  if (!trimmed) {
    projectTitle.value = "New project"
  }
  try {
    await db.projects.update(project.value.id, {
      name: projectTitle.value.trim() || "New project",
    })
  } catch (error) {
    console.log("An error occured while saving the new project name: ", error)
  }
}




// ── AI / task circle ─────────────────────────────────────────────
const ai = useAiStore()
const aiJobs = computed(() => ai.jobs)
const activeJobCount = computed(() => ai.activeJobCount)
const taskOpen = ref(false)
const taskPillRef = ref<HTMLElement | null>(null)
const { pollJob, transformClipBetweenMarkers } = useRunway()

// poll active jobs every 3 seconds
let pollInterval: ReturnType<typeof setInterval> | null = null;

// parsed mention tokens from pill input
const mentionedMarkers = computed(() => {
  const matches = text.value.match(/@(\w+)/g) ?? []
  return matches.map(m => m.slice(1).toLowerCase()) // ['m1', 'm2']
})

// check if a marker label exists in timeline
function markerExists(label: string) {
  return timeline.markers.some(m => m.label.toLowerCase() === label)
}


// build highlighted HTML for the pill display
const highlightedText = computed(() => {
  return text.value.replace(/@(\w+)/g, (match, label) => {
    const exists = markerExists(label)

    return `<span style="color: ${
      exists ? '#0099ff' : '#ff4d4d'
    }">${match}</span>`
  })
})

function toggleTasks() {
  taskOpen.value = !taskOpen.value
}

function onTaskPillClickOutside(e: MouseEvent) {
  if (taskOpen.value && !taskPillRef.value?.contains(e.target as Node)) {
    taskOpen.value = false
  }
}

// ── Command pill ─────────────────────────────────────────────────
const expanded = ref(false);
const tall = ref(false);
const text = ref("");
const taRef = ref<HTMLTextAreaElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const btnSize = ref(28);

async function expandPill() {
  if (expanded.value) return;
  expanded.value = true;
  await nextTick();
  taRef.value?.focus();
  autoResize();
}

function collapse() {
  expanded.value = false;
  tall.value = false;
}

async function send() {
  const val = text.value.trim()
  if (!val) return

  const mentions = mentionedMarkers.value
  const validMarkers = mentions.filter(m => markerExists(m))

  if (validMarkers.length >= 2) {
    // marker-scoped edit
    const m1 = timeline.markers.find(m => m.label.toLowerCase() === validMarkers[0])!
    const m2 = timeline.markers.find(m => m.label.toLowerCase() === validMarkers[1])!
    const startTime = Math.min(m1.time, m2.time)
    const endTime = Math.max(m1.time, m2.time)
    const instruction = val.replace(/@\w+/g, '').trim()
    await transformClipBetweenMarkers(startTime, endTime, instruction)
  } else {
    // normal instruction — transform selected clip
    const selectedSrc = timeline.activeClipSrc
    if (selectedSrc) {
      await transformClipBetweenMarkers(null, null, val, selectedSrc)
    }
  }

  text.value = ''
  collapse()
}

function autoResize() {
  const el = taRef.value;
  if (!el) return;
  el.style.height = "auto";
  const h = Math.min(el.scrollHeight, 80);
  el.style.height = h + "px";
  tall.value = el.scrollHeight > 36;
  btnSize.value = Math.min(h, 36);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  if (e.key === "Escape") collapse();
}

function onClickOutside(e: MouseEvent) {
  if (expanded.value && !wrapperRef.value?.contains(e.target as Node)) collapse();
  onTaskPillClickOutside(e);
}

onMounted(async () => {
  document.addEventListener("mousedown", onClickOutside)
  const editor_slug = Number(pageRoute.params.id)
  project_id.value = editor_slug
  console.info("project_id.value:", project_id.value)
  project.value = await db.projects.get(project_id.value);
  pollInterval = setInterval(async () => {
    const activeJobs = ai.jobs.filter(j => j.status === 'PENDING' && j.taskId)
    console.log("Active jobs is: ", activeJobs)
    for (const job of activeJobs) {
      const results = await pollJob(job.id, job.taskId!)
      console.log("results: ", results)
    }
  }, 6000) //Let us poll every 6 seconds instead of 3 though docs say avoid fixed polling
});
onUnmounted(() => {
  document.removeEventListener("mousedown", onClickOutside)
  if (pollInterval) clearInterval(pollInterval)
});
</script>

<template>
  <main class="flex flex-col gap-y-1 px-2 py-2 h-screen w-screen bg-[#0d0d0d]">
    <nav class="flex h-8 items-center justify-between">
      <div class="flex items-center min-w-0">
        <!-- DISPLAY -->
         <button
          v-if="!editingTitle"
          class="text-sm text-white font-sans px-1.5 py-0.5 rounded-md hover:bg-[#1e1e1e] transition-colors truncate max-w-[220px]"
          @click="beginTitleEdit"
        >
          {{ projectTitle }}
        </button> 
      
        <!-- INPUT -->
         <input
          v-else
          ref="titleInputRef"
          v-model="projectTitle"
          type="text"
          maxlength="60"
          class=" border-none focus:border-none rounded-md px-2 py-1 text-sm text-white font-sans outline-none w-[220px]"
          @keydown.enter="saveProjectTitle"
          @blur="saveProjectTitle"
        /> 
      </div>
      <div>
        <button
          class="rounded-md gap-x-1.5 flex justify-center items-center px-2 py-1 bg-[#2567EC]"
        >
          <Download :size="12" color="#FFFFFF" :stroke-width="1.5" />
          <span class="font-sans leading-snug text-xs font-normal text-white"
            >Export</span
          >
        </button>
      </div>
    </nav>

    <section class="flex gap-x-1.5 h-[62.5%]">
      <div
        class="h-full w-1/3"
      >
        <ActionView />
      </div>
      <div
        class="h-full w-2/3"
      >
        <PreviewCanvas />
      </div>
      <div
        class="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg h-full w-1/3"
      ></div>
    </section>

    <!-- Timeline panel — relative so the pill can anchor to it -->
    <section class="relative flex h-[37.5%] w-full min-w-0">
      <!-- Timeline view -->
      <TimelineView class="flex-1 min-w-0" />
    
      <!-- Pill + Task Circle — floats above timeline, centered, no layout impact -->
      <div class="absolute bottom-full left-1/2 -translate-x-1/2 z-50 -mb-2.5 flex items-center gap-2">
      
        <!-- Task pill — absolute so it doesn't push the circle -->
        <Transition
          enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <div
            v-if="taskOpen"
            ref="taskPillRef"
            class="absolute bottom-full mb-2 left-0 bg-[#121212] border border-[#2e2e2e] min-w-[240px] p-[5px] z-50 shadow-xl"
            :class="aiJobs.length === 1 ? 'rounded-full' : 'rounded-[20px]'"
            @click.stop
          >
            <div
              v-for="job in aiJobs"
              :key="job.id"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full transition-opacity duration-500"
              :class="job.status === 'SUCCEEDED' ? 'opacity-35' : 'opacity-100'"
            >
              <span v-if="job.status === 'PENDING'" class="shrink-0 w-3.5 h-3.5">
                <svg class="animate-spin w-full h-full" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#2a2a2a" stroke-width="1.5"/>
                  <circle cx="7" cy="7" r="5" stroke="#0099ff" stroke-width="1.5" stroke-dasharray="8 24" stroke-linecap="round"/>
                </svg>
              </span>
              <span v-else class="flex justify-center items-center">
                <CircleCheck v-if="job.status == 'SUCCEEDED'" class="flex items-center justify-center" :size="13" :stroke-width="1.5" color="#5CB85C" />
                <CircleAlert v-else class="flex items-center justify-center" :size="13" :stroke-width="1.5" color="#FF4D4D"  />
              </span>
              <span
                class="font-sans text-xs flex-1 whitespace-nowrap"
                :class="job.status === 'FAILED' ? 'text-[#ff4d4d]' : job.status === 'SUCCEEDED' ? 'text-[#5CB85C]' : 'text-[#b0b0b0]'"
              >
                {{ job.description }}
              </span>
            </div>
          </div>
        </Transition>
      
        <!-- Command pill -->
        <div
          ref="wrapperRef"
          class="transition-all duration-200"
          :class="taskOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'"
        >
          <div
            class="flex items-end gap-1.5 bg-[#121212] border border-[#2e2e2e] cursor-text transition-all duration-500"
            :class="[
              expanded ? 'w-[300px] pl-4 pr-1 py-1' : 'w-[170px] px-2',
              tall ? 'rounded-[20px]' : 'rounded-full',
            ]"
            style="transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1)"
            @click="expandPill"
          >
            <span
              v-show="!expanded"
              class="flex-1 text-[#555] font-sans text-xs pointer-events-none whitespace-nowrap leading-7 text-center"
            >
              ✦ Tell Flips what to do
            </span>
          
            <!-- highlight overlay — sits on top of textarea visually -->
            <div v-show="expanded" class="relative flex-1">
              <!-- invisible textarea for input -->
              <textarea
                ref="taRef"
                v-model="text"
                placeholder="Tell Flips what to do..."
                rows="1"
                class="w-full noscrollbar font-sans bg-transparent border-none outline-none resize-none text-transparent caret-white text-xs leading-relaxed placeholder-[#444] min-h-5 overflow-y-auto absolute inset-0"
                style="max-height: 80px; color: transparent;"
                @input="autoResize"
                @keydown="onKeydown"
              />
              <!-- highlight layer — rendered on top, pointer-events-none -->
              <div
                class="font-sans text-xs leading-relaxed text-[#f0f0f0] min-h-5 whitespace-pre-wrap break-words pointer-events-none"
                style="max-height: 80px"
                v-html="highlightedText || '<span class=\'text-[#444]\'>Tell Flips what to do...</span>'"
              />
            </div>
          
            <Transition
              enter-active-class="transition-all duration-300"
              enter-from-class="opacity-0 scale-75"
              enter-to-class="opacity-100 scale-100"
            >
              <button
                v-if="expanded"
                :disabled="!text.trim()"
                class="shrink-0 rounded-full bg-[#0099ff] hover:bg-[#0088ee] active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-150"
                :style="{ width: btnSize + 'px', height: btnSize + 'px' }"
                @click.stop="send"
              >
                <ArrowUp :size="12" :stroke-width="1.5" color="#fff" />
              </button>
            </Transition>
          </div>
        </div>
      
        <!-- Activity circle — black bg, stays fixed -->
        <Transition
          enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          enter-from-class="opacity-0 scale-50"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-50"
        >
          <div
            v-if="activeJobCount > 0"
            class="relative w-[34px] h-[34px] cursor-pointer flex-shrink-0"
            @click="toggleTasks"
          >
            <!-- black circle background -->
            <div class="absolute inset-0 rounded-full bg-[#121212] border border-[#2e2e2e]" />
            <!-- spinner ring -->
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="13" stroke="#1e1e1e" stroke-width="2"/>
              <circle
                cx="17" cy="17" r="13"
                stroke="#0099ff" stroke-width="2"
                stroke-dasharray="22 66"
                stroke-linecap="round"
                class="origin-center animate-spin"
                style="animation-duration: 1.4s"
              />
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white z-10">
              {{ activeJobCount }}
            </span>
          </div>
        </Transition>
      </div>
    </section>
  </main>
</template>