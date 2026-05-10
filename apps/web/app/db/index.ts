// db/index.ts
import { Dexie, type EntityTable } from 'dexie'
import type { Project, MediaAsset, TimelineClip } from '#shared/types/Media'

class FlipsDatabase extends Dexie {
  projects!: EntityTable<Project>
  media!: EntityTable<MediaAsset>
  timeline!: EntityTable<TimelineClip>

  constructor() {
    super('flips-db')
    this.version(1).stores({
      projects: '++id, name, ratio, createdAt',
      media: '++id, name, type',
      timeline: '++id, projectId, mediaAssetId',
    })
    // version 2 — adds thumbnail, duration fields (non-indexed, no migration needed)
    this.version(2).stores({
      projects: '++id, name, ratio, createdAt',
      media: '++id, name, type, createdAt',
      timeline: '++id, projectId, mediaAssetId',
    })
  }
}

export const db = new FlipsDatabase()