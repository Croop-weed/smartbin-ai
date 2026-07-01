import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, desc
from app.model.bin import Bin
from app.schema.bin import BinCreate


class BinRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_bin(self, data: BinCreate) -> Bin:
        new_bin = Bin(name=data.name, location=data.location)
        self.db.add(new_bin)
        await self.db.flush()
        await self.db.refresh(new_bin)
        return new_bin

    async def get_bin_by_name(self, name: str) -> Optional[Bin]:
        q = select(Bin).where(Bin.name == name)
        result = await self.db.execute(q)
        return result.scalars().first()

    async def get_bin_by_id(self, bin_id: uuid.UUID) -> Optional[Bin]:
        q = select(Bin).where(Bin.id == bin_id)
        result = await self.db.execute(q)
        return result.scalars().first()

    async def update_bin_status(self, bin: Bin, bin_present: bool, bin_full: bool, full_from: Optional[datetime]) -> Bin:
        bin.bin_present = bin_present
        bin.bin_full = bin_full
        bin.full_from = full_from
        self.db.add(bin)
        await self.db.flush()
        await self.db.refresh(bin)
        return bin

    async def delete_bin(self, bin_obj: Bin) -> None:
        await self.db.delete(bin_obj)
        await self.db.flush()

    async def get_all_bins(self, sort_by: str = "name") -> list[Bin]:
        q = select(Bin)
        if sort_by == "name":
            q = q.order_by(asc(Bin.name))
        elif sort_by == "priority":
            q = q.order_by(desc(Bin.bin_full), asc(Bin.full_from), asc(Bin.name))

        result = await self.db.execute(q)
        return result.scalars().all()

    async def get_priority_bins(self) -> list[Bin]:
        q = select(Bin).where(Bin.bin_full == True).order_by(asc(Bin.full_from))
        result = await self.db.execute(q)
        return result.scalars().all()
   
