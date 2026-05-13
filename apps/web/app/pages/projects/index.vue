<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";
import { useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";
import { db } from "@/db";

const showCreateProjectModal = ref(false)


// This function will create a project in the database and move to the editor with the id
async function createNewProject() { 
  showCreateProjectModal.value = true
}

const loading = ref(true)

const projects = useObservable(
  liveQuery(async () => {
    const data = await db.projects
      .orderBy("createdAt")
      .reverse()
      .toArray()

    loading.value = false
    return data
  })
)

const skeletonCount = 6
</script>

<template>
  <main class="mr-8.25 ml-8.25 mt-4 flex flex-col gap-y-10">
    <nav class="flex w-full items-center justify-between">
      <span class="font-sans text-white flex gap-x-2 items-center">
        <NuxtLink to="/" class="text-[#555555] font-medium text-sm leading-snug">Home</NuxtLink>
        <ChevronRight :size="13" color="#555555" :stroke-width="1.5" />
        <span class="text-sm font-medium leading-snug">All Projects</span>
      </span>
      <div class="flex items-center">
        <button @click="createNewProject" class="flex items-center gap-x-1 justify-center pl-3 pr-3 pt-1 pb-1 bg-[#FAFAFA] rounded-lg">
          <span class="font-sans text-sm text-[#121212] font-medium leading-snug">New project</span>
        </button>
      </div>
    </nav>
    <!-- Selection and options section and projects section -->
    <section
      class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2"
    >
      <!-- Skeletons -->
      <template v-if="loading">
        <ProjectSkeleton
          v-for="n in skeletonCount"
          :key="n"
        />
      </template>
      <!-- This place will load all projects in db and use it there -->
      <template v-else>
        <ProjectView
          v-for="project in projects"
          :key="project.id"
          :project="project"
          @open="navigateTo(`/editor/${$event}`)"
        />
      </template>
    </section>
    <BaseProjectModal
      v-if="showCreateProjectModal"
      @close="showCreateProjectModal = false"
    />
  </main>
</template>