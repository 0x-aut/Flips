export default async function(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  generateImageFile.value = file
  const reader = new FileReader()
  reader.onload = () => { generateImageDataUri.value = reader.result as string }
  reader.readAsDataURL(file)
}
