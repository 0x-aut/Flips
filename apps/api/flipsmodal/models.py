from pydantic import BaseModel
from typing import Optional, Literal


class GenerateVideo(BaseModel):
  prompt: str
  model: str = "gen4.5"
  promptImg: Optional[str] = None
  duration: int = 10
  # ratio = Literal["1280:720"]