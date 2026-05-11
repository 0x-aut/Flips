# Each function has to be async so we do not block the main thread on server
# Server will be hosted via gpu for speed
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import modal
import os
from generate import generateVideo
from utils import getJobWithId, require_machine_header
from models import GenerateVideo

# Following docs to create fastapi endpoint for modal
image = (
  modal.Image.debian_slim()
  .pip_install_from_requirements("requirements.txt")
  .add_local_dir(".", remote_path="/root", ignore=[".venv", "__pycache__", "*.pyc", ".env", "node_modules", "build/", "dist/", "wheels/", "*.egg-info"])
)

app = modal.App(name="flipsmodal-api")
kv_store = modal.Dict.from_name("flips_job_kv", create_if_missing=True)
web_app = FastAPI(name="flipsmodal-webapp")

web_app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"],
)

# @app.function(secrets=[modal.Secret.from_name("flips-secrets")])
# def getRunwayKey():
#   return os.getenv("FLIPS_RUNWAYML_API_KEY")

  

# Runway.py has the function for calling the runway api and here is simply the containing the api url
@web_app.post("/runway/generatevideo")
def generateFlipsVideo(req: GenerateVideo, machine_token: str = Depends(require_machine_header)):
  # machine_token = require_machine_header(machine_token)
  task_id = generateVideo(req)
  # I would need to add this to the job kv storage for frequent check updates
  kv_store[f"{machine_token}:{task_id}"] = {
    "taskId": task_id,
    "type": "generate_video",
    "status": "PENDING",
    "prompt": req.prompt,
    "machine_token": machine_token,
  } # Later i will change this to an asynchronous send to the kv_store using .aio
  return { "taskId": f"{task_id}" }

@web_app.get("/runway/job/{task_id}")
def poll_job(task_id: str, machine_token: str = Depends(require_machine_header)):
  key= f"{machine_token}:{task_id}"
  print(key)
  if key not in kv_store:
    raise HTTPException(status_code=404, detail="Job not found for this machine")
  
  task = getJobWithId(task_id)
  stored = kv_store[key]
  stored["status"] = task.status
  kv_store[key] = stored
  return { "task": task }

@web_app.get("/runway/jobs")
async def list_jobs(
  machine_token: str = Depends(require_machine_header)
):
    # machine_token = require_machine_header(machine_token)
    prefix = f"{machine_token}:"
    jobs = [
        v for k, v in kv_store.items()
        if k.startswith(prefix)
    ]
    return { "jobs": jobs }


@app.function(
  image=image,
  secrets=[modal.Secret.from_name("flips-secrets")],
)
@modal.asgi_app()
def fastapi_app():
    return web_app