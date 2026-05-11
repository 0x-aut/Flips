import os

def getRunway():
  from runwayml import RunwayML
  api_key = os.getenv("FLIPS_RUNWAYML_API_KEY")
  if not api_key:
    raise RuntimeError("FLIPS_RUNWAYML_API_KEY not set")
  return RunwayML(api_key=api_key)