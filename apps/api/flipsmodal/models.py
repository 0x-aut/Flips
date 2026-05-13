from pydantic import BaseModel
from typing import Optional, Literal


class GenerateVideo(BaseModel):
  prompt: str
  model: str = "gen4.5"
  promptImg: Optional[str] = None
  duration: int = 10

class TransformVideo(BaseModel):
  prompt: str
  # model: str = "gen4_aleph"
  promptVideoSrc: str