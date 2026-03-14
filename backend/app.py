import streamlit as st
import cv2
import os
import tempfile
import imageio
from PIL import Image
from datetime import datetime
import pandas as pd
from ultralytics import YOLO

from src.loitering import LoiteringEngine
from src.change_detection import SatelliteChangeDetector
from src.risk_scoring import RiskFusionEngine

# --- 1. Page Configuration ---
st.set_page_config(page_title="IBS Command Center", layout="wide")
st.title("🛡️ Intelligent Border Surveillance Command Center")
st.markdown("---")

# --- 2. Initialize Backend Engines ---
@st.cache_resource
def load_models():
    # Using 'n' model for speed as suggested
    model = YOLO("yolov8n.pt") 
    loiter_engine = LoiteringEngine(dist_thresh=50, time_thresh=10)
    fusion_engine = RiskFusionEngine()
    sat_detector = SatelliteChangeDetector()
    return model, loiter_engine, fusion_engine, sat_detector

model, loiter_engine, fusion_engine, sat_detector = load_models()

# --- 3. Load Dataset Inventory ---
im1_folder = "data/satellite/im1"
im2_folder = "data/satellite/im2"
png_files = []
if os.path.exists(im1_folder):
    png_files = [f for f in os.listdir(im1_folder) if f.lower().endswith('.png')]

# --- 4. Sidebar Controls ---
st.sidebar.header("🕹️ Global Controls")
selected_map = st.sidebar.selectbox(
    "Select Border Sector Map:", 
    ["-- Select a Map --"] + png_files,
    help="Select a satellite pair from your dataset."
)

# --- 5. Tab Isolation (Prevents cross-engine lag) ---
tab_sat, tab_vid = st.tabs(["🛰️ Strategic Satellite Scan", "📹 Tactical Video Analytics"])

# --- TAB 1: SATELLITE ENGINE ---
with tab_sat:
    st.subheader("Satellite Change Detection")
    if selected_map != "-- Select a Map --":
        im1_path = os.path.join(im1_folder, selected_map)
        im2_path = os.path.join(im2_folder, selected_map)
        
        # Action Button to ensure this only runs when requested
        if st.button("🔍 Run Terrain Anomaly Analysis"):
            with st.spinner("Aligning orbital imagery and detecting changes..."):
                score, changes = sat_detector.analyze(im1_path, im2_path)
                # Store in fusion engine memory
                fusion_engine.update_satellite_data(score, changes)
                
                sat_col1, sat_col2, sat_col3 = st.columns(3)
                with sat_col1:
                    st.image(Image.open(im1_path), caption="Baseline (im1)", use_container_width=True)
                with sat_col2:
                    st.image(Image.open(im2_path), caption="Current (im2)", use_container_width=True)
                with sat_col3:
                    evidence_path = f"outputs/change_maps/diff_{selected_map}"
                    if changes > 0 and os.path.exists(evidence_path):
                        st.image(Image.open(evidence_path), caption=f"Evidence: {changes} Anomalies", use_container_width=True)
                    else:
                        st.success(f"Sector Clear. Match: {score*100:.1f}%")
                st.info(f"Strategic multiplier updated based on {changes} detected anomalies.")
    else:
        st.info("👈 Select a sector map in the sidebar to begin satellite analysis.")

# --- TAB 2: VIDEO ENGINE ---
with tab_vid:
    st.subheader("Tactical Deployment")
    uploaded_video = st.file_uploader("Upload Drone/CCTV Feed", type=['mp4', 'avi', 'mov'])

    col_t1, col_t2 = st.columns(2)
    show_trails = col_t1.checkbox("📍 Show Target Trajectories", value=True)
    enable_tripwire = col_t2.checkbox("🚧 Enable Red Zone (Virtual Tripwire)", value=True)

    if uploaded_video is not None:
        if st.button("🚀 Process & Analyze Video"):
            with st.spinner("Running AI Computer Vision..."):
                tfile = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
                tfile.write(uploaded_video.read())
                
                cap = cv2.VideoCapture(tfile.name)
                width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
                
                loiter_engine.set_intrusion_zone(width, height)
                
                out_vid_path = "outputs/processed_tactical.mp4"
                writer = imageio.get_writer(out_vid_path, fps=fps, codec='libx264', macro_block_size=None)
                
                progress_bar = st.progress(0)
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                incident_triggered, max_recorded_score = False, 0

                frame_count = 0
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret: break
                    frame_count += 1
                    
                    # Optimization: Resize for speed
                    frame = cv2.resize(frame, (854, 480))