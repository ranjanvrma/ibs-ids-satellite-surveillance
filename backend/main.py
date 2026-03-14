from fastapi import FastAPI, UploadFile, File
import shutil
import os
from src.change_detection import SatelliteChangeDetector
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="IBS IDS AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sat_detector = SatelliteChangeDetector()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"message": "IBS IDS Backend Running"}


@app.post("/analyze-satellite")
async def analyze_satellite(
    before: UploadFile = File(...),
    after: UploadFile = File(...)
):

    before_path = os.path.join(UPLOAD_DIR, "before_" + before.filename)
    after_path = os.path.join(UPLOAD_DIR, "after_" + after.filename)

    with open(before_path, "wb") as buffer:
        shutil.copyfileobj(before.file, buffer)

    with open(after_path, "wb") as buffer:
        shutil.copyfileobj(after.file, buffer)

    score, changes = sat_detector.analyze(before_path, after_path)

    return {
        "similarity_score": score,
        "changes_detected": changes
    }