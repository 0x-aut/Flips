from pydantic import BaseModel
from typing import Optional, Literal


class GenerateVideo(BaseModel):
  prompt: str
  promptImg: Optional[str] = None
  duration: Optional[int] = 10
  # ratio = Literal["1280:720"]