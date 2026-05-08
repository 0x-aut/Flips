import { Dexie, type EntityTable } from 'dexie';
import type { Project, MediaAsset, TimelineClip } from "#shared/types/Media";


// I dont need to save machine_id here just the blobs and metadata where necessary, i will iron out details later 
class FlipsDatabase extends Dexie {
  projects!: EntityTable<Project>
  media!: EntityTable<MediaAsset>
  timeline!: EntityTable<TimelineClip>

  constructor() {
    super("flips-db")

    this.version(1).stores({
      projects: "++id, name, ratio, createdAt",
      media: "++id, name, type",
      timeline: "++id, projectId, mediaAssetId",
    })
  } 
}

export const db = new FlipsDatabase();