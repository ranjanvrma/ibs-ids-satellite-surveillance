import cv2
import os
import numpy as np
from skimage.metrics import structural_similarity as ssim

class SatelliteChangeDetector:
    def __init__(self):
        os.makedirs("outputs/change_maps", exist_ok=True)
        # Lighting normalizer
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        # ORB feature detector for aligning images
        self.orb = cv2.ORB_create(5000) 

    def align_images(self, img1, img2):
        """Digitally warps img2 to perfectly align with img1 using anchor points."""
        kp1, des1 = self.orb.detectAndCompute(img1, None)
        kp2, des2 = self.orb.detectAndCompute(img2, None)

        if des1 is None or des2 is None: return img2

        # Match features between the two images
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = matcher.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)

        # Keep the best 20% of matches to calculate the warp
        good_matches = matches[:int(len(matches) * 0.2)]
        
        if len(good_matches) > 10:
            src_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            
            # Find the matrix that maps img2 to img1
            matrix, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            if matrix is not None:
                h, w = img1.shape
                aligned_img2 = cv2.warpPerspective(img2, matrix, (w, h))
                return aligned_img2
                
        return img2 # Fallback if alignment fails

    def analyze(self, img1_path, img2_path):
        img1_color = cv2.imread(img1_path)
        img2_color = cv2.imread(img2_path)

        if img1_color is None or img2_color is None: return 1.0, 0 

        # 1. Convert to grayscale
        img1_gray = cv2.cvtColor(img1_color, cv2.COLOR_BGR2GRAY)
        img2_gray = cv2.cvtColor(img2_color, cv2.COLOR_BGR2GRAY)

        # 2. Resize and perfectly align img2 to img1
        img2_gray = cv2.resize(img2_gray, (img1_gray.shape[1], img1_gray.shape[0]))
        img2_color = cv2.resize(img2_color, (img1_gray.shape[1], img1_gray.shape[0]))
        img2_aligned_gray = self.align_images(img1_gray, img2_gray)

        # 3. Normalize lighting and blur to remove micro-textures (like sand/grass)
        norm1 = cv2.GaussianBlur(self.clahe.apply(img1_gray), (7, 7), 0)
        norm2 = cv2.GaussianBlur(self.clahe.apply(img2_aligned_gray), (7, 7), 0)

        # 4. Compute Structural Similarity Index (SSIM)
        score, diff = ssim(norm1, norm2, full=True)
        diff = (diff * 255).astype("uint8")

        # 5. Smart Thresholding (Find the severe differences)
        _, thresh = cv2.threshold(diff, 200, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)

        # 6. Morphological Noise Scrubbing
        kernel = np.ones((5, 5), np.uint8)
        # 'Opening' removes tiny specs of noise
        clean_mask = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        # 'Closing' fills in gaps to make solid anomaly shapes
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel, iterations=3)

        # 7. Find the boundaries of the real anomalies
        contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        changes_found = 0
        
        # 8. Create a professional translucent red heatmap overlay
        heatmap_overlay = img2_color.copy()
        for c in contours:
            area = cv2.contourArea(c)
            if area > 400: # Ignore anything too small
                changes_found += 1
                # Draw filled red polygons directly over the changed terrain
                cv2.drawContours(heatmap_overlay, [c], -1, (0, 0, 255), thickness=cv2.FILLED)

        # Blend the red heatmap with the original image (50% transparency)
        final_output = cv2.addWeighted(heatmap_overlay, 0.4, img2_color, 0.6, 0)

        if changes_found > 0:
            filename = os.path.basename(img1_path)
            cv2.imwrite(f"outputs/change_maps/diff_{filename}", final_output)

        return score, changes_found