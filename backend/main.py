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
async def analyze_satellite(filename: str):

    im1_path = f"../data/satellite/im1/{filename}"
    im2_path = f"../data/satellite/im2/{filename}"

    score, changes = sat_detector.analyze(im1_path, im2_path)

    return {
        "similarity_score": score,
        "changes_detected": changes
    }

@app.get("/satellite-maps")
def get_maps():

    folder = "../data/satellite/im1"

    files = [
        f for f in os.listdir(folder)
        if f.endswith(".png")
    ]

    return {"maps": files}