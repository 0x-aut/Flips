<script setup lang="ts">
import { ref } from "vue"
import { X, FolderPlus, Check } from "@lucide/vue"

import { db } from "@/db"

const emit = defineEmits<{
  close: []
}>()

const projectName = ref("")
const selectedRatio = ref("16:9")

const creating = ref(false)

async function createProject() {
  if (!projectName.value.trim()) return

  creating.value = true

  try {

    await db.projects.add({
      name: projectName.value.trim(),

      ratio: selectedRatio.value,

      createdAt: Date.now()
    })

    emit("close")

  } catch (error) {
    console.error("Failed to create project:", error)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      @mousedown.self="emit('close')"
    >
      <div
        class="w-[340px] bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden shadow-2xl"
      >

        <!-- Header -->
        <div class="flex items-center justify-between px-3.5 py-2.5 border-b border-[#2e2e2e]">
          <span class="text-white font-sans text-xs">
            New project
          </span>

          <button
            class="flex items-center justify-center w-5 h-5 rounded hover:bg-[#2a2a2a] transition-colors"
            @click="emit('close')"
          >
            <X :size="12" color="#555" :stroke-width="1.5" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex flex-col p-2 gap-y-2">

          <!-- Name -->
          <div
            class="flex items-center gap-x-2 px-2.5 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] focus-within:border-[#3a3a3a] transition-colors"
          >
            <FolderPlus :size="13" color="#666" :stroke-width="1.5" />

            <input
              v-model="projectName"
              type="text"
              placeholder="Project name"
              class="w-full bg-transparent outline-none text-white font-sans text-xs placeholder-[#444]"
            />
          </div>

          <!-- Ratio -->
          <button
            class="flex items-center justify-between px-2.5 py-2 rounded-lg border transition-colors"
            :class="
              selectedRatio === '16:9'
                ? 'border-[#2567EC]/30 bg-[#2567EC]/5'
                : 'border-[#2a2a2a] bg-[#1a1a1a]'
            "
            @click="selectedRatio = '16:9'"
          >
            <div class="flex flex-col items-start">
              <span class="text-white font-sans text-xs">
                16:9
              </span>

              <span class="text-[#555] font-sans text-[10px]">
                Landscape video
              </span>
            </div>

            <div
              class="flex items-center justify-center w-4 h-4 rounded-full border"
              :class="
                selectedRatio === '16:9'
                  ? 'border-[#2567EC]'
                  : 'border-[#444]'
              "
            >
              <Check
                v-if="selectedRatio === '16:9'"
                :size="9"
                color="#2567EC"
                :stroke-width="2"
              />
            </div>
          </button>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-x-1 pt-1">
            <button
              class="px-3 py-1.5 flex items-center rounded-md hover:bg-[#1e1e1e] transition-colors"
              @click="emit('close')"
            >
              <span class="text-[#666] font-sans text-xs">
                Cancel
              </span>
            </button>

            <button
              class="px-3 py-1.5 flex items-center rounded-md bg-[#FAFAFA] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!projectName.trim()"
              @click="createProject"
            >
              <span class="text-[#121212] font-sans text-xs font-medium">
                Create
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>
```
