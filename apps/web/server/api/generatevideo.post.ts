export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const res = await $fetch(`${config.modalBaseUrl}/runway/generate`, {
    method: 'POST',
    body,
    // headers: {
    //   "Content-Type": "application/json",
    //   "Machine-Token": ""
    // }
  })

  return res
})