from pathlib import Path
from typing import List, Union
from datetime import datetime
from uuid import UUID
from app.repository.bin import BinRepository
from app.schema.bin import BinCreate, BinResponse, BinDetectionPayload, DetectionItem
from app.model.bin import Bin


class BinService:

    def __init__(self, repo: BinRepository):
        self.repo = repo

    async def create_bin(self, data: BinCreate) -> BinResponse:
        new_bin: Bin = await self.repo.create_bin(data)
        return BinResponse.from_orm(new_bin)

    async def list_bins(self, sort: str = "name") -> List[BinResponse]:
        bins = await self.repo.get_all_bins(sort)
        return [BinResponse.from_orm(b) for b in bins]

    async def priority_bins(self) -> List[BinResponse]:
        bins = await self.repo.get_priority_bins()
        return [BinResponse.from_orm(b) for b in bins]

    async def update_bin_status(self, payload: BinDetectionPayload) -> BinResponse:
        bin_name = Path(payload.filename).stem
        bin_record = await self.repo.get_bin_by_name(bin_name)
        if not bin_record:
            raise ValueError(f"Bin with name '{bin_name}' not found")

        is_present, is_full, full_from = self._get_status(payload.detections)

        updated_bin = await self.repo.update_bin_status(
            bin_record,
            bin_present=is_present,
            bin_full=is_full,
            full_from=full_from,
        )
        return BinResponse.from_orm(updated_bin)

    async def update_bin_status_by_id(self, bin_id: UUID, detections: List[Union[dict, DetectionItem]]) -> BinResponse:
        bin_record = await self.repo.get_bin_by_id(bin_id)
        if not bin_record:
            raise ValueError(f"Bin with id '{bin_id}' not found")

        # FIX: Safely parse dictionaries from the detector into Pydantic models
        parsed_detections = [
            d if isinstance(d, DetectionItem) else DetectionItem(**d) 
            for d in detections
        ]

        is_present, is_full, full_from = self._get_status(parsed_detections)

        updated_bin = await self.repo.update_bin_status(
            bin_record,
            bin_present=is_present,
            bin_full=is_full,
            full_from=full_from,
        )
        return BinResponse.from_orm(updated_bin)

    async def delete_bin(self, bin_id: UUID) -> None:
        bin_record = await self.repo.get_bin_by_id(bin_id)
        if not bin_record:
            raise ValueError(f"Bin with id '{bin_id}' not found")
        await self.repo.delete_bin(bin_record)

    def _get_status(self, detections: list[DetectionItem]) -> tuple[bool, bool, datetime | None]:
        class_names = {d.class_name.lower() for d in detections}
        is_full = "full" in class_names
        is_present = bool(detections and class_names.intersection({"bin", "full"}))
        full_from = datetime.utcnow() if is_full else None
        return is_present, is_full, full_from