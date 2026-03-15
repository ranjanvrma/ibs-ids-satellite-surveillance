# System Architecture — IBS-IDS v1.0

## Overview

IBS-IDS is a two-module AI surveillance platform. The frontend (React) communicates
with a FastAPI backend that runs all computer vision workloads locally.

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
        └── /outputs             → serves processed images & video (static)
```

---

## Module 01 — Satellite Change Detection

**File:** `backend/src/change_detection.py`

### Pipeline

```
im1 (baseline) ──┐
                  ├── ORB Alignment ──► Normalized Pair ──► SSIM Diff Map
im2 (current)  ──┘                                              │
                                                                ▼
                                                      Otsu Threshold (BINARY_INV)
                                                                │
                                                                ▼
                                                    Morphological Cleanup (Open + Close)
                                                                │
                                              ┌─────────────────┘
                                              │
                                    Edge Detection (Canny)
                                    New edges = new structures
                                              │
                                              ▼
                                    AND(SSIM mask, edge zone)
                                              │
                                              ▼
                                    Contour Filtering (min 400px²)
                                              │
                                              ▼
                                    Color-coded overlay saved to outputs/
```

### Key design decisions

- **ORB alignment** warps im2 onto im1's coordinate frame before comparison.
  Homography validation (`is_homography_valid`) prevents degenerate warps that
  produce ray/streak artifacts when the two images are very different.

- **SSIM** (Structural Similarity Index) on CLAHE-normalised, blurred images
  produces a diff map where dark pixels = structurally different regions.
  `THRESH_BINARY_INV + THRESH_OTSU` flags these dark regions as changes.

- **Edge refinement** clips the coarse SSIM blob to actual structural boundaries.
  Canny edges in im2 that don't exist in im1 mark new buildings/roads.
  Only SSIM-flagged regions that overlap with these edge zones are kept.
  This removes seasonal vegetation changes that SSIM flags but have no new edges.

- **Color coding:** Red = large change (>8000px²) · Orange = medium · Yellow = small

---

## Module 02 — Video Analytics

**File:** `backend/main.py` (`/analyze-video` endpoint)

### Pipeline

```
Uploaded video
      │
      ▼
Frame resize (854×480) ── YOLOv8n detection (classes: person, car, bus, truck, motorcycle)
      │                           │
      │                           ▼
      │                    ByteTrack multi-object tracking (bytetrack.yaml)
      │                           │
      │                           ▼
      │                    LoiteringEngine
      │                    - tracks per-ID position history
      │                    - flags subjects stationary in restricted zone > 10s
      │                           │
      │                           ▼
      │                    RiskFusionEngine
      │                    - base score: people × 5^1.5, vehicles × 15
      │                    - loitering bonus: loiterers × 20
      │                    - tactical combo: vehicle + loiterer +25
      │                    - satellite multiplier: ×1.5 if recent anomalies
      │                    - escalation: +0.3/frame sustained presence
      │                    - capped at 100
      │                           │
      ▼                           ▼
HUD overlay ◄──────── Risk level + score written to frame
      │
      ▼
imageio writer → outputs/processed_tactical.mp4
```

### Risk levels

| Score | Level               |
|-------|---------------------|
| 0     | NORMAL              |
| 1–34  | SUBJECT DETECTED    |
| 35–59 | SUSPICIOUS BEHAVIOR |
| 60–84 | HIGH THREAT         |
| 85+   | CRITICAL ALARM      |

---

## Frontend

**Stack:** React 18 · Vite 5 · Tailwind CSS 3 · React Router 6

### Component tree

```
App
├── Sidebar          (navigation rail, system status)
├── TopBar           (system ID, LiveClock)
└── Routes
    ├── Overview     (project summary, data flow)
    ├── Satellite    (map selector → analysis → image comparison)
    └── Video        (upload → processing → risk dashboard + playback)
```

### API layer

All backend calls are in `frontend/src/api.js`:
- `getSatelliteMaps()` — GET /satellite-maps
- `analyzeSatellite(filename)` — POST /analyze-satellite
- `analyzeVideo(file, onProgress)` — POST /analyze-video (XHR for upload progress)

---

## Data flow — end to end

```
User selects map → frontend calls /analyze-satellite
                 → backend runs change_detection.py pipeline
                 → saves diff image to backend/outputs/change_maps/
                 → returns { similarity_score, changes_detected, diff_image_url }
                 → frontend fetches image from /outputs/... static route
                 → displays before / after / change map side by side

User uploads video → frontend POSTs to /analyze-video
                   → backend processes frame by frame
                   → writes processed_tactical.mp4 to backend/outputs/
                   → returns { risk_level, risk_score, reasons, video_url, ... }
                   → frontend renders risk gauge + factors + inline video player
```
