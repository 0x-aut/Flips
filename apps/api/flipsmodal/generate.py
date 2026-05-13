# This will have the functions for generating videos, images and a little bit of manipulation for the api
# For muse, normal video generation and others
import os
from dotenv import load_dotenv
from config import getRunway
from runwayml import RunwayML, TaskFailedError
from models import GenerateVideo, TransformVideo

load_dotenv()

# client = RunwayML(api_key=os.getenv("FLIPS_RUNWAYML_API_KEY"))


def generate_video(generateVideo: GenerateVideo):
  client = getRunway()
  try:
    task = client.text_to_video.create(
      model=generateVideo.model,
      prompt_text=generateVideo.prompt,
      ratio="1280:720",
      duration=generateVideo.duration,
    )
    print("Task complete:", task)
    print(f"Task id is: {task.id}")
    return task.id
  except TaskFailedError as e:
    print("The video failed to generate")
    print(e.task_details)


def transform_video(transformVideo: TransformVideo):
  client = getRunway()
  try:
    transform_task = client.video_to_video.create(
     model = "gen4_aleph",
     prompt_text = transformVideo.prompt,
     videoUri = transformVideo.promptVideoSrc
    )
    print(f"Transform task is: {transform_task}")
    return transform_task.id
  except TaskFailedError as e:
    print("The video failed to generate")
    print(e.task_details)



