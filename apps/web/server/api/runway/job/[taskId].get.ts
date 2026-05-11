export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'taskId')
  const config = useRuntimeConfig()
  const machineToken = getHeader(event, 'Machine-Token') ?? ''

  return await $fetch(`${config.modalBaseUrl}/runway/job/${taskId}`, {
    method: "GET",
    headers: { 'Machine-Token': machineToken },
  })
})