import { nanoid } from 'nanoid'
import { useAiStore } from '@/stores/ai'
import { useTimelineStore } from '@/stores/timeline'
import { useIdentity } from '@/composables/useIdentity'

export function useRunway() {
  const ai = useAiStore()
  const timeline = useTimelineStore()
  const { getOrCreateToken } = useIdentity()

  function headers() {
    return { 'Machine-Token': getOrCreateToken() }
  }

  async function generateClip(promptText: string, promptImage?: string) {
    const jobId = nanoid()
    ai.addJob({
      id: jobId,
      type: 'generate',
      description: `Generating: "${promptText.slice(0, 35)}..."`,
      status: 'processing',
    })
    try {
      const { taskId } = await $fetch<{ taskId: string }>('/api/runway/generatevideo', {
        method: 'POST',
        headers: headers(),
        body: { prompt: promptText, promptImage, duration: 5 },
      })
      ai.updateJobTaskId(jobId, taskId)
      const output = await pollUntilDone(taskId, jobId)
      if (!output) return
      const existingClips = timeline.tracks.flatMap(t => t.clips)
      timeline.addClipToTrack('video-1', {
        name: promptText.slice(0, 30),
        src: output,
        duration: 5,
        startTime: existingClips.length === 0 ? 0 : timeline.totalDuration,
        trim: { in: 0, out: 0 },
        speed: 1,
        thumbnails: [],
      })
      ai.completeJob(jobId)
    } catch (err) {
      console.error(err)
      ai.failJob(jobId, 'Generation failed')
    }
  }

  async function pollJob(jobId: string, taskId: string) {
    try {
      const result = await $fetch<{ status: string; output: string | null }>(
        `/api/runway/job/${taskId}`,
        { method: "GET", headers: headers() }
      )
      if (result.status === 'SUCCEEDED' && result.output) {
        const job = ai.jobs.find(j => j.id === jobId)
        if (job?.type === 'generate') {
          const existingClips = timeline.tracks.flatMap(t => t.clips)
          timeline.addClipToTrack('video-1', {
            name: job.description.replace('Generating: "', '').replace('..."', '').slice(0, 30),
            src: result.output,
            duration: 5,
            startTime: existingClips.length === 0 ? 0 : timeline.totalDuration,
            trim: { in: 0, out: 0 },
            speed: 1,
            thumbnails: [],
          })
        }
        if (job?.type === 'transform' && timeline.selectedClipId) {
          timeline.updateClipSrc(timeline.selectedClipId, result.output)
        }
        ai.completeJob(jobId)
      }
      if (result.status === 'FAILED') {
        ai.failJob(jobId, 'Runway task failed')
      }
    } catch (err) {
      console.warn('Poll failed silently:', err)
    }
  }

  async function transformClip(videoUrl: string, promptText: string) {
    const jobId = nanoid()
    ai.addJob({
      id: jobId,
      type: 'transform',
      description: `Transforming: "${promptText.slice(0, 35)}..."`,
      status: 'processing',
    })
    try {
      const { taskId } = await $fetch<{ taskId: string }>('/api/runway/transform', {
        method: 'POST',
        headers: headers(),
        body: { videoUrl, promptText },
      })
      ai.updateJobTaskId(jobId, taskId)
      const output = await pollUntilDone(taskId, jobId)
      if (!output) return
      const selectedId = timeline.selectedClipId
      if (selectedId) timeline.updateClipSrc(selectedId, output)
      ai.completeJob(jobId)
    } catch (err) {
      ai.failJob(jobId, 'Transform failed')
    }
  }

  async function pollUntilDone(taskId: string, jobId: string): Promise<string | null> {
    const maxAttempts = 60
    let attempts = 0
    while (attempts < maxAttempts) {
      await sleep(2000)
      try {
        const result = await $fetch<{ status: string; output: string | null; progress: number }>(
          `/api/runway/job/${taskId}`,
          { headers: headers() }
        )
        if (result.status === 'SUCCEEDED') return result.output
        if (result.status === 'FAILED') {
          ai.failJob(jobId, 'Runway task failed')
          return null
        }
      } catch (err) {
        // network hiccup — keep polling
        console.warn('Poll error, retrying...', err)
      }
      attempts++
    }
    ai.failJob(jobId, 'Timed out after 2 minutes')
    return null
  }

  function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
  }

  return { generateClip, transformClip, pollJob }
}