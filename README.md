# SmartBin — AI-powered Bin Detection and Dashboard

SmartBin is a small full-stack project that demonstrates object detection for waste bins using a YOLO-based model, a FastAPI backend, and a simple React + Vite frontend dashboard. The app allows creating bins, uploading photos per bin, running the detector, updating bin states (present / full), listing bins, sorting by priority and deleting bins.

## Features

- Create and manage bins (name, location)
- Upload an image for detection per bin and update bin status
- List bins and sort by priority (full bins first, then by time)
- Delete bins
- Simple upload + detection UI and a minimal REST API

## Repository layout

- `backend/` — FastAPI application
	- `app/main.py` — application entry and CORS setup
	- `app/api/v1/` — API routers for `model` (prediction) and `bins`
	- `app/service/` — business logic, including `detector.py` and `bin_service.py`
	- `app/repository/` — DB operations (CRUD)
	- `app/model/` — SQLAlchemy models
	- `app/schema/` — Pydantic request/response models
- `frontend/` — React + Vite app (dashboard interface)
	- `src/App.tsx` — main dashboard UI (create, refresh, upload photo, delete)
	- `src/App.css` — styles for large buttons and simple cards
- `models/` — trained model weights and dataset artifacts
	- `best.pt`, `last.pt` — YOLO weights produced during training
- `data/` — dataset used for training (labels and images)

## Model

SmartBin uses a YOLO-based object detector (Ultralytics YOLOv8 wrapper). The detector is instantiated in the backend service and invoked for both general prediction (`POST /api/v1/model/predict`) and per-bin photo uploads (`POST /api/v1/bins/{bin_id}/photo`).

Model files in this repository:

- [models/best.pt](models/best.pt) — best checkpoint from training (used by the detector)
- [models/last.pt](models/last.pt) — last checkpoint from training

The detector returns detection items with fields: `class_id`, `class_name`, `confidence`, and `bbox`.

### Training summary

Training was run with YOLO and produced the following progress and evaluation logs. Best model saved as `best.pt` (EarlyStopping triggered at epoch 47).

```
								 Class     Images  Instances      Box(P          R      mAP50  mAP50-95): 100% ━━━━━━━━━━━━ 4/4 1.3it/s 3.1s
									 all        401        780      0.532      0.708      0.602      0.332

[... trimmed for brevity in this README, full logs included in repo file if needed ...]

EarlyStopping: Training stopped early as no improvement observed in last 20 epochs. Best results observed at epoch 27, best model saved as best.pt.

47 epochs completed in 0.198 hours.
Optimizer stripped from ... best.pt, 22.5MB

Model summary (fused): 73 layers, 11,126,358 parameters, 28.4 GFLOPs
								 Class     Images  Instances      Box(P          R      mAP50  mAP50-95): 100% ━━━━━━━━━━━━ 4/4 1.0it/s 4.0s
									 all        401        780      0.787      0.735       0.77      0.427
									 bin        358        696      0.832      0.852      0.888      0.576
									full         58         84      0.742      0.619      0.653      0.279

Speed: 0.1ms preprocess, 3.3ms inference, 0.0ms loss, 3.2ms postprocess per image
Results saved to /kaggle/working/runs/yolov8s_baseline
```

> If you want the full raw training log, keep the training output file in the repo or paste it into `docs/TRAINING_LOG.txt` (not currently included).

## Demo images and predictions

Demo predictions and example output images are available in the repository under `models/runs/detect/predict` (or `models/predict/` depending on where you saved them). These contain annotated images produced by the detector that showcase the detection results and can be used for a quick visual demo.

## API

Base path: `/api/v1`

- `POST /api/v1/model/predict` — upload an image file (`multipart/form-data` `file`) and receive detections (used by the upload area)
- `POST /api/v1/bins` — create a new bin (JSON: `{ "name": "bin-1", "location": "Lobby" }`)
- `GET  /api/v1/bins?sort=name|priority` — list bins, optionally sorted (`priority` sorts full bins earlier)
- `GET  /api/v1/bins/priority` — shortcut returning only full bins ordered by time
- `POST /api/v1/bins/{bin_id}/photo` — upload a photo for an existing bin; runs detection and updates bin state
- `POST /api/v1/bins/detections` — apply a detection payload (filename + detections) to update a bin by name
- `DELETE /api/v1/bins/{bin_id}` — delete a bin

Example: create a bin with curl

```bash
curl -X POST http://127.0.0.1:8000/api/v1/bins \
	-H 'Content-Type: application/json' \
	-d '{"name":"bin-1","location":"Main Entrance"}'
```

Upload a photo for a bin (replace `:bin_id`):

```bash
curl -X POST http://127.0.0.1:8000/api/v1/bins/:bin_id/photo \
	-F "file=@/path/to/photo.jpg"
```

## Running locally (development)

Backend (requires Python 3.10+):

```bash
cd backend
# create virtualenv, install dependencies from pyproject.toml (poetry or pip as needed)
# example using pip with a requirements file if you generate one:
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend (requires Node.js 18+):

```bash
cd frontend
npm install
npm run dev
```

Open the frontend in the browser (usually http://localhost:5173) and the backend at http://127.0.0.1:8000.

## Notes and next steps

- The model is currently loaded in CPU mode by default in `app/service/detector.py`. For production or faster inference, configure CUDA device if available and update the detector instantiation.
- Consider adding authentication for destructive actions (delete) and rate-limiting for uploads.
- Store uploaded images and model outputs in a structured place and add cleanup to avoid disk growth.

If you want, I can:

- Add a `docs/` folder with the full training log and sample annotated images
- Add a `requirements.txt` or `pyproject.toml` installation instructions for reproducible installs
- Create unit tests for the backend API endpoints

---
SmartBin — small demo by you. Happy to expand this README with additional details or include the full training log and demo images in the repo if you want.
