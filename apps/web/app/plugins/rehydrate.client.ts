// For media link to remain on page refresh
import { db } from "@/db";

export default defineNuxtPlugin(async () => {
  const timeline = useTimelineStore()
  for (const track of timeline.tracks) {
    for (const clip of track.clips) {
      if (!clip.mediaAssetId) continue
      const asset = await db.media.get(clip.mediaAssetId)
      if (asset) clip.src = URL.createObjectURL(asset.file)
    }
  }
})