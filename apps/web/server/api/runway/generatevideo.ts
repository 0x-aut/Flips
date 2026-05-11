export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const machineToken = getHeader(event, 'Machine-Token') ?? ''

  return await $fetch(`${config.modalBaseUrl}/runway/generatevideo`, {
    method: 'POST',
    headers: { 'Machine-Token': machineToken, 'Content-Type': 'application/json' },
    body,
  })
})