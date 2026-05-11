# Helper file for creating helper functions
 
import os
from typing import Optional
from fastapi import HTTPException, Header
from dotenv import load_dotenv
from runwayml import RunwayML, TaskFailedError
from config import getRunway
from models import GenerateVideo

load_dotenv()

# client = RunwayML(api_key=os.getenv("FLIPS_RUNWAYML_API_KEY")) 

def getJobWithId(task_id: str):
  client = getRunway()
  task_output = client.tasks.retrieve(task_id)
  return task_output


def require_machine_header(machine_token: Optional[str] = Header(None, alias="Machine-Token")) -> str:
  if not machine_token:
    raise HTTPException(status_code=401, detail="Machine-Token header required")
  return machine_token
