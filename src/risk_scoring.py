class RiskFusionEngine:
    def __init__(self):
        self.current_satellite_score = 1.0
        self.recent_changes = 0
        self.consecutive_threat_frames = 0 

    def update_satellite_data(self, ssim_score, changes_found):
        self.current_satellite_score = ssim_score
        self.recent_changes = changes_found

    def calculate_risk(self, loitering_data, class_counts):
        risk_score = 0.0
        reasons = []

        num_loiterers = len(loitering_data)
        num_people = class_counts['people']
        num_vehicles = class_counts['vehicles']

        # 1. Base Ground Threat (Exponential scaling for crowds)
        if num_people > 0:
            # 1 person = 5 pts, 2 = 14 pts, 4 = 40 pts... scales up aggressively
            people_score = (num_people ** 1.5) * 5
            risk_score += people_score
            reasons.append(f"Subject(s) Detected: {num_people} individuals.")
        
        if num_vehicles > 0:
            # Flat 15 pts per vehicle
            risk_score += (num_vehicles * 15)
            reasons.append(f"Vehicle(s) Detected: {num_vehicles}.")

        # 2. Behavioral Threat (Loitering inside Red Zone)
        if num_loiterers > 0:
            loiter_score = num_loiterers * 20
            risk_score += loiter_score
            reasons.append(f"Suspicious Behavior: {num_loiterers} subject(s) lingering in restricted zone.")

        # 3. Tactical Combination (Smuggling / Drop-off profile)
        if num_vehicles > 0 and num_loiterers > 0:
            risk_score += 25
            reasons.append("High Risk Profile: Combined vehicle and dismounted subjects (Potential drop-off).")

        # 4. Strategic Fusion Multiplier (The Satellite Link)
        # If the satellite detected terrain changes, ground activity is treated as highly critical.
        sat_multiplier = 1.0
        if self.recent_changes > 0 or self.current_satellite_score < 0.85:
            sat_multiplier = 1.5
            reasons.append(f"Strategic Alert: Sector has {self.recent_changes} mapped terrain anomalies (1.5x Multiplier).")
        
        risk_score *= sat_multiplier

        # 5. Time-based Escalation (Score increases the longer they stay)
        if risk_score > 20: 
            self.consecutive_threat_frames += 1
            # Add up to 30 bonus points for sustained presence
            escalation_bonus = min(30.0, self.consecutive_threat_frames * 0.3)
            risk_score += escalation_bonus
            if escalation_bonus > 10:
                reasons.append(f"Escalation: Sustained presence in sector (+{int(escalation_bonus)} pts).")
        else:
            # Cool down the timer if the threat leaves
            self.consecutive_threat_frames = max(0, self.consecutive_threat_frames - 2)

        # Cap the score strictly at 100
        risk_score = min(int(risk_score), 100)

        # 6. Dynamic Threat Levels
        if risk_score >= 85:
            level = "CRITICAL ALARM"
        elif risk_score >= 60:
            level = "HIGH THREAT"
        elif risk_score >= 35:
            level = "SUSPICIOUS BEHAVIOR"
        elif risk_score > 0:
            level = "SUBJECT DETECTED"
        else:
            level = "NORMAL"

        return level, risk_score, reasons