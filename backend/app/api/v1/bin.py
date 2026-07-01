from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pathlib import Path
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import shutil

from app.core.database import get_db
from app.schema.bin import BinCreate, BinResponse, BinDetectionPayload
from app.repository.bin import BinRepository
from app.service.bin_service import BinService
from app.service.detector import GarbageDetector

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
detector = GarbageDetector("app/service/models/best.pt")


async def get_service(db: AsyncSession = Depends(get_db)) -> BinService:
    repo = BinRepository(db)
    return BinService(repo)


@router.post("/bins", response_model=BinResponse, status_code=status.HTTP_201_CREATED)
async def create_bin(payload: BinCreate, service: BinService = Depends(get_service)):
    try:
        return await service.create_bin(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bins/detections", response_model=BinResponse)
async def update_bin_from_detections(payload: BinDetectionPayload, service: BinService = Depends(get_service)):
    try:
        return await service.update_bin_status(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import traceback

@router.post("/bins/{bin_id}/photo", response_model=BinResponse)
async def upload_bin_photo(bin_id: UUID, file: UploadFile = File(...), service: BinService = Depends(get_service)):
    try:
        destination = UPLOAD_DIR / f"{bin_id}_{file.filename}"
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        detections = detector.detect(str(destination))
        return await service.update_bin_status_by_id(bin_id, detections)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        # CRITICAL: This will print the exact line causing your 500 error!
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bins/{bin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bin(bin_id: UUID, service: BinService = Depends(get_service)):
    try:
        await service.delete_bin(bin_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/bins", response_model=List[BinResponse])
async def list_bins(sort: str = "name", service: BinService = Depends(get_service)):
    return await service.list_bins(sort)


@router.get("/bins/priority", response_model=List[BinResponse])
async def priority_bins(service: BinService = Depends(get_service)):
    return await service.priority_bins()
