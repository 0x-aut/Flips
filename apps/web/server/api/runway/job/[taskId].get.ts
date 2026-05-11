export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'taskId')
  const config = useRuntimeConfig()
  const machineToken = getHeader(event, 'Machine-Token') ?? ''

  const job_response =  await $fetch(`${config.modalBaseUrl}/runway/job/${taskId}`, {
    method: "GET",
    headers: { 'Machine-Token': machineToken },
  })
  console.log("JOB RESPONSE: ", job_response.task)
  // let returned_response = {
  //   task: {
  //     id: job_response.task.id,
  //     output: job_response.task.output,
  //     status: job_response.task.status,
  //     createdAt: job_response.task.createdAt,
  //     progress: job_response.task.progress,
  //   },
  // }
  // console.log("RETURNED RESPONSE: ", returned_response)
  return job_response.task
})