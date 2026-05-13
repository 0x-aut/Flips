/*
This util uploads file ephemerally to runway for the sole purpose of manipulating it when necessary.
It will have its own upload progress report and will update the jobs in the job list
The main aim is to send to runway and then return the uri for the backend to use where necessary.

IMPORTANT NOTE: This seems to be the fastest method for now,
I will test sending a file or blob to the backend to test compared to this one
*/
import RunwayML, { toFile } from "@runwayml/sdk";


export default async function(uploadedFile: File | Blob | BlobPart, uploadedFileName: string) {
  const config = useRuntimeConfig()
  const api_key = config.runwayStorageKey as string | undefined;
  const runwaymlClient = new RunwayML({ apiKey: api_key })
  try {
    const file = await toFile(
      uploadedFile,
      `${uploadedFileName}`
    )
    const { uri } = await runwaymlClient.uploads.createEphemeral(file)
    return uri
  } catch (error) {
    console.log("An error occurred uploading file to runway upload: ", error)
    throw new Error("An error occurred sending files to runway upload")
  }
}