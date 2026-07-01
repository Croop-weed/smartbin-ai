from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from contextlib import asynccontextmanager
from app.core.database import engine,Base
from app.api.v1 import prediction, bin

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="SMARTBIN", lifespan=lifespan)

# Allow the frontend dev server to call the API during development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=prediction.router, prefix="/api/v1")
app.include_router(router=bin.router, prefix="/api/v1")

@app.get("/")
def home():
    return {
        "message": "Smart Bin Detection API"
    }

