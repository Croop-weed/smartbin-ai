from typing import List
from app.repository.bin import BinRepository
from app.schema.bin import BinCreate, BinResponse
from app.model.bin import Bin


class BinService:

    def __init__(self, repo: BinRepository):
        self.repo = repo

    async def create_bin(self, data: BinCreate) -> BinResponse:
        new_bin: Bin = await self.repo.create_bin(data)
        return BinResponse.from_orm(new_bin)

    async def list_bins(self) -> List[BinResponse]:
        bins = await self.repo.get_all_bins()
        return [BinResponse.from_orm(b) for b in bins]

    async def priority_bins(self) -> List[BinResponse]:
        bins = await self.repo.get_priority_bins()
        return [BinResponse.from_orm(b) for b in bins]
