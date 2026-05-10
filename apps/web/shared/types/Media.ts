// shared/types/Media.ts

export interface MediaAsset {
  id?: number
  name: string
  type: 'video' | 'image' | 'audio'
  size: number
  file: File
  previewUrl: string        // regenerated from file on load
  thumbnail?: string        // base64 jpeg — persists across sessions
  duration?: number         // seconds, for video/audio
  formattedDuration?: string // "01:24"
  createdAt: Date
}

export interface Project {
  id?: number
  name: string
  ratio: string
  createdAt: number
}

export interface TimelineClip {
  id?: number
  projectId: number
  mediaAssetId: number
  start: number
  end: number
  track: number
}