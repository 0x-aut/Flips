import { nanoid } from 'nanoid'
import { useAiStore } from '@/stores/ai'
import { useTimelineStore } from '@/stores/timeline'
import { useIdentity } from '@/composables/useIdentity'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from "@ffmpeg/util";



export function useRunway() {
  let ffmpeg: FFmpeg | null = null
  const ai = useAiStore()
  const timeline = useTimelineStore()
  const { getOrCreateToken } = useIdentity()

  function headers() {
    return { 'Machine-Token': getOrCreateToken() }
  }
  
  async function generateClip(
    generateData: {
      promptText: string,
      model: string,
      duration: number,
      promptImg?: string,
    },
  ) {
    console.log(generateData)
    const jobId = nanoid()
    ai.addJob({
      id: jobId,
      type: 'generate',
      description: `Generating: "${generateData.promptText.slice(0, 35)}..."`,
      status: 'PENDING',
    })
    try {
      const { taskId } = await $fetch<{ taskId: string }>('/api/runway/generatevideo', {
        method: 'POST',
        headers: headers(),
        body: {
          model: generateData.model,
          prompt: generateData.promptText,
          promptImg: generateData.promptImg,
          duration: generateData.duration
        },
      })
      ai.updateJobTaskId(jobId, taskId)
      const output = await pollUntilDone(taskId, jobId)
      if (!output) return
      const existingClips = timeline.tracks.flatMap(t => t.clips)
      timeline.addClipToTrack('video-1', {
        name: generateData.promptText.slice(0, 30),
        src: output,
        duration: generateData.duration,
        startTime: existingClips.length === 0 ? 0 : timeline.totalDuration,
        trim: { in: 0, out: 0 },
        speed: 1,
        thumbnails: [],
      })
      ai.completeJob(jobId)
    } catch (err) {
      console.error(err)
      ai.failJob(jobId, 'Video Generation failed')
    }
  }
  
  async function getFFmpeg() {
    if (ffmpeg) return ffmpeg
    ffmpeg = new FFmpeg()
    await ffmpeg.load()
    return ffmpeg
  }
  
  async function extractSegment(
    src: string,
    startTime: number,
    endTime: number
  ) {
  
    const ff = await getFFmpeg()
  
    const duration = endTime - startTime
  
    await ff.writeFile(
      "input.mp4",
      await fetchFile(src)
    )
  
    await ff.exec([
      '-ss', String(startTime),
      '-i', 'input.mp4',
      '-t', String(duration),
    
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
    
      '-c:a', 'aac',
    
      'output.mp4'
    ])
  
    const data = await ff.readFile("output.mp4")
  
    if (typeof data === "string") {
      throw new Error("Expected binary data")
    }
  
    const segmentedFile = new File(
      [data],
      "segment.mp4",
      {
        type: "video/mp4"
      }
    )

    return uploadRunwayFile(segmentedFile, "segment.mp4")
  }

  async function pollJob(jobId: string, taskId: string) {
    try {
      const result = await $fetch<{ status: string; output: string | null }>(
        `/api/runway/job/${taskId}`,
        { method: "GET", headers: headers() }
      )
      // console.log(result)
      if (result.status == 'SUCCEEDED') {
        const job = ai.jobs.find(j => j.id == jobId)
        if (job?.type === 'generate') {
          job.status = result.status
          // For now i just want to update the import for clicking
          try {
            await getVideo(result.output[0])
          } catch (err) {
            console.log("An error occurred while saving generated video: ", err)
          }
          // const existingClips = timeline.tracks.flatMap(t => t.clips)
          // timeline.addClipToTrack('video-1', {
          //   name: job.description.replace('Generating: "', '').replace('..."', '').slice(0, 30),
          //   src: result.output,
          //   duration: 5,
          //   startTime: existingClips.length === 0 ? 0 : timeline.totalDuration,
          //   trim: { in: 0, out: 0 },
          //   speed: 1,
          //   thumbnails: [],
          // })
        }
        if (job?.type === 'transform' && timeline.selectedClipId) {
          timeline.updateClipSrc(timeline.selectedClipId, result.output[0])
        }
        ai.completeJob(jobId)
      }
      if (result.status === 'FAILED') {
        ai.failJob(jobId, 'Runway task failed')
      }
      // return result
    } catch (err) {
      console.warn('Poll failed silently:', err)
    }
  }

  async function transformClip(videoUrl: string, promptText: string) {
    const jobId = nanoid()
    ai.addJob({
      id: jobId,
      type: 'transform',
      description: `Editing: "${promptText.slice(0, 35)}..."`,
      status: 'PENDING',
    })
    try {
      const { taskId } = await $fetch<{ taskId: string }>('/api/runway/transform', {
        method: 'POST',
        headers: headers(),
        body: {
          prompt: promptText,
          promptVideoSrc: videoUrl
        },
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
  async function transformClipBetweenMarkers(
    startTime: number | null,
    endTime: number | null,
    instruction: string,
    overrideSrc?: string
  ) {
    const jobId = nanoid()
    const hasMarkers = startTime !== null && endTime !== null
  
    ai.addJob({
      id: jobId,
      type: 'transform',
      description: hasMarkers
        ? `Editing ${instruction.slice(0, 30)}...`
        : `Transforming: "${instruction.slice(0, 30)}..."`,
      status: 'PENDING',
    })
  
    try {
      let videoDataUri: string
  
      if (hasMarkers) {
        // find the clip that spans this time range
        const clip = findClipAtTime(startTime!)
        if (!clip) {
          ai.failJob(jobId, 'No clip found between markers')
          return
        }
        videoDataUri = await extractSegment(clip.src, startTime!, endTime!)
      } else {
        const src = overrideSrc ?? timeline.activeClipSrc
        if (!src) { ai.failJob(jobId, 'No clip selected'); return }
        videoDataUri = src
      }
  
      const { taskId } = await $fetch<{ taskId: string }>('/api/runway/transform', {
        method: 'POST',
        headers: headers(),
        body: {
          promptVideoSrc: videoDataUri,
          prompt: instruction,
        }
      })
  
      ai.updateJobTaskId(jobId, taskId)
    } catch (err) {
      console.error(err)
      ai.failJob(jobId, 'Transform failed')
    }
  }
  
  function findClipAtTime(time: number) {
    for (const track of timeline.tracks) {
      for (const clip of track.clips) {
        const end = clip.startTime + clip.duration
        if (time >= clip.startTime && time <= end) return clip
      }
    }
    return null
  }

  async function pollUntilDone(taskId: string, jobId: string): Promise<string | null> {
    const maxAttempts = 100
    let attempts = 0
    while (attempts < maxAttempts) {
      await sleep(6000)
      try {
        const result = await $fetch<{ status: string; output: string | null; progress: number }>(
          `/api/runway/job/${taskId}`,
          { headers: headers() }
        )
        if (result.status === 'SUCCEEDED') {
          console.log("SUCCEEDED JOB")
          await getVideo(result.output[0]) // TEST the [id].vue polljob to see if it can only be one function call
          return result.output
        }
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
    ai.failJob(jobId, 'Timed out after max attempts') // Correct this to handle long request times
    return null
  }
  
  async function generateSound(promptText: string, soundDuration: number) {
    const jobId = nanoid()
    ai.addJob({
      id: jobId,
      type: 'sound',
      description: `Generating: "${promptText.slice(0, 35)}..."`,
      status: 'PENDING',
    })
    try {
      const { taskId } = await $fetch<{ taskId: string }>('/api/runway/soundeffect', {
        method: 'POST',
        headers: headers(),
        body: {
          prompt: promptText,
          duration: soundDuration
        }
      })
      ai.updateJobTaskId(jobId, taskId)
      const output = await pollUntilDone(taskId, jobId)
      if (!output) return
      ai.completeJob(jobId)
    } catch (error) {
      console.error(error)
      ai.failJob(jobId, 'Sound Generation failed')
    }
    // Right now runway gives us a video file instead of an audio file, we need to convert to audio in order to push it in the right timeline track
  }

  function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
  }

  return { generateClip, generateSound, transformClip, pollJob }
}