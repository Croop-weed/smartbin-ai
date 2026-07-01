from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.schema.bin import BinCreate, BinResponse
from app.repository.bin import BinRepository
from app.service.bin_service import BinService

router = APIRouter()


async def get_service(db: AsyncSession = Depends(get_db)) -> BinService:
    repo = BinRepository(db)
    return BinService(repo)


@router.post("/bins", response_model=BinResponse, status_code=status.HTTP_201_CREATED)
async def create_bin(payload: BinCreate, service: BinService = Depends(get_service)):
    try:
        return await service.create_bin(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bins", response_model=List[BinResponse])
async def list_bins(service: BinService = Depends(get_service)):
    return await service.list_bins()


@router.get("/bins/priority", response_model=List[BinResponse])
async def priority_bins(service: BinService = Depends(get_service)):
    return await service.priority_bins()
