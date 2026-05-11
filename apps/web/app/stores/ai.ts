// stores/ai.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type JobType = 'generate' | 'transform' | 'sound' | 'isolate' | 'transcribe' | 'muse' | 'export'
export type JobStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED'

export interface AIJob {
  id: string
  type: JobType
  description: string
  status: JobStatus
  taskId?: string      // runway/modal task id for polling
  clipId?: string      // which clip this job affects
  error?: string
  createdAt: number
}

export const useAiStore = defineStore('ai', () => {
  const jobs = ref<AIJob[]>([])

  const activeJobCount = computed(() =>
    jobs.value.filter(j => j.status === 'PENDING').length
  )

  const hasJobs = computed(() => jobs.value.length > 0)

  function addJob(job: Omit<AIJob, 'createdAt'>) {
    jobs.value.push({ ...job, createdAt: Date.now() })
  }

  function updateJobTaskId(id: string, taskId: string) {
    const job = jobs.value.find(j => j.id === id)
    if (job) job.taskId = taskId
  }

  function completeJob(id: string) {
    const job = jobs.value.find(j => j.id === id)
    if (!job) return
    job.status = 'SUCCEEDED'
    setTimeout(() => {
      jobs.value = jobs.value.filter(j => j.id !== id)
    }, 2000)
  }

  function failJob(id: string, error: string) {
    const job = jobs.value.find(j => j.id === id)
    if (!job) return
    job.status = 'FAILED'
    job.error = error
  }

  function dismissJob(id: string) {
    jobs.value = jobs.value.filter(j => j.id !== id)
  }

  function clearCompleted() {
    jobs.value = jobs.value.filter(j => j.status === 'PENDING')
  }

  return {
    jobs,
    activeJobCount,
    hasJobs,
    addJob,
    updateJobTaskId,
    completeJob,
    failJob,
    dismissJob,
    clearCompleted,
  }
}, {
  persist: {
    storage: piniaPluginPersistedstate.localStorage(),
  }
})