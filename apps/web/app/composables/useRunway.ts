import { nanoid } from 'nanoid'
import { useAiStore } from '@/stores/ai'
import { useTimelineStore } from '@/stores/timeline'

export function useRunway() {
  const ai = useAiStore()
  const timeline = useTimelineStore()

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
        body: { promptText, promptImage }
      })

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
        body: { videoUrl, promptText }
      })

      const output = await pollUntilDone(taskId, jobId)
      if (!output) return

      // replace selected clip src with transformed output
      const selectedId = timeline.selectedClipId
      if (selectedId) {
        timeline.updateClipSrc(selectedId, output)
      }

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

      const result = await $fetch<{
        status: string
        output: string | null
        progress: number
      }>(`/api/runway/job/${taskId}`)

      if (result.status === 'SUCCEEDED') return result.output
      if (result.status === 'FAILED') {
        ai.failJob(jobId, 'Runway task failed')
        return null
      }

      attempts++
    }

    ai.failJob(jobId, 'Timed out after 2 minutes')
    return null
  }

  function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
  }

  return { generateClip, transformClip }
}