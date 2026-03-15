import numpy as np
import cv2

CLASS_NAMES = {
    0: 'Person',
    2: 'Car',
    3: 'Motorcycle',
    5: 'Bus',
    7: 'Truck',
}

class LoiteringEngine:
    def __init__(self, dist_thresh=50, time_thresh=5, max_trail=30):
        self.dist_thresh    = dist_thresh
        self.time_thresh    = time_thresh   # seconds
        self.max_trail      = max_trail
        self.tracks         = {}
        self.intrusion_zone = None
        self.zone_log       = {}            # track_id → entry record
        self.fps            = 30            # set via set_fps()
        self.frame_idx      = 0            # current frame number

    def set_fps(self, fps):
        self.fps = max(fps, 1)

    def set_intrusion_zone(self, frame_width, frame_height):
        pts = np.array([
            [int(frame_width * 0.2), int(frame_height * 0.5)],
            [int(frame_width * 0.8), int(frame_height * 0.5)],
            [int(frame_width * 0.9), frame_height],
            [int(frame_width * 0.1), frame_height]
        ], np.int32)
        self.intrusion_zone = pts

    def frame_to_timestamp(self, frame_num):
        """Convert frame number to MM:SS string based on video FPS."""
        total_secs = int(frame_num / self.fps)
        m = total_secs // 60
        s = total_secs % 60
        return f"{m:02d}:{s:02d}"

    def update(self, detected_boxes, frame_idx):
        """
        frame_idx: current frame number (passed from main.py)
        """
        self.frame_idx   = frame_idx
        loitering_data   = []
        class_counts     = {'people': 0, 'vehicles': 0}
        active_ids       = []

        if detected_boxes is None or detected_boxes.id is None:
            return loitering_data, class_counts

        for i in range(len(detected_boxes.id)):
            track_id    = int(detected_boxes.id[i].item())
            active_ids.append(track_id)
            box         = detected_boxes.xyxy[i].cpu().numpy()
            cls_id      = int(detected_boxes.cls[i].item())

            if cls_id == 0:
                class_counts['people'] += 1
            elif cls_id in [2, 3, 5, 7]:
                class_counts['vehicles'] += 1

            x_center    = int((box[0] + box[2]) / 2.0)
            y_bottom    = int(box[3])
            current_pos = np.array([x_center, y_bottom])

            # Zone check
            in_zone = False
            if self.intrusion_zone is not None:
                in_zone = cv2.pointPolygonTest(
                    self.intrusion_zone, (x_center, y_bottom), False
                ) >= 0

            # ── Zone entry/exit logging ────────────────────────────────────────
            if in_zone:
                if track_id not in self.zone_log:
                    # First entry — record the frame number
                    self.zone_log[track_id] = {
                        'id':           track_id,
                        'cls':          cls_id,
                        'label':        CLASS_NAMES.get(cls_id, f'Class {cls_id}'),
                        'entry_time':   self.frame_to_timestamp(frame_idx),
                        'entry_frame':  frame_idx,
                        'exit_frame':   None,
                        'duration':     0.0,
                        'status':       'IN ZONE',
                    }
                else:
                    # Update duration — frames in zone / fps = seconds
                    entry_frame = self.zone_log[track_id]['entry_frame']
                    frames_in   = frame_idx - entry_frame
                    self.zone_log[track_id]['duration'] = round(frames_in / self.fps, 1)
                    self.zone_log[track_id]['status']   = 'IN ZONE'
            else:
                if track_id in self.zone_log and self.zone_log[track_id]['status'] == 'IN ZONE':
                    # Mark exit and freeze duration
                    entry_frame = self.zone_log[track_id]['entry_frame']
                    frames_in   = frame_idx - entry_frame
                    self.zone_log[track_id]['duration']   = round(frames_in / self.fps, 1)
                    self.zone_log[track_id]['exit_frame'] = frame_idx
                    self.zone_log[track_id]['status']     = 'EXITED'

            # ── Track maintenance ──────────────────────────────────────────────
            if track_id not in self.tracks:
                self.tracks[track_id] = {
                    'start_frame': frame_idx,
                    'start_pos':   current_pos,
                    'trail':       [current_pos],
                }
            else:
                data = self.tracks[track_id]
                data['trail'].append(current_pos)
                if len(data['trail']) > self.max_trail:
                    data['trail'].pop(0)

                dist          = np.linalg.norm(current_pos - data['start_pos'])
                frames_still  = frame_idx - data['start_frame']
                secs_still    = frames_still / self.fps

                if dist > self.dist_thresh:
                    data['start_frame'] = frame_idx
                    data['start_pos']   = current_pos
                elif secs_still > self.time_thresh and in_zone:
                    loitering_data.append({'id': track_id, 'cls': cls_id})

        self.tracks = {k: v for k, v in self.tracks.items() if k in active_ids}
        return loitering_data, class_counts

    def get_zone_log(self):
        return sorted(self.zone_log.values(), key=lambda x: x['entry_frame'])
