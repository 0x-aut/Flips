import { db } from "@/db";

export default async function (url: string) {
  //I will do this via client
  console.info("Downloading file")
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("An error occurred while fetching url")
  }
  
  const blob = await response.blob();
  console.info("Downloaded file, saving video")
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
      console.log("Generated file is an: ", type)
      let result, thumbnail, duration, formattedDuration
      if (type === "video") {
        result = await generateVideoThumbnail(file)
        thumbnail = result.thumbnail
        duration = result.duration
        formattedDuration = formatDuration(result.duration) 
      }
      console.log("Generated file is an: ", file)
      await db.media.add({ name: file.name, type, size: file.size, file, previewUrl, thumbnail, duration, formattedDuration, createdAt: new Date() } as MediaAsset)
    }
  } catch (err) {
    console.error('Import failed:', err) 
  }
  
}