<script setup lang="ts">


import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { Download, ArrowUp } from "@lucide/vue";

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

function send() {
  const val = text.value.trim();
  if (!val) return;
  text.value = "";
  collapse();
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
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
  if (e.key === "Escape") collapse();
}

function onClickOutside(e: MouseEvent) {
  if (expanded.value && !wrapperRef.value?.contains(e.target as Node))
    collapse();
}

onMounted(() => document.addEventListener("mousedown", onClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", onClickOutside));
</script>

<template>
  <main class="flex flex-col gap-y-1 px-2 py-2 h-screen w-screen bg-[#0d0d0d]">
    <nav class="flex h-8 items-center justify-between">
      <div>
        <span class="text-sm text-white font-sans">New project</span>
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
    <section class="relative flex h-[37.5%]">
      <!-- timeline content goes here -->
      <Timeline />
    
      <!-- Pill + Task Circle — floats above timeline, centered, no layout impact -->
      <div class="absolute bottom-full left-1/2 -translate-x-1/2 z-50 -mb-2.5 flex items-center gap-2">
    
        <!-- Task pill (replaces command pill when open) -->
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
            class="bg-[#121212] border border-[#2e2e2e] min-w-[220px] p-[5px] z-50"
            :class="aiJobs.length === 1 ? 'rounded-full' : 'rounded-[20px]'"
            @click.stop
          >
            <div
              v-for="job in aiJobs"
              :key="job.id"
              class="flex items-center gap-2 px-3 py-1 rounded-full transition-opacity duration-500"
              :class="job.status === 'done' ? 'opacity-35' : 'opacity-100'"
            >
              <span v-if="job.status === 'processing'" class="flex-shrink-0 w-4 h-4">
                <svg class="animate-spin w-full h-full" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#2a2a2a" stroke-width="1.5"/>
                  <circle cx="7" cy="7" r="5" stroke="#0099ff" stroke-width="1.5"
                    stroke-dasharray="8 24" stroke-linecap="round"/>
                </svg>
              </span>
              <span v-else class="flex-shrink-0 w-4 text-center text-[13px]">
                {{ job.status === 'done' ? '✓' : '✗' }}
              </span>
              <span
                class="font-sans text-xs flex-1 whitespace-nowrap"
                :class="job.status === 'failed' ? 'text-[#ff4d4d]' : job.status === 'done' ? 'text-[#555]' : 'text-[#b0b0b0]'"
              >
                {{ job.description }}
              </span>
            </div>
          </div>
        </Transition>
    
        <!-- Command pill (hidden when task list is open) -->
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
            <textarea
              v-show="expanded"
              ref="taRef"
              v-model="text"
              placeholder="Tell Flips what to do..."
              rows="1"
              class="flex-1 noscrollbar font-sans bg-transparent border-none outline-none resize-none text-[#f0f0f0] text-xs leading-relaxed placeholder-[#444] min-h-5 overflow-y-auto"
              style="max-height: 80px"
              @input="autoResize"
              @keydown="onKeydown"
            />
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
    
        <!-- Activity circle -->
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
            <span class="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-[#e0e0e0]">
              {{ activeJobCount }}
            </span>
          </div>
        </Transition>
    
      </div>
    </section>
  </main>
</template>