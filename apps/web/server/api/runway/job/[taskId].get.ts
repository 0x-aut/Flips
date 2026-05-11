export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'taskId')
  const config = useRuntimeConfig()
  const machineToken = getHeader(event, 'Machine-Token') ?? ''

  const job_response =  await $fetch(`${config.modalBaseUrl}/runway/job/${taskId}`, {
    method: "GET",
    headers: { 'Machine-Token': machineToken },
  })
  console.log("JOB RESPONSE: ", job_response.id)
  let returned_response = {
    task: {
      id: job_response.id,
      output: job_response.output,
      status: job_response.status,
      createdAt: job_response.createdAt,
      progress?: job_response.progress?
    },
  }
  console.log("RETURNED RESPONSE: ", returned_response)
  return job_response
})