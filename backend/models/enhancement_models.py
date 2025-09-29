from pydantic import BaseModel
from typing import Optional

class EnhancementRequest(BaseModel):
    scale: int = 4
    tile: int = 0

class EnhancementResponse(BaseModel):
    success: bool
    message: str
    original_dimensions: Optional[str] = None
    enhanced_dimensions: Optional[str] = None
    enhanced_image_base64: Optional[str] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    message: str