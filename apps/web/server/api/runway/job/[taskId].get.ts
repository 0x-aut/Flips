export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'taskId')
  const config = useRuntimeConfig()
  const machineToken = getHeader(event, 'Machine-Token') ?? ''

  const job_response =  await $fetch(`${config.modalBaseUrl}/runway/job/${taskId}`, {
    method: "GET",
    headers: { 'Machine-Token': machineToken },
  })
  console.log("JOB RESPONSE: ", job_response)
  return job_response
})