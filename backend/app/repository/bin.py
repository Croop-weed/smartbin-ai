import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from app.model.bin import Bin
from app.schema.bin import BinCreate, BinResponse


class BinRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_bin(self, data: BinCreate) -> Bin:
        new_bin = Bin(name=data.name, location=data.location)
        self.db.add(new_bin)
        await self.db.flush()
        await self.db.refresh(new_bin)
        return new_bin

    async def get_all_bins(self) -> list[Bin]:
        q = select(Bin)
        result = await self.db.execute(q)
        return result.scalars().all()

    async def get_priority_bins(self) -> list[Bin]:
        q = select(Bin).where(Bin.bin_full == True).order_by(asc(Bin.full_from))
        result = await self.db.execute(q)
        return result.scalars().all()
   
