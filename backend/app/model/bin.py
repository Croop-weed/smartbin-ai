from app.core.database import Base
from sqlalchemy import String,Integer,Float,Boolean,DateTime
from sqlalchemy.orm import Mapped,mapped_column
from datetime import datetime
import uuid

class Bin(Base):
    __tablename__ = "Bin"

    id : Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )
    name : Mapped[str] = mapped_column(String(225),unique=True,nullable=False)
    location : Mapped[str]  = mapped_column(String(225),nullable=False)
    bin_present : Mapped[bool] = mapped_column(Boolean,nullable=False,default=False)
    bin_full : Mapped[bool] = mapped_column(Boolean,nullable=False,default=0)
    full_from : Mapped[datetime] = mapped_column(DateTime,nullable=True)