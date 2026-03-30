# 🛡️ IBS-IDS — Intelligent Border Surveillance System

An AI-powered multi-layer surveillance platform that combines **satellite change detection** and **tactical video analytics** to identify suspicious border activity and generate dynamic threat assessments.

---

## 🖥️ Dashboard Preview

> React-based Command Center with live clock, satellite analysis, video risk scoring, and zone intrusion logging.

---

## 📌 Overview

Monitoring large border regions is challenging due to vast geographical area and limited human capacity. IBS-IDS addresses this by combining two intelligence layers:

**🛰️ Strategic Layer** — Analyzes satellite image pairs to detect terrain changes:
new constructions, cleared land, roads, and structural anomalies.

**📹 Tactical Layer** — Processes drone or CCTV footage to detect human presence,
vehicle movement, loitering behavior, and compute a live risk score.

Both layers feed into a **Risk Fusion Engine** that produces a final threat level.

---

## 🧠 System Architecture

```
Browser (React :5173)
        │
        │  HTTP / REST
        ▼
FastAPI Backend (:8000)
        │
        ├── /satellite-maps      → lists available image pairs
        ├── /analyze-satellite   → runs change detection pipeline
        ├── /analyze-video       → runs video analytics pipeline
        └── /outputs             → serves processed images & video
```

---

## ⚙️ Core Components

### 1. Satellite Change Detection
`backend/src/change_detection.py`

- **ORB alignment** — warps im2 onto im1's coordinate frame with homography validation (prevents ray/streak artifacts)
- **SSIM diff map** — detects structural differences between image pairs
- **Edge refinement** — clips detections to actual building/road edges, ignores seasonal vegetation changes
- **Morphological cleanup** — removes noise, fills gaps within structures
- **Color-coded output** — Red (major) · Orange (moderate) · Yellow (minor)

### 2. Object Detection & Tracking
- **YOLOv8n** — detects persons, cars, trucks, buses, motorcycles per frame
- **ByteTrack** — maintains consistent object IDs across frames (`bytetrack.yaml`)
- **Frame skipping** — processes every 2nd frame for 2× CPU speedup with minimal accuracy loss

### 3. Loitering Detection
`backend/src/loitering.py`

Tracks per-ID movement distance and time inside a defined restricted zone.
Flags subjects that remain stationary within the red zone beyond the time threshold.

**Zone Intrusion Log** — records every object that enters the restricted zone with:
- ByteTrack ID and object type (Person / Car / etc.)
- Frame-accurate entry timestamp (MM:SS into video)
- Duration spent in zone
- Status: IN ZONE or EXITED
- Threat tag: LOITERING (>10s) or INTRUDER

### 4. Risk Fusion Engine
`backend/src/risk_scoring.py`

| Factor | Effect |
|--------|--------|
| People detected | Exponential scaling (`n^1.5 × 5`) |
| Vehicles detected | +15 per vehicle |
| Loitering subjects | +20 per subject |
| Vehicle + loiterer combo | +25 (drop-off profile) |
| Satellite anomalies | ×1.5 strategic multiplier |
| Sustained presence | +0.1/frame escalation bonus (capped at +15) |

| Score | Threat Level |
|-------|-------------|
| 0 | Normal |
| 1–34 | Subject Detected |
| 35–59 | Suspicious Behavior |
| 60–84 | High Threat |
| 85–100 | Critical Alarm |

---

## 📂 Project Structure

```
ibs-ids-satellite-surveillance/
│
├── backend/
│   ├── main.py                  ← FastAPI app + all endpoints
│   ├── requirements.txt
│   ├── bytetrack.yaml
│   └── src/
│       ├── change_detection.py
│       ├── loitering.py
│       ├── risk_scoring.py
│       └── utils.py
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── context/
│       │   └── VideoContext.jsx  ← persists video state across navigation
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── LiveClock.jsx
│       │   └── RiskGauge.jsx
│       └── pages/
│           ├── Overview.jsx
│           ├── Satellite.jsx
│           └── Video.jsx
│
├── data/
│   └── satellite/
│       ├── im1/                 ← Baseline (before) images
│       └── im2/                 ← Current (after) images
│
├── models/                      ← Place yolov8n.pt here (not tracked)
├── docs/
│   └── architecture.md
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ibs-ids-satellite-surveillance.git
cd ibs-ids-satellite-surveillance
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

Download YOLOv8n weights:
```bash
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```
Move the downloaded `yolov8n.pt` into the `backend/` folder.

### 3. Frontend setup

```bash
cd frontend
npm install
```

---

## ▶️ Running the Application

**Terminal 1 — Backend** (from `backend/` folder):
```bash
python -m uvicorn main:app --reload
```

**Terminal 2 — Frontend** (from `frontend/` folder):
```bash
npm run dev
```

Open in browser:
```
http://localhost:5173
```

Both terminals must be running simultaneously.

---

## 📊 Dataset Format

Satellite image pairs must share the same filename across `im1/` and `im2/`:

```
data/satellite/
├── im1/
│   ├── sector_01.png
│   └── sector_02.png
└── im2/
    ├── sector_01.png    ← paired with im1/sector_01.png
    └── sector_02.png
```

---

## ⚠️ Limitations

- Uses offline datasets — no live satellite feed integration
- Video input is file-based — no live RTSP/camera stream support
- Satellite and video layers are not spatially correlated with GPS coordinates
- Restricted zone is auto-generated — custom drawable zones planned for v2

---

## 📋 Changelog

### v1.3.0
- Video state persists across page navigation (VideoContext)
- Fixed incident count to show distinct zone entries instead of per-frame count
- Corrected risk score escalation bonus (was maxing out at 100 on every video)
- Frame-accurate zone intrusion timestamps using video FPS

### v1.2.0
- Zone intrusion log with per-ID entry time, duration, status and threat tag
- Full-width dashboard layout
- Video processing performance improvements (2× frame skipping, smaller resize)

### v1.1.0
- Video analytics pipeline working end-to-end
- Fixed ByteTrack `fuse_score` compatibility with updated Ultralytics

### v1.0.0
- Initial release — React + FastAPI migration from Streamlit
- Satellite change detection with ORB alignment + SSIM + edge refinement
- Video analytics with YOLOv8n + ByteTrack + risk fusion engine

---

## 👥 Team

- **Ranjan Verma**
- **Priyansh Johri**
- **Gatik Johar**

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

Developed for academic and educational purposes as part of a Project Based Learning (PBL) course.

---

## ⭐ Built With

Python · FastAPI · OpenCV · YOLOv8 · ByteTrack · NumPy · scikit-image · React · Vite · Tailwind CSS
