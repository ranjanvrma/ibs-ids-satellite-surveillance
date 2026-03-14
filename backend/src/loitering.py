import time
import numpy as np
import cv2

class LoiteringEngine:
    def __init__(self, dist_thresh=50, time_thresh=5, max_trail=30): 
        self.dist_thresh = dist_thresh
        self.time_thresh = time_thresh
        self.max_trail = max_trail
        self.tracks = {}
        self.intrusion_zone = None

    def set_intrusion_zone(self, frame_width, frame_height):
        # Creates a default restricted zone (e.g., the center-bottom of the camera view)
        # In a commercial version, users would draw this with their mouse.
        pts = np.array([
            [int(frame_width * 0.2), int(frame_height * 0.5)],
            [int(frame_width * 0.8), int(frame_height * 0.5)],
            [int(frame_width * 0.9), frame_height],
            [int(frame_width * 0.1), frame_height]
        ], np.int32)
        self.intrusion_zone = pts

    def update(self, detected_boxes):
        loitering_data = []
        class_counts = {'people': 0, 'vehicles': 0}
        current_time = time.time()
        active_ids = []

        if detected_boxes is None or detected_boxes.id is None:
            return loitering_data, class_counts

        for i in range(len(detected_boxes.id)):
            track_id = int(detected_boxes.id[i].item())
            active_ids.append(track_id)
            box = detected_boxes.xyxy[i].cpu().numpy()
            cls_id = int(detected_boxes.cls[i].item())

            if cls_id == 0: class_counts['people'] += 1
            elif cls_id in [2, 3, 5, 7]: class_counts['vehicles'] += 1

            x_center = int((box[0] + box[2]) / 2.0)
            y_bottom = int(box[3])
            current_pos = np.array([x_center, y_bottom])

            # Check if target is inside the Red Zone
            in_zone = False
            if self.intrusion_zone is not None:
                in_zone = cv2.pointPolygonTest(self.intrusion_zone, (x_center, y_bottom), False) >= 0

            if track_id not in self.tracks:
                self.tracks[track_id] = {
                    'start_time': current_time, 
                    'start_pos': current_pos, 
                    'trail': [current_pos]
                }
            else:
                data = self.tracks[track_id]
                data['trail'].append(current_pos)
                if len(data['trail']) > self.max_trail:
                    data['trail'].pop(0) # Keep trail length manageable

                dist = np.linalg.norm(current_pos - data['start_pos'])
                time_elapsed = current_time - data['start_time']

                if dist > self.dist_thresh:
                    data['start_time'] = current_time
                    data['start_pos'] = current_pos
                elif time_elapsed > self.time_thresh and in_zone:
                    # ONLY flag loitering if they are inside the restricted zone
                    loitering_data.append({'id': track_id, 'cls': cls_id})

        # Cleanup old tracks
        self.tracks = {k: v for k, v in self.tracks.items() if k in active_ids}
        return loitering_data, class_counts