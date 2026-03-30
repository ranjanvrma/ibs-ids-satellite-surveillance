class RiskFusionEngine:
    def __init__(self):
        self.current_satellite_score  = 1.0
        self.recent_changes           = 0
        self.consecutive_threat_frames = 0

        # Incident deduplication — only count a new incident if score
        # drops below threshold between events
        self._last_incident_level = None
        self._incident_count      = 0

    def update_satellite_data(self, ssim_score, changes_found):
        self.current_satellite_score = ssim_score
        self.recent_changes          = changes_found

    def calculate_risk(self, loitering_data, class_counts):
        risk_score = 0.0
        reasons    = []

        num_loiterers = len(loitering_data)
        num_people    = class_counts['people']
        num_vehicles  = class_counts['vehicles']

        # 1. Base ground threat
        if num_people > 0:
            people_score = (num_people ** 1.5) * 5
            risk_score  += people_score
            reasons.append(f"Subject(s) Detected: {num_people} individuals.")

        if num_vehicles > 0:
            risk_score += num_vehicles * 15
            reasons.append(f"Vehicle(s) Detected: {num_vehicles}.")

        # 2. Loitering in red zone
        if num_loiterers > 0:
            risk_score += num_loiterers * 20
            reasons.append(f"Suspicious Behavior: {num_loiterers} subject(s) lingering in restricted zone.")

        # 3. Tactical combo
        if num_vehicles > 0 and num_loiterers > 0:
            risk_score += 25
            reasons.append("High Risk Profile: Combined vehicle and dismounted subjects (Potential drop-off).")

        # 4. Satellite multiplier
        sat_multiplier = 1.0
        if self.recent_changes > 0 or self.current_satellite_score < 0.85:
            sat_multiplier = 1.5
            reasons.append(f"Strategic Alert: Sector has {self.recent_changes} mapped terrain anomalies (1.5x Multiplier).")
        risk_score *= sat_multiplier

        # 5. Escalation bonus — CAPPED at +15 max (was +30, caused score to max out)
        if risk_score > 20:
            self.consecutive_threat_frames += 1
            escalation_bonus = min(15.0, self.consecutive_threat_frames * 0.1)
            risk_score += escalation_bonus
            if escalation_bonus > 5:
                reasons.append(f"Escalation: Sustained presence in sector (+{int(escalation_bonus)} pts).")
        else:
            self.consecutive_threat_frames = max(0, self.consecutive_threat_frames - 2)

        # Cap at 100
        risk_score = min(int(risk_score), 100)

        # 6. Threat level
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
