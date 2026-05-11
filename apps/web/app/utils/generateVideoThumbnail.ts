export default function(file: File): Promise<{ thumbnail: string; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.playsInline = true
    video.addEventListener("loadedmetadata", () => { video.currentTime = Math.min(1, video.duration * 0.1) })
    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas")
      canvas.width = 240; canvas.height = 135
      canvas.getContext("2d")!.drawImage(video, 0, 0, 240, 135)
      const thumbnail = canvas.toDataURL("image/jpeg", 0.7)
      URL.revokeObjectURL(url)
      resolve({ thumbnail, duration: video.duration })
    })
    video.load()
  })
}