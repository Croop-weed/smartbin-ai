from fastapi import UploadFile, File,APIRouter
from pathlib import Path
import shutil

from app.service.detector import GarbageDetector

router = APIRouter(prefix="/model")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

detector = GarbageDetector("app/service/models/best.pt")


@router.post("/predict")
async def predict(file: UploadFile = File(...)):

    image_path = UPLOAD_DIR / file.filename

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    detections = detector.detect(str(image_path))

    return {
        "filename": file.filename,
        "detections": detections
    }