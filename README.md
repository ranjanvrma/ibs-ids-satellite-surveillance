# 🛡️ IBS-IDS — Intelligent Border Surveillance System

An AI-powered multi-layer surveillance platform that combines **satellite change detection** and **tactical video analytics** to identify suspicious border activity and generate dynamic threat assessments.

---

## 🖥️ Dashboard Preview

> React-based Command Center with live clock, satellite analysis, and video risk scoring.

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

- **ORB alignment** — warps im2 onto im1's coordinate frame with homography validation
- **SSIM diff map** — detects structural differences between image pairs
- **Edge refinement** — clips detections to actual building/road edges, ignores vegetation
- **Morphological cleanup** — removes noise, fills gaps within structures
- **Color-coded output** — Red (major) · Orange (moderate) · Yellow (minor)

### 2. Object Detection & Tracking
- **YOLOv8n** — detects persons, cars, trucks, buses, motorcycles per frame
- **ByteTrack** — maintains consistent object IDs across frames (`bytetrack.yaml`)

### 3. Loitering Detection
`backend/src/loitering.py`

Tracks per-ID movement distance and time inside a defined restricted zone.
Flags subjects that remain stationary within the red zone beyond the time threshold.

**Zone Intrusion Log** — records every object that enters the restricted zone with:
- ByteTrack ID, object type (Person/Car/etc.)
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
| Sustained presence | +0.3/frame escalation bonus |

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
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── LiveClock.jsx
│       │   ├── RiskGauge.jsx
│       │   └── Card.jsx
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
mv yolov8n.pt ../models/
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

---

## ▶️ Running the Application

Start the backend (from `backend/` folder):
```bash
python -m uvicorn main:app --reload
```

Start the frontend (from `frontend/` folder):
```bash
npm run dev
```

Open in browser:
```
http://localhost:5173
```

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

---

## 📋 Changelog

### v1.2.0
- Zone intrusion log with frame-accurate entry timestamps and duration
- Full-width dashboard layout
- Video processing performance improvements (frame skipping)

### v1.1.0
- Video analytics pipeline fixed and working
- Frame skip optimization for faster CPU processing

### v1.0.0
- Initial release — React + FastAPI migration from Streamlit

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
