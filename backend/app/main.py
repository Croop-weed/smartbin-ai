from fastapi import FastAPI, UploadFile, File
from pathlib import Path
import shutil

from app.api.v1 import prediction

app = FastAPI(title="Smart Bin Detection API")

app.include_router(router=prediction.router,prefix="/api/v1")

@app.get("/")
def home():
    return {
        "message": "Smart Bin Detection API"
    }

