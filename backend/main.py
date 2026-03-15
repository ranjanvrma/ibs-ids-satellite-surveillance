from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil, os, tempfile, cv2, imageio, time
import numpy as np
from ultralytics import YOLO

from src.change_detection import SatelliteChangeDetector
from src.loitering import LoiteringEngine
from src.risk_scoring import RiskFusionEngine

app = FastAPI(title="IBS IDS AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount outputs folder so frontend can fetch processed video & change maps
os.makedirs("outputs/change_maps", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

from fastapi.staticfiles import StaticFiles

app.mount("/data", StaticFiles(directory="../data"), name="data")

sat_detector = SatelliteChangeDetector()
fusion_engine = RiskFusionEngine()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ─── Load heavy models once at startup ────────────────────────────────────────
model = YOLO("yolov8n.pt")


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "IBS IDS Backend Running"}


@app.get("/satellite-maps")
def get_maps():
    folder = "../data/satellite/im1"
    if not os.path.exists(folder):
        return {"maps": []}
    files = [f for f in os.listdir(folder) if f.lower().endswith(".png")]
    return {"maps": files}


@app.post("/analyze-satellite")
async def analyze_satellite(filename: str):
    im1_path = f"../data/satellite/im1/{filename}"
    im2_path = f"../data/satellite/im2/{filename}"

    if not os.path.exists(im1_path) or not os.path.exists(im2_path):
        return {"error": "Image pair not found", "similarity_score": None, "changes_detected": 0}

    score, changes = sat_detector.analyze(im1_path, im2_path)
    fusion_engine.update_satellite_data(score, changes)

    diff_url = None
    diff_path = f"outputs/change_maps/diff_{filename}"
    if changes > 0 and os.path.exists(diff_path):
        diff_url = f"/outputs/change_maps/diff_{filename}"

    return {
        "similarity_score": round(score, 4),
        "changes_detected": changes,
        "diff_image_url": diff_url,
        "im1_url": f"/outputs/change_maps/../../../{im1_path}",  # served separately
    }


@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    # Save uploaded video to a temp file
    suffix = os.path.splitext(file.filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    cap = cv2.VideoCapture(tmp_path)
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps    = int(cap.get(cv2.CAP_PROP_FPS)) or 30

    loiter_engine = LoiteringEngine(dist_thresh=50, time_thresh=10)
    loiter_engine.set_intrusion_zone(width, height)

    out_path = "outputs/processed_tactical.mp4"
    writer = imageio.get_writer(out_path, fps=fps, codec="libx264", macro_block_size=None)

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    max_risk_score = 0
    final_level = "NORMAL"
    final_reasons = []
    final_counts = {"people": 0, "vehicles": 0}
    incident_log = []

    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1
        frame = cv2.resize(frame, (854, 480))

        results = model.track(
            frame, persist=True, tracker="bytetrack.yaml",
            conf=0.35, iou=0.5, classes=[0, 2, 3, 5, 7], verbose=False
        )

        loitering_data, class_counts = [], {"people": 0, "vehicles": 0}
        annotated = frame.copy()

        if results and results[0].boxes is not None and len(results[0].boxes) > 0:
            boxes = results[0].boxes
            loitering_data, class_counts = loiter_engine.update(boxes)
            annotated = results[0].plot()

        # Draw intrusion zone
        if loiter_engine.intrusion_zone is not None:
            overlay = annotated.copy()
            cv2.fillPoly(overlay, [loiter_engine.intrusion_zone], (0, 0, 180))
            annotated = cv2.addWeighted(overlay, 0.2, annotated, 0.8, 0)
            cv2.polylines(annotated, [loiter_engine.intrusion_zone], True, (0, 0, 255), 2)

        level, score, reasons = fusion_engine.calculate_risk(loitering_data, class_counts)

        if score > max_risk_score:
            max_risk_score = score
            final_level = level
            final_reasons = reasons
            final_counts = class_counts

        if score >= 35:
            incident_log.append({"frame": frame_idx, "score": score, "level": level})

        # HUD overlay
        color = (0,200,0) if score < 35 else (0,165,255) if score < 60 else (0,0,255)
        cv2.rectangle(annotated, (0,0), (300, 60), (0,0,0), -1)
        cv2.putText(annotated, f"RISK: {level}", (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        cv2.putText(annotated, f"Score: {score}/100", (8, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1)

        rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
        writer.append_data(rgb)

    cap.release()
    writer.close()
    os.unlink(tmp_path)

    return {
        "risk_level": final_level,
        "risk_score": max_risk_score,
        "reasons": final_reasons,
        "class_counts": final_counts,
        "incident_count": len(incident_log),
        "total_frames": total_frames,
        "video_url": "/outputs/processed_tactical.mp4",
    }
