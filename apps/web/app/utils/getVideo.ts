import { db } from "@/db";

export default async function (url: string) {
  //I will do this via client
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("An error occurred while fetching url")
  }
  
  const blob = await response.blob();
  await saveVideo(blob)
}

async function saveVideo(blob: Blob) {
  try {
    const file = new File(
      [blob],
      'runway-output.mp4',
      {
        type: 'video/mp4',
        lastModified: Date.now()
      }
    )
    if (file.type.startsWith("video")) {
      const previewUrl = URL.createObjectURL(file)
      // let thumbnail, duration, formattedDuration
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'audio'
      const result = await generateVideoThumbnail(file)
      const thumbnail = result.thumbnail
      const duration = result.duration
      const formattedDuration = formatDuration(result.duration)
      await db.media.add({ name: file.name, type, size: file.size, file, previewUrl, thumbnail, duration, formattedDuration, createdAt: new Date() } as MediaAsset)
    }
  } catch (err) {
    console.error('Import failed:', err) 
  }
  
}