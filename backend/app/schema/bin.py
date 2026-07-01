from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

class BinCreate(BaseModel):
    name: str
    location: str
    model_config = ConfigDict(from_attributes=True)

class BinResponse(BaseModel):
    id: uuid.UUID
    name: str
    location: str
    bin_present: bool = False
    bin_full: bool = False
    full_from: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)