export interface MediaAsset {
  id?: number
  name: string
  type: string
  size: number
  file: File
  previewUrl: string
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