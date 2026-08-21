# Chemical Spill Scenario — Detailed Training Script
## SIH260088 — VR-Based CBRN Disaster Response Training (Chemical Module)

This document defines the exact trainee flow, interactions, triggers, timing, and scoring rules for the Chemical hazard module. Unity devs, backend devs, and dashboard devs should all build against this single source of truth.

---

## 1. Scenario Premise

**Setting:** A mid-size industrial chemical storage facility. A storage drum has started leaking a toxic gas (framed generically as "Chemical Agent X" — chlorine-type gas, industrial not weaponized, to keep it realistic and safe to depict). The trainee plays an NDRF responder arriving on-site after an alarm has been triggered.

**Trainee objective:** Follow correct CBRN chemical response protocol to neutralize the hazard, evacuate any civilians, and safely conclude the incident — while being scored on speed, correctness, and protocol adherence.

**Environment:** Factory yard with 3–4 storage drums, a control room/entry point, a visible "leak zone" marked with gas VFX, 2–3 NPC "civilians" to evacuate, a designated safe zone, and a decontamination station.

---

## 2. Full Step-by-Step Flow

### **Stage 0 — Briefing (Pre-scenario)**
- Trainee sees a short on-screen briefing text/HUD popup before entering the site:
  > "Alert: Gas leak reported at Storage Bay 3. Suspected chemical agent release. Proceed with standard CBRN chemical response protocol."
- Timer starts the moment the trainee clicks "Begin Scenario."
- **Logged event:** `scenario_started` (timestamp)

---

### **Stage 1 — Initial Assessment**
- Trainee spawns at the facility entrance, outside the hazard zone.
- A HUD prompt appears: *"Assess the situation before proceeding. Do not enter the hazard zone without PPE."*
- Trainee must **look toward the leak zone** (visible gas/fog VFX, warning signage) — this is a soft trigger, not a hard-gate.
- **Correct behavior:** Trainee does NOT walk into the gas zone yet.
- **Mistake condition:** If trainee enters the marked hazard zone radius without PPE equipped → trigger a "contamination" warning + score penalty.
  - **Logged event:** `entered_hazard_zone_without_ppe` (timestamp) — mistake flag

---

### **Stage 2 — PPE Donning**
- Trainee approaches a PPE station (a marked locker/table object near the entrance).
- Interaction: **click/interact with PPE station** → triggers a donning sequence:
  1. Select gas mask (click object)
  2. Select hazmat suit (click object)
  3. Select gloves (click object)
- Each correct pick sequentially "equips" the trainee (visually shown as a HUD checklist filling in: ✅ Mask ✅ Suit ✅ Gloves).
- **Correct order matters for scoring** (real protocol: suit → mask → gloves, but for game logic, completing all 3 before proceeding is the main requirement; order can be a bonus scoring criterion, not a hard block).
- **Logged events:** `ppe_item_equipped` (item name, timestamp) — fired 3 times; `ppe_donning_completed` (total time taken)
- **Mistake condition:** Attempting to proceed to Stage 3 with incomplete PPE → blocked with HUD warning *"Full PPE required before entering hazard zone."*

---

### **Stage 3 — Enter Hazard Zone + Detection**
- Trainee (now in PPE) walks into the marked hazard zone.
- Trainee picks up a **gas detector** object (placed near the zone entrance or carried from PPE station).
- Interaction: **hold/aim detector at drums** → detector UI shows a rising reading (e.g. a needle gauge or numeric ppm value) as trainee gets closer to the leaking drum.
- Trainee must **identify which of the 3–4 drums is leaking** (only one has active gas VFX + highest detector reading).
- **Correct action:** trainee interacts with (clicks) the correct leaking drum to "flag" it.
- **Mistake condition:** flagging a wrong drum → score penalty, HUD feedback *"Incorrect — re-scan and confirm the source."* (does not hard-block, allows retry)
- **Logged events:** `detector_equipped` (timestamp); `drum_scanned` (drum ID, reading value, timestamp) — fired per drum scanned; `leak_source_identified` (correct: true/false, timestamp)

---

### **Stage 4 — Civilian Evacuation**
- 2–3 NPC "civilian" characters are placed near the hazard zone (idle animation, maybe a "confused/distressed" pose).
- Trainee must **interact with each civilian** (click/approach) to trigger an evacuation dialogue prompt:
  > "This way — follow me to the safe zone!"
- On interaction, NPC begins following the trainee (simple pathing or teleport-follow for simplicity) to a marked **Safe Zone** area.
- Trainee must lead/walk all civilians to the safe zone marker.
- **Correct action:** all civilians reach the safe zone.
- **Mistake condition:** civilian(s) left behind when trainee proceeds to Stage 5 → score penalty, one civilian "casualty" flagged in final report.
- **Logged events:** `civilian_contacted` (civilian ID, timestamp) — fired per civilian; `civilian_evacuated` (civilian ID, timestamp); `evacuation_incomplete` (count left behind) — only if applicable

---

### **Stage 5 — Containment**
- Trainee returns to the identified leaking drum (from Stage 3).
- A **containment kit** object is available nearby (sealant/patch tool).
- Interaction: **click drum with containment kit equipped/selected** → triggers a short containment animation/progress bar (e.g. 5–10 second hold or single click confirm).
- **Correct action:** containment applied to the correct drum.
- **Mistake condition:** attempting containment without correct drum identified in Stage 3 → blocked, HUD warning *"Confirm leak source before containment."*
- **Logged events:** `containment_started` (timestamp); `containment_completed` (timestamp, duration)

---

### **Stage 6 — Decontamination**
- Trainee proceeds to a marked **decontamination station** (a simple archway or marked floor zone with a shower/spray VFX).
- Interaction: trainee walks into/through the decon zone → triggers automatic decon animation (a few seconds, e.g. spray VFX plays).
- **Correct action:** trainee passes through decon before scenario ends.
- **Mistake condition:** ending scenario without passing through decon → flagged as a protocol violation in the final report (soft penalty, not a hard block, to avoid frustrating trainees this early in development).
- **Logged event:** `decontamination_completed` (timestamp)

---

### **Stage 7 — Scenario Complete**
- HUD displays: *"Scenario Complete — Generating Report..."*
- **Logged event:** `scenario_completed` (total time, timestamp)
- Triggers final score calculation (handled by Spring Boot, reading all logged events for that session from Supabase).

---

## 3. Scoring Rules (for Spring Boot logic)

| Criteria | Points / Penalty |
|---|---|
| PPE fully donned before hazard zone entry | +10 |
| Entered hazard zone without PPE (mistake) | −15 (per occurrence) |
| Correct leak source identified on first scan | +10 |
| Incorrect drum flagged before correct one | −5 (per wrong flag) |
| All civilians evacuated | +15 |
| Each civilian left behind | −10 (per civilian) |
| Containment completed successfully | +15 |
| Decontamination completed | +10 |
| Decontamination skipped | −10 |
| **Time bonus** | + up to 20 (scaled — faster completion within a reasonable time window scores higher; avoid punishing careful/correct play too harshly) |

**Final score:** sum of above, normalized to a 0–100 scale for dashboard display.
**Pass/Fail threshold (suggested):** ≥70 = Pass, <70 = Needs Retraining — displayed on instructor dashboard.

---

## 4. Data Schema Implications (for Supabase tables)

**`sessions` table**
- `session_id` (PK)
- `trainee_id`
- `scenario_id` (fixed value: "chemical_spill_v1")
- `started_at`
- `completed_at`
- `final_score`
- `pass_status`

**`events` table** (raw log, one row per event)
- `event_id` (PK)
- `session_id` (FK)
- `event_type` (e.g. `ppe_item_equipped`, `drum_scanned`, `civilian_evacuated`, etc.)
- `event_data` (JSON — flexible field for item name, drum ID, reading value, etc.)
- `timestamp`

**`trainees` table**
- `trainee_id` (PK)
- `name`
- `batch`/`unit` (optional, for NDRF org structure if you want realism)

This structure lets Unity POST every event to Supabase directly (Stage-by-stage), while Spring Boot reads the full `events` list for a `session_id` at the end to compute `final_score` and `pass_status`, writing those back to the `sessions` table.

---

## 5. Minimum Viable Interactions (if time runs short)

If the team is behind schedule by Day 4, this is the priority order to cut scope safely — cut from the bottom up, keep everything above:

1. ✅ PPE donning (core "training" value — keep no matter what)
2. ✅ Detector + leak identification (core mechanic, keep)
3. ✅ Containment (simple, high value, keep)
4. ⚠️ Civilian evacuation (cut to 1 civilian instead of 2–3 if needed)
5. ⚠️ Decontamination (can be simplified to a walk-through trigger with no animation)
6. ❌ Scoring nuance (order-of-PPE bonus, time bonus curve) — can default to flat pass/fail if scoring logic runs out of time

---

## 6. Notes for Each Team Member

- **Chandana M N (Unity interaction):** Build Stages 2, 3, 4, 5, 6 as sequential trigger zones/objects with click interactions. Each stage's "Logged event" should fire an HTTP POST to Supabase immediately when it happens — don't batch events, send them live.
- **Harshini (Environment):** Needs to place — entrance, PPE station, hazard zone with 3–4 drums (1 leaking, marked with VFX), 2–3 civilian NPC spawn points, safe zone marker, decon station. A rough top-down layout sketch would help before building in Unity.
- **Lohith/Monica (Backend):** Design Supabase tables exactly as in Section 4. Spring Boot scoring logic should implement the point table in Section 3 as a simple weighted sum function reading the `events` table.
- **Chandana M P (Dashboard):** Display per-session: final score, pass/fail, time taken, and a breakdown list of which stages had mistakes (pull from `events` where `event_type` contains "mistake"-flagged types).
- **Pavitra (Docs/Testing):** Use this document as the test checklist — walk through Stages 0–7 exactly as written and confirm each logged event fires correctly; also base the written submission's "solution description" on this flow.

---

*This is the single source of truth for the Chemical Spill scenario. Any changes to flow/scoring should be updated here first, then communicated to the team.*
