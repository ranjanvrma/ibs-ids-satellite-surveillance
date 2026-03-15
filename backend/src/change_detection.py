import cv2
import os
import numpy as np
from skimage.metrics import structural_similarity as ssim


class SatelliteChangeDetector:
    def __init__(self):
        os.makedirs("outputs/change_maps", exist_ok=True)
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        self.orb   = cv2.ORB_create(5000)

    def is_homography_valid(self, H, shape):
        if H is None or not np.all(np.isfinite(H)):
            return False
        h, w = shape
        det = H[0,0]*H[1,1] - H[0,1]*H[1,0]
        if det <= 0:
            return False
        scale = np.sqrt(abs(det))
        if scale < 0.5 or scale > 2.0:
            return False
        corners = np.float32([[0,0],[w,0],[w,h],[0,h]]).reshape(-1,1,2)
        mapped  = cv2.perspectiveTransform(corners, H)
        for pt in mapped.reshape(-1, 2):
            if pt[0] < -w or pt[0] > 2*w or pt[1] < -h or pt[1] > 2*h:
                return False
        return True

    def align_images(self, img1, img2):
        kp1, des1 = self.orb.detectAndCompute(img1, None)
        kp2, des2 = self.orb.detectAndCompute(img2, None)
        if des1 is None or des2 is None:
            return img2
        matcher      = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches      = sorted(matcher.match(des1, des2), key=lambda x: x.distance)
        good_matches = matches[:int(len(matches) * 0.2)]
        if len(good_matches) > 10:
            src_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1,1,2)
            dst_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1,1,2)
            matrix, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            if self.is_homography_valid(matrix, img1.shape):
                h, w = img1.shape
                return cv2.warpPerspective(img2, matrix, (w, h),
                                           borderMode=cv2.BORDER_REPLICATE)
        return img2

    def analyze(self, img1_path, img2_path):
        img1_color = cv2.imread(img1_path)
        img2_color = cv2.imread(img2_path)
        if img1_color is None or img2_color is None:
            return 1.0, 0

        # 1. Grayscale + resize + align
        img1_gray  = cv2.cvtColor(img1_color, cv2.COLOR_BGR2GRAY)
        img2_gray  = cv2.cvtColor(img2_color, cv2.COLOR_BGR2GRAY)
        img2_gray  = cv2.resize(img2_gray,  (img1_gray.shape[1], img1_gray.shape[0]))
        img2_color = cv2.resize(img2_color, (img1_gray.shape[1], img1_gray.shape[0]))
        img2_aligned = self.align_images(img1_gray, img2_gray)

        # 2. Normalize
        norm1 = cv2.GaussianBlur(self.clahe.apply(img1_gray),    (7,7), 0)
        norm2 = cv2.GaussianBlur(self.clahe.apply(img2_aligned), (7,7), 0)

        # 3. SSIM — coarse change map
        score, diff = ssim(norm1, norm2, full=True)
        diff        = (diff * 255).astype("uint8")
        _, thresh   = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # 4. Original morphological cleanup
        kernel     = np.ones((5,5), np.uint8)
        clean_mask = cv2.morphologyEx(thresh,     cv2.MORPH_OPEN,  kernel, iterations=1)
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel, iterations=3)

        # 5. Edge detection on BOTH images
        edges1 = cv2.Canny(norm1, 40, 110)
        edges2 = cv2.Canny(norm2, 40, 110)

        # Dilate slightly so near-miss edges still match up
        k3 = np.ones((3,3), np.uint8)
        e1d = cv2.dilate(edges1, k3, iterations=1)
        e2d = cv2.dilate(edges2, k3, iterations=1)

        # New structures = edges in img2 not in img1
        # Removed structures = edges in img1 not in img2
        new_edges     = cv2.subtract(e2d, e1d)
        removed_edges = cv2.subtract(e1d, e2d)
        changed_edges = cv2.bitwise_or(new_edges, removed_edges)

        # Expand edge zones — TIGHT: 10px only so we don't bleed into neighbours
        # This keeps road/building footprints without joining unrelated regions
        edge_zone = cv2.dilate(changed_edges, np.ones((10,10), np.uint8), iterations=1)

        # 6. Refine: keep only SSIM-flagged areas that sit on edge-change zones
        refined = cv2.bitwise_and(clean_mask, edge_zone)

        # Fallback: if refinement removes >90% of detections, use raw SSIM mask
        if cv2.countNonZero(refined) < cv2.countNonZero(clean_mask) * 0.10:
            refined = clean_mask

        # 7. Final small close to fill gaps within a single structure
        refined = cv2.morphologyEx(refined, cv2.MORPH_CLOSE,
                                   np.ones((7,7), np.uint8), iterations=2)

        # 8. Contours
        contours, _ = cv2.findContours(refined, cv2.RETR_EXTERNAL,
                                        cv2.CHAIN_APPROX_SIMPLE)

        changes_found   = 0
        heatmap_overlay = img2_color.copy()

        for c in contours:
            area = cv2.contourArea(c)
            if area > 400:
                changes_found += 1
                if area > 8000:
                    color = (0, 0, 255)      # Red    — large
                elif area > 2000:
                    color = (0, 100, 255)    # Orange — medium
                else:
                    color = (0, 210, 255)    # Yellow — small
                cv2.drawContours(heatmap_overlay, [c], -1, color, cv2.FILLED)
                cv2.drawContours(heatmap_overlay, [c], -1, (255,255,255), 1)

        final_output = cv2.addWeighted(heatmap_overlay, 0.4, img2_color, 0.6, 0)

        if changes_found > 0:
            filename = os.path.basename(img1_path)
            cv2.imwrite(f"outputs/change_maps/diff_{filename}", final_output)

        return score, changes_found
