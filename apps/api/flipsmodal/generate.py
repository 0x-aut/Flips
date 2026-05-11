# This will have the functions for generating videos, images and a little bit of manipulation for the api
# For muse, normal video generation and others
import os
from dotenv import load_dotenv
from config import getRunway
from runwayml import RunwayML, TaskFailedError
from models import GenerateVideo

load_dotenv()

# client = RunwayML(api_key=os.getenv("FLIPS_RUNWAYML_API_KEY"))


def generateVideo(generateVideo: GenerateVideo):
  client = getRunway()
  try:
    task = client.text_to_video.create(
      model="seedance2",
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



