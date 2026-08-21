# Phase 1: Briefing & Equipment (0:00 – 1:03) — Comprehensive Second-by-Second Production & Engine Blueprint
**Scenario:** SIH260088 — VR-Based CBRN Disaster Response Training (Chemical Module)[cite: 1]  
**Timeline Scope:** Phase 1 (Beats 1 through 9 | 63 Seconds Total)[cite: 1]  
**Target Output:** 4K Cinematic Generation (Veo/Sora) & Unreal Engine 5 / Unity Implementation Guide[cite: 1]  
**Framerate:** 24.00 FPS Timecode  

---

## Technical Architecture & State Machine (Phase 1)


```

[Start Session: GUID Init]
│
▼
[Scene 1: Menu / CCTV] ──(Validation: Non-empty Trainee ID)──► [Beat 1 -> Beat 2 Transition]
│
▼
[Scene 2: Spawn Outside Hazard Zone] ◄───────────────────────── [Initialize HUD & Timer]
│
├─── (If Walk into Yard without PPE) ──► [Log: entered_hazard_zone_without_ppe (-15 pts)]
│
▼
[Scene 3: PPE Staging Area (ZONE_PPEStationTrigger)]
│
├──► Step 1: Click INT_PPE_HazmatSuit ──► [Log: ppe_item_equipped (suit)]
├──► Step 2: Click INT_PPE_GasMask    ──► [Log: ppe_item_equipped (mask)]
├──► Step 3: Click INT_PPE_Gloves     ──► [Log: ppe_item_equipped (gloves)]
│
▼
[All 3 Equipped: IsPPEEquipped = true] ──► [Log: ppe_donning_completed]
│
▼
[Scene 4: Approach Hazard Bay 03] ◄──────────────────────┘
│
▼
[Acquire INT_GasDetector] ──► [Log: detector_equipped] ──► [Transition to Phase 2]

```

---

## Beat 1: Initial Surveillance & Catastrophic Breach (0:00 – 0:07)

* **Game/Engine Scene Reference:** `SCENE 1 — Main Menu / Scenario Briefing`[cite: 1]
* **Target Objective:** Establish high-stakes industrial atmosphere, context of the chemical leak, and capture pre-session operational baseline[cite: 1].
* **Camera Configuration:** Security Camera Lens (`CAM_BAY03_EXT`), 24mm wide focal length, high-angle ceiling corner mount, slight fisheye barrel distortion, 10% digital grain, static mounting bracket with micro-vibrations[cite: 1].
* **Lighting & Atmosphere:** Overcast sky, cool industrial daylight (5500K), wet asphalt specular reflections, amber hazard rotating lights (1000 lumens, 1.2 Hz pulse)[cite: 1].

### Second-by-Second Breakdown
* **0.00s – 1.00s (Frame 000 – 024):**
  * **Visual:** Full-screen surveillance frame over Storage Bay 03[cite: 1]. Perimeter sliding steel gates are partially open[cite: 1]. Wet asphalt in the foreground glints under security floodlights[cite: 1].
  * **Camera Movement:** Static, fixed security camera view[cite: 1].
  * **HUD / UI Elements:** Green digital timestamp in top right corner: `CAM_BAY03_EXT // 21-AUG-2026 // 10:03:15 UTC`[cite: 1]. Center terminal overlay displays `UI_BriefingPanel` with briefing text: *"Alert: Gas leak reported at Storage Bay 3. Suspected chemical agent release. Proceed with standard CBRN chemical response protocol."*[cite: 1]
  * **Audio:** 60Hz electronic hum of surveillance feed, low ambient factory machinery hum in background[cite: 1].
* **1.00s – 2.00s (Frame 024 – 048):**
  * **Visual:** Background chemical staging area shows stacked steel drums (`ZONE_DrumCluster`)[cite: 1]. A tiny white vapor hiss begins escaping from a high-pressure pipe flange near the bay doors[cite: 1].
  * **Camera Movement:** Static; faint sub-bass vibration shakes the frame slightly.
  * **HUD / UI Elements:** `UI_TraineeNameInput` highlights; cursor blinks awaiting input[cite: 1].
  * **Audio:** High-pitched, sharp gas venting hiss emerges over the factory hum.
* **2.00s – 3.00s (Frame 048 – 072):**
  * **Visual:** Pressure escalates. White chemical vapor clouds billow rapidly, dropping down to knee height across the loading bay concrete[cite: 1]. The amber beacon on `ENV_WarningSignage` starts flashing furiously[cite: 1].
  * **Camera Movement:** Fixed view; slight atmospheric heat distortion near pipe.
  * **HUD / UI Elements:** `UI_TraineeNameInput` receives input: `TRN-4089`[cite: 1]. `UI_BeginButton` changes state from disabled grey to active green glow[cite: 1].
  * **Audio:** Rising pitch of escaping pressurized gas; distant warning horn blares once.
* **3.00s – 4.00s (Frame 072 – 096):**
  * **Visual:** **Primary Explosion**. A volatile chemical reaction detonates among the drum cluster[cite: 1]. An intense orange and yellow fireball expands outward instantly, blowing apart wooden pallets and sending two 55-gallon drums airborne[cite: 1].
  * **Camera Movement:** Severe vertical camera shake (shockwave impact); digital video artifacting/horizontal scanline tears across the feed.
  * **HUD / UI Elements:** UI momentarily glitches with static noise before stabilizing.
  * **Audio:** Heavy, concussive explosive blast (sub-bass transient) followed by metal tearing and shattering safety glass.
* **4.00s – 5.00s (Frame 096 – 120):**
  * **Visual:** Thick, pitch-black smoke billows up from the explosion crater, mixing with toxic pale-yellow chemical fog[cite: 1]. Burning chemical liquids spill across the yard tarmac, rolling toward the parked forklift[cite: 1].
  * **Camera Movement:** Camera slowly stabilizes from the shockwave with lingering micro-jitters.
  * **HUD / UI Elements:** Briefing prompt text blinks red: *"CRITICAL HAZARD DETECTED — AUTHORIZE ENTRY."*[cite: 1]
  * **Audio:** Roaring fire crackle, metal sizzling in liquid pool, continuous high-low facility evacuation siren klaxons trigger[cite: 1].
* **5.00s – 6.00s (Frame 120 – 144):**
  * **Visual:** Secondary ignition catches the engine block of the forklift inside Bay 03[cite: 1]. In the foreground, the stainless steel PPE table (`ENV_PPEStationTable`) sits untouched, holding an orange hazmat suit, gas mask, and gloves[cite: 1].
  * **Camera Movement:** Fixed high angle; heavy smoke rolls across upper third of frame[cite: 1].
  * **HUD / UI Elements:** `UI_BeginButton` pulsates, showing `"BEGIN SCENARIO"` prompt[cite: 1].
  * **Audio:** Layered emergency sirens echo off concrete walls; heavy combustion drone[cite: 1].
* **6.00s – 7.00s (Frame 144 – 168):**
  * **Visual:** Flaming wreckage burns steadily across Storage Bay 03 yard[cite: 1]. Smoke obscures the sky, and chemical foam pools on the ground[cite: 1]. The scene freezes for 0.2s before the interface transition initiates.
  * **Camera Movement:** Static hold on the disaster panorama[cite: 1].
  * **HUD / UI Elements:** Virtual mouse cursor clicks `UI_BeginButton`[cite: 1]. Screen dissolves into black transition.
  * **Audio:** Click confirmation chime cuts through the siren audio.
  * **Engine Logic / Backend Event:**
    * Validate `UI_TraineeNameInput != ""`[cite: 1].
    * Generate `sessionId = UUID.randomUUID()`[cite: 1].
    * `MGR_GameManager.StartTime = Time.time`[cite: 1].
    * `EventLogger.Log("scenario_started", { trainee_id: "TRN-4089", scenario_id: "chemical_spill_v1" })`[cite: 1].

---

## Beat 2: First-Person Initialization & Safety Orientation (0:07 – 0:14)

* **Game/Engine Scene Reference:** `SCENE 2 — Facility Entrance (Stage 1: Initial Assessment)`[cite: 1]
* **Target Objective:** Transition from macro surveillance to trainee First-Person Perspective (FPS), boot tactical HUD, and establish the hazard boundary[cite: 1].
* **Camera Configuration:** First-Person Character Camera (Eye level ~1.75m), 90° Horizontal FOV, realistic head motion simulation enabled.
* **Lighting & Atmosphere:** Harsh localized lighting from portable perimeter work lights, intense flickering orange rim-lighting from yard fires, drifting ground smoke[cite: 1].

### Second-by-Second Breakdown
* **7.00s – 8.00s (Frame 168 – 192):**
  * **Visual:** POV boots up from black. Responder's hands (bare tactical under-gloves) briefly raise into view as character steps forward onto the cracked tarmac[cite: 1].
  * **Camera Movement:** Slight upward tilt as the character gains posture and looks straight toward Storage Bay 03[cite: 1].
  * **HUD / UI Elements:** HUD initialization sweep line scans vertically. `UI_HUD_Root` loads: `UI_Timer` appears at top-right (`00:00`), `UI_PPEChecklist` appears at top-left with 3 greyed-out icons (Suit, Mask, Gloves)[cite: 1].
  * **Audio:** Synthetic high-pitch boot chime in helmet audio, sharp breath intake, loud exterior emergency siren[cite: 1].
* **8.00s – 9.00s (Frame 192 – 216):**
  * **Visual:** Visual focus settles on the open loading gate[cite: 1]. Burning debris, scattered pallet fragments, and toxic smoke clouds churn inside the perimeter[cite: 1].
  * **Camera Movement:** Subtle natural breathing idle sway (amplitude 0.02m).
  * **HUD / UI Elements:** System notification box flashes top-center: `ID VALIDATED: [TRN-4089] // SYSTEM AUTHORIZATION: SUCCESSFUL`[cite: 1].
  * **Audio:** Heavy combat boot step on gravel and broken glass.
* **9.00s – 10.00s (Frame 216 – 240):**
  * **Visual:** Across the yard, the burning forklift cabin pops from heat[cite: 1]. Yellow hazard demarcation lines on the ground separate clean zone from contaminated ground[cite: 1].
  * **Camera Movement:** Trainee takes two steps forward (`WASD` forward vector applied)[cite: 1].
  * **HUD / UI Elements:** `UI_StagePrompt` text animates in top-center: *"Assess the situation before proceeding. Do not enter the hazard zone without PPE."*[cite: 1]
  * **Audio:** Automated synthesized voice on radio comms: *"Warning. Hazardous atmospheric conditions detected in Bay 3. Do not proceed unequipped."*[cite: 1]
* **10.00s – 11.00s (Frame 240 – 264):**
  * **Visual:** Trainee approaches the boundary line where `ENV_WarningSignage` stands bolted to the gatepost[cite: 1].
  * **Camera Movement:** Trainee glances left toward the warning plaque, panning 25° left[cite: 1].
  * **HUD / UI Elements:** Center `UI_Crosshair` (white circle) hovers over the warning sign[cite: 1].
  * **Audio:** Wind howling through chainlink fence mixing with distant chemical hiss.
* **11.00s – 12.00s (Frame 264 – 288):**
  * **Visual:** Direct view of the bold signage: `DANGER - HAZARDOUS MATERIALS - PPE REQUIRED BEYOND THIS POINT`[cite: 1].
  * **Camera Movement:** Quick pan 45° right, scanning toward the staging benches outside the hot zone[cite: 1].
  * **HUD / UI Elements:** `UI_StagePrompt` pulses once with amber highlight to reinforce protocol[cite: 1].
  * **Audio:** Low electrical hum from adjacent facility transformer.
* **12.00s – 13.00s (Frame 288 – 312):**
  * **Visual:** Trainee sights `ENV_PPEStationTable` located 8 meters away on the clean concrete apron, illuminated by an overhead utility light[cite: 1].
  * **Camera Movement:** Camera aligns straight with the PPE bench; forward sprint begins (`LeftShift + W`)[cite: 1].
  * **HUD / UI Elements:** Green tactical bracket highlights the PPE bench in the distance[cite: 1].
  * **Audio:** Fast running footstep cadence on solid concrete[cite: 1].
* **13.00s – 14.00s (Frame 312 – 336):**
  * **Visual:** Trainee sprints across the tarmac toward the staging bench, closing the distance rapidly[cite: 1].
  * **Camera Movement:** Dynamic sprint head-bob (frequency 2.2 Hz, vertical oscillation)[cite: 1].
  * **HUD / UI Elements:** `UI_Timer` increments to `00:07`[cite: 1].
  * **Audio:** Accelerated breathing, wind rush in ears, siren volume scales naturally.
  * **Engine Logic / Backend Event:**
    * Evaluates player position: player has NOT crossed `ZONE_HazardZoneTrigger` before equipping PPE, avoiding penalty flag `entered_hazard_zone_without_ppe`[cite: 1].

---

## Beat 3: Environmental Hazard Scan & Terminal Blowout (0:14 – 0:21)

* **Game/Engine Scene Reference:** `SCENE 2 — Facility Entrance (Atmospheric Telemetry Check)`[cite: 1]
* **Target Objective:** Show high environmental toxicity via auxiliary telemetry and demonstrate physical consequences of explosive chemical blowout[cite: 1].
* **Camera Configuration:** First-Person POV transitioning to tight focus on damaged environmental terminal, 50mm equivalent focal crop on console readout[cite: 1].
* **Lighting & Atmosphere:** Backlit by raging yard fires, strong point-light flickers from shorting electrical wires (blue-white arc flashes, 8000K)[cite: 1].

### Second-by-Second Breakdown
* **14.00s – 15.00s (Frame 336 – 360):**
  * **Visual:** Trainee momentarily halts beside a mounted wall telemetry console (`ENV_TerminalConsole`) near the bay entrance arch before reaching the bench[cite: 1].
  * **Camera Movement:** Camera decelerates from run, panning 30° toward the charred steel console housing[cite: 1].
  * **HUD / UI Elements:** Persistent HUD maintains timer at `00:08`[cite: 1].
  * **Audio:** Sharp, erratic electrical crackling and sputtering wire arcs.
* **15.00s – 16.00s (Frame 360 – 384):**
  * **Visual:** The console's outer casing is blown open from the blast, exposing blackened circuit boards, melted ribbon cables, and smoking capacitors[cite: 1].
  * **Camera Movement:** Slight zoom/push-in toward the fractured digital auxiliary display embedded in the console faceplate[cite: 1].
  * **HUD / UI Elements:** Reticle hovers over damaged instrumentation.
  * **Audio:** Low, buzzing mains-hum intercut with high-voltage zap sounds.
* **16.00s – 17.00s (Frame 384 – 408):**
  * **Visual:** The cracked LED display flickers erratically, numbers cycling rapidly upward: `120.0... 280.4... 390.1 ppm`[cite: 1].
  * **Camera Movement:** Slow macro pan across the warped dial knobs and charred label plates[cite: 1].
  * **HUD / UI Elements:** Small telemetry prompt appears: `ATMOSPHERIC TOXICITY: SEVERE`[cite: 1].
  * **Audio:** Rapid, urgent warning beeping emitted from the console's internal speaker.
* **17.00s – 18.00s (Frame 408 – 432):**
  * **Visual:** Digital readout locks hard at `412.5 ppm` with a flashing red warning diode[cite: 1]. Smoke curls heavily off the surface of the melted board[cite: 1].
  * **Camera Movement:** Steady close-up hold on the `412.5 ppm` display[cite: 1].
  * **HUD / UI Elements:** HUD flashes a red border warning: *"TOXIC CONCENTRATION EXCEEDS IDLH THRESHOLD"*[cite: 1].
  * **Audio:** High-frequency alarm whine peaks in volume.
* **18.00s – 19.00s (Frame 432 – 456):**
  * **Visual:** **Electrical Blowout**. A catastrophic surge causes the auxiliary monitor to pop violently[cite: 1]. A shower of bright blue-white electrical sparks shoots out across the faceplate, igniting a small localized wire flare[cite: 1].
  * **Camera Movement:** Natural reactive jerk back (flinch back 0.15m) in response to the spark burst.
  * **HUD / UI Elements:** Telemetry display dies to black static.
  * **Audio:** Loud electrical pop/bang, followed by sizzling wire insulation and fading dying hum.
* **19.00s – 20.00s (Frame 456 – 480):**
  * **Visual:** The console goes completely dead, releasing a thick puff of dark acrid smoke from the burnt internal wiring harness[cite: 1]. Background flames rage across the yard[cite: 1].
  * **Camera Movement:** Camera turns away from the destroyed console back toward the staging area path[cite: 1].
  * **HUD / UI Elements:** `UI_StagePrompt` re-asserts: *"Equip full PPE immediately to enter the hazard zone."*[cite: 1]
  * **Audio:** Siren klaxon remains dominant; distant metal structural collapse sound.
* **20.00s – 21.00s (Frame 480 – 504):**
  * **Visual:** Trainee re-engages forward movement toward the clean PPE staging table[cite: 1].
  * **Camera Movement:** Fast forward track across the concrete apron[cite: 1].
  * **HUD / UI Elements:** `UI_Timer` marks `00:14`[cite: 1].
  * **Audio:** Running boots on pavement resuming pace.
  * **Engine Logic / Backend Event:**
    * Ambient atmospheric parameter set to `Extreme Toxicity` (simulated ppm load active in memory for subsequent detector calibration)[cite: 1].

---

## Beat 4: Protocol Navigation & Interaction Lock-On (0:21 – 0:28)

* **Game/Engine Scene Reference:** `SCENE 3 — PPE Station (Approach & Trigger Entry)`[cite: 1]
* **Target Objective:** Approach the staging table, enter `ZONE_PPEStationTrigger`, activate green interaction reticle, and prepare gear selection[cite: 1].
* **Camera Configuration:** First-Person POV, 85° FOV, smooth deceleration curve to mimic human stopping mechanics.
* **Lighting & Atmosphere:** Bright clean white overhead halogen floodlight (4000K, CRI 90) illuminating the stainless steel staging table, standing out against the smoky background[cite: 1].

### Second-by-Second Breakdown
* **21.00s – 22.00s (Frame 504 – 528):**
  * **Visual:** Trainee enters the immediate radius of `ZONE_PPEStationTrigger`[cite: 1]. The clean staging bench sits directly ahead against the facility outer wall[cite: 1].
  * **Camera Movement:** Camera smoothly slows down from run to walking pace[cite: 1].
  * **HUD / UI Elements:** `UI_Crosshair` centers on the bench[cite: 1]. Distance counter beneath crosshair ticks down: `3.2m -> 2.5m`[cite: 1].
  * **Audio:** Heavy deceleration footstep shuffle on concrete[cite: 1].
* **22.00s – 23.00s (Frame 528 – 552):**
  * **Visual:** The items on `ENV_PPEStationTable` become distinctly visible: folded bright-orange Level B Hazmat Suit (`INT_PPE_HazmatSuit`), CBRN Full-Face Respirator (`INT_PPE_GasMask`), and heavy chemical gloves (`INT_PPE_Gloves`)[cite: 1].
  * **Camera Movement:** Camera positions directly in front of the table at a comfortable working distance (1.2m)[cite: 1].
  * **HUD / UI Elements:** As interaction distance drops below 2.5 units, `UI_Crosshair` transitions from white circle to bright green reticle[cite: 1].
  * **Audio:** Low positive electronic tone indicating interactable objects detected[cite: 1].
* **23.00s – 24.00s (Frame 552 – 576):**
  * **Visual:** Green 3D tactical bounding boxes project over the three items on the table[cite: 1]. A label `[E] EQUIP HAZMAT SUIT` hovers over the orange suit[cite: 1].
  * **Camera Movement:** Slight downward tilt (15°) to frame all three equipment pieces neatly on the metallic tabletop[cite: 1].
  * **HUD / UI Elements:** `UI_StagePrompt` updates: *"Equip your PPE: Hazmat Suit, Gas Mask, and Gloves."*[cite: 1]
  * **Audio:** Radio voice prompt: *"Don protective suit first, seal mask, then secure gloves."*[cite: 1]
* **24.00s – 25.00s (Frame 576 – 600):**
  * **Visual:** Trainee hovers cursor over `INT_PPE_HazmatSuit`[cite: 1]. The suit mesh gains a subtle pulsing green edge-glow shader[cite: 1].
  * **Camera Movement:** Micro-stabilized first-person view.
  * **HUD / UI Elements:** Tooltip displays: `ITEM: CHEMICAL RESISTANT HAZMAT SUIT // STATUS: READY`[cite: 1].
  * **Audio:** Soft electronic focus click.
* **25.00s – 26.00s (Frame 600 – 624):**
  * **Visual:** Trainee's right hand extends toward the folded suit on the table[cite: 1].
  * **Camera Movement:** Static forward framing on the table[cite: 1].
  * **HUD / UI Elements:** PPE checklist top-left highlights the `Suit` slot with a yellow pulsing selector border[cite: 1].
  * **Audio:** Fabric movement rustle begins as hands make contact with the heavy impermeable material[cite: 1].
* **26.00s – 27.00s (Frame 624 – 648):**
  * **Visual:** Hands grasp the orange suit, lifting it off the steel surface[cite: 1].
  * **Camera Movement:** Slight upward tilt following the lifting motion[cite: 1].
  * **HUD / UI Elements:** Left-click interaction registered[cite: 1].
  * **Audio:** Heavy coated nylon fabric unfolding and flexing sound[cite: 1].
* **27.00s – 28.00s (Frame 648 – 672):**
  * **Visual:** The suit is fully picked up from the bench, transitioning into the donning animation sequence[cite: 1].
  * **Camera Movement:** Slight backward body lean to accommodate the suit-up motion[cite: 1].
  * **HUD / UI Elements:** `UI_Timer` reads `00:21`[cite: 1].
  * **Audio:** Crisp zipper track sliding sound starts[cite: 1].
  * **Engine Logic / Backend Event:**
    * `ZONE_PPEStationTrigger` state confirmed `PlayerInside = true`[cite: 1].
    * Pre-donning order tracking initialized (`PpeEquipOrderCounter = 1`)[cite: 1].

---

## Beat 5: PPE Donning: Chemical Hazmat Suit (0:28 – 0:35)

* **Game/Engine Scene Reference:** `SCENE 3 — PPE Station (Suit Donning Interaction)`[cite: 1]
* **Target Objective:** Execute suit-equipping interaction, log first PPE item event, update UI checklist, and change player avatar first-person mesh to orange sleeved arms[cite: 1].
* **Camera Configuration:** First-Person POV with contextual hand/arm animations entering lower screen space.
* **Lighting & Atmosphere:** Bright clinical reflection from the stainless steel table surface onto the orange polymer fabric[cite: 1].

### Second-by-Second Breakdown
* **28.00s – 29.00s (Frame 672 – 696):**
  * **Visual:** The orange hazmat suit is pulled up over the character's body[cite: 1]. First-person arms now render heavy, high-visibility orange protective fabric sleeves instead of regular uniform fabric[cite: 1].
  * **Camera Movement:** Dynamic downward tilt as the character zips up the central torso seal[cite: 1].
  * **HUD / UI Elements:** Progress ring around the suit item fills clockwise to 100%[cite: 1].
  * **Audio:** Heavy-duty airtight zipper zipping upward, followed by Velcro storm flap pressing closed[cite: 1].
* **29.00s – 30.00s (Frame 696 – 720):**
  * **Visual:** Trainee flexes arms; orange sleeves with elastic cuffs settle firmly around the wrists[cite: 1].
  * **Camera Movement:** Camera tilts back up to level perspective facing the staging table[cite: 1].
  * **HUD / UI Elements:** On `UI_PPEChecklist`, the `Suit` icon changes from greyed-out to bright green with a solid checkmark[cite: 1].
  * **Audio:** Positive UI confirmation chime (`MGR_AudioManager.PlayEquipSound()`)[cite: 1].
* **30.00s – 31.00s (Frame 720 – 744):**
  * **Visual:** On the table, the `INT_PPE_HazmatSuit` mesh dissolves/disappears, leaving only the gas mask and gloves on the stainless steel surface[cite: 1].
  * **Camera Movement:** Static focus on remaining gear on table[cite: 1].
  * **HUD / UI Elements:** Center crosshair shifts focus toward `INT_PPE_GasMask`[cite: 1].
  * **Audio:** Heavy synthetic fabric rustle as arms lower to ready stance[cite: 1].
* **31.00s – 32.00s (Frame 744 – 768):**
  * **Visual:** Tactical green bounding box snaps onto `INT_PPE_GasMask`[cite: 1]. Tooltip displays: `[E] EQUIP CBRN RESPIRATOR`[cite: 1].
  * **Camera Movement:** Small micro-pan centering the black rubber respirator in the field of view[cite: 1].
  * **HUD / UI Elements:** PPE checklist slot 2 (`Mask`) pulses yellow[cite: 1].
  * **Audio:** Distant siren sounds become slightly muffled as suit collar rises around neck[cite: 1].
* **32.00s – 33.00s (Frame 768 – 792):**
  * **Visual:** Trainee's orange-sleeved hand reaches out and grasps the top strap of the full-face respirator[cite: 1].
  * **Camera Movement:** Slight forward push toward the table (0.1m)[cite: 1].
  * **HUD / UI Elements:** Reticle confirms interaction contact[cite: 1].
  * **Audio:** Soft rubber flex sound as mask is lifted from the metal surface[cite: 1].
* **33.00s – 34.00s (Frame 792 – 816):**
  * **Visual:** The mask is lifted off the table, rotating so its wide polycarbonate visor faces directly toward the camera[cite: 1]. Dual side filter canisters are clearly visible[cite: 1].
  * **Camera Movement:** The mask rises up directly toward the camera lens[cite: 1].
  * **HUD / UI Elements:** `UI_Timer` increments to `00:27`[cite: 1].
  * **Audio:** Elastic harness tension creak as straps stretch open[cite: 1].
* **34.00s – 35.00s (Frame 816 – 840):**
  * **Visual:** The inner silicone cup of the mask comes within inches of the screen, preparing to cover the field of view[cite: 1].
  * **Camera Movement:** Camera pushes directly into the center of the mask visor aperture[cite: 1].
  * **HUD / UI Elements:** Crosshair fades out momentarily[cite: 1].
  * **Audio:** Deep intake of breath by the operator[cite: 1].
  * **Engine Logic / Backend Event:**
    * `MGR_GameManager.SuitEquipped = true`[cite: 1].
    * `EventLogger.Log("ppe_item_equipped", { item: "suit", order_index: 1, timestamp: "2026-08-21T10:03:43Z" })`[cite: 1].
    * `PpeEquipOrderCounter++`[cite: 1].

---

## Beat 6: PPE Donning: CBRN Gas Mask (0:35 – 0:42)

* **Game/Engine Scene Reference:** `SCENE 3 — PPE Station (Mask Donning & Seal Test)`[cite: 1]
* **Target Objective:** Don the gas mask, apply curved visor overlay post-processing, alter audio mix to internal respirator breathing, and update checklist[cite: 1].
* **Camera Configuration:** First-Person POV with mask-internal curved overlay vignette, slight optical refraction at screen corners, subtle breathing condensation shader.
* **Lighting & Atmosphere:** Post-processing color grade shifts slightly cooler; ambient exterior lights dim by 15% due to tinted polycarbonate visor lens.

### Second-by-Second Breakdown
* **35.00s – 36.00s (Frame 840 – 864):**
  * **Visual:** The mask pulls over the trainee's face. The screen briefly darkens as the silicone gasket seals firmly against the skin[cite: 1].
  * **Camera Movement:** Fast snap into the mask's interior perspective[cite: 1].
  * **HUD / UI Elements:** Screen border transforms: a subtle dark rubberized curved mask overlay frames the peripheral vision (top, bottom, and side edges).
  * **Audio:** Loud, resonant rubber suction snap (`*THWUMP*`) as the seal completes against the facial contour[cite: 1].
* **36.00s – 37.00s (Frame 864 – 888):**
  * **Visual:** Visor optical clarity settles. A faint translucent HUD reflection is cast on the inside surface of the visor glass.
  * **Camera Movement:** Micro-nod as the harness straps tighten over the back of the head.
  * **HUD / UI Elements:** `UI_PPEChecklist` icon for `Mask` turns bright green with a checkmark[cite: 1].
  * **Audio:** Sudden, dramatic acoustic shift: external sirens and fire roars drop by -18dB (muffled low-pass filter at 800Hz)[cite: 1]. First loud, rhythmic breath draws through the canister intake valve[cite: 1].
* **37.00s – 38.00s (Frame 888 – 912):**
  * **Visual:** Trainee looks back down at `ENV_PPEStationTable` through the respirator visor[cite: 1]. The mask mesh is now gone from the table[cite: 1]; only `INT_PPE_Gloves` remain[cite: 1].
  * **Camera Movement:** Downward tilt (20°) centering the black chemical gloves[cite: 1].
  * **HUD / UI Elements:** Center crosshair reactivates, highlighting `INT_PPE_Gloves` with a green tactical bracket[cite: 1].
  * **Audio:** Exhalation air valve hiss (`*PFFFT*`) through the front exhalation port of the mask[cite: 1].
* **38.00s – 39.00s (Frame 912 – 936):**
  * **Visual:** Faint, momentary fogging appears at the very bottom corners of the visor during exhalation, instantly clearing via internal airflow.
  * **Camera Movement:** Static framing on the gloves[cite: 1].
  * **HUD / UI Elements:** Tooltip displays: `[E] EQUIP CHEMICAL RESISTANT GLOVES`[cite: 1].
  * **Audio:** Rhythmic mechanical inhalation sound (`*HUUUUH*`)[cite: 1].
* **39.00s – 40.00s (Frame 936 – 960):**
  * **Visual:** Both orange-sleeved hands reach down toward the heavy black neoprene gloves resting on the table[cite: 1].
  * **Camera Movement:** Slight forward lean toward the table surface[cite: 1].
  * **HUD / UI Elements:** `UI_PPEChecklist` slot 3 (`Gloves`) flashes yellow[cite: 1].
  * **Audio:** Rubber friction squeak as gloves are grasped from the steel tabletop[cite: 1].
* **40.00s – 41.00s (Frame 960 – 984):**
  * **Visual:** The gloves are lifted into the foreground; heavy textured black rubber material is shown in high detail[cite: 1].
  * **Camera Movement:** Camera tilts upward slightly to frame hands in front of the chest[cite: 1].
  * **HUD / UI Elements:** Interaction progress bar completes[cite: 1].
  * **Audio:** Regular measured inhalation through the CBRN filter canisters[cite: 1].
* **41.00s – 42.00s (Frame 984 – 1008):**
  * **Visual:** Trainee positions the left glove over the right hand and orange cuff, preparing to pull it on[cite: 1].
  * **Camera Movement:** Steady first-person hold on the hand actions[cite: 1].
  * **HUD / UI Elements:** `UI_Timer` reaches `00:34`[cite: 1].
  * **Audio:** Exhalation valve release sound[cite: 1].
  * **Engine Logic / Backend Event:**
    * `MGR_GameManager.MaskEquipped = true`[cite: 1].
    * `EventLogger.Log("ppe_item_equipped", { item: "mask", order_index: 2, timestamp: "2026-08-21T10:03:50Z" })`[cite: 1].
    * `PpeEquipOrderCounter++`[cite: 1].

---

## Beat 7: PPE Donning: Protective Gloves & Full Clearance (0:42 – 0:49)

* **Game/Engine Scene Reference:** `SCENE 3 — PPE Station (Completion & Clearance)`[cite: 1]
* **Target Objective:** Secure gloves over suit cuffs, validate all 3 PPE items equipped, fire `ppe_donning_completed` event, and update stage prompt to allow safe zone entry[cite: 1].
* **Camera Configuration:** First-Person POV through mask visor, hands fully animated in foreground, tilting up toward the facility gates[cite: 1].
* **Lighting & Atmosphere:** Direct light highlights the thick rubber sheen on the gloves; background smoke continues drifting past the overhead lamp[cite: 1].

### Second-by-Second Breakdown
* **42.00s – 43.00s (Frame 1008 – 1032):**
  * **Visual:** Trainee pulls the heavy black chemical-resistant glove firmly over the right hand and orange sleeve cuff[cite: 1]. The elastic gauntlet snaps tightly around the forearm[cite: 1].
  * **Camera Movement:** Downward focus on the right wrist assembly[cite: 1].
  * **HUD / UI Elements:** Right glove icon graphic lights up on HUD overlay[cite: 1].
  * **Audio:** Heavy rubber snap and stretch sound (`*SNAP-THUD*`)[cite: 1].
* **43.00s – 44.00s (Frame 1032 – 1056):**
  * **Visual:** The left hand is slid into the second glove; fingers interlock and flex to ensure tight tactile seal and mobility[cite: 1].
  * **Camera Movement:** Hands raise to chest level; fingers flex and clench into fists to test grip[cite: 1].
  * **HUD / UI Elements:** `UI_PPEChecklist` third icon (`Gloves`) turns bright green with a checkmark[cite: 1].
  * **Audio:** Rubber friction squeak as fingers interlock, followed by mask airflow sound[cite: 1].
* **44.00s – 45.00s (Frame 1056 – 1080):**
  * **Visual:** All three checklist icons pulse with a synchronized green glow, signaling full PPE clearance[cite: 1]. The tabletop is now completely clear of gear[cite: 1].
  * **Camera Movement:** Trainee head tilts up from hands to look forward toward the facility gates[cite: 1].
  * **HUD / UI Elements:** Prominent HUD banner flashes top-center: `PPE DONNING COMPLETE // PROTOCOL LEVEL 2 AUTHORIZED`[cite: 1].
  * **Audio:** High-pitched positive achievement chime plays in the helmet comms[cite: 1].
* **45.00s – 46.00s (Frame 1080 – 1104):**
  * **Visual:** `UI_StagePrompt` text refreshes: *"PPE equipped. Proceed to the hazard zone and use your detector to locate the leak."*[cite: 1]
  * **Camera Movement:** Camera turns 30° left, realigning with the path leading into Storage Bay 03[cite: 1].
  * **HUD / UI Elements:** Tactical navigational waypoint `[OBJECTIVE: ENTER BAY 03]` appears hovering in world space above the gates[cite: 1].
  * **Audio:** Automated radio dispatch voice: *"Protective gear confirmed. Atmospheric entry permitted. Proceed with gas detection protocol."*[cite: 1]
* **46.00s – 47.00s (Frame 1104 – 1128):**
  * **Visual:** Trainee lowers hands from view and takes the first forward step away from `ENV_PPEStationTable`[cite: 1].
  * **Camera Movement:** Smooth forward camera acceleration[cite: 1].
  * **HUD / UI Elements:** Crosshair re-centers as a sharp green dot[cite: 1].
  * **Audio:** Rhythmic respirator breathing cycle (inhalation 2.0s, exhalation 1.5s)[cite: 1].
* **47.00s – 48.00s (Frame 1128 – 1152):**
  * **Visual:** Trainee steps off the clean staging pad onto the main asphalt driveway leading to the gate[cite: 1].
  * **Camera Movement:** Forward walking head-bob builds momentum into a jog[cite: 1].
  * **HUD / UI Elements:** Distance marker to objective gate counts down: `18m -> 14m`[cite: 1].
  * **Audio:** Muffled boot steps on tarmac, continuous background fire rumble[cite: 1].
* **48.00s – 49.00s (Frame 1152 – 1176):**
  * **Visual:** View expands to reveal the full width of the smoking facility entrance[cite: 1].
  * **Camera Movement:** Jogging motion continues toward the gate boundary[cite: 1].
  * **HUD / UI Elements:** `UI_Timer` increments to `00:41`[cite: 1].
  * **Audio:** Low filter hiss in mask[cite: 1].
  * **Engine Logic / Backend Event:**
    * `MGR_GameManager.GlovesEquipped = true`[cite: 1].
    * `MGR_GameManager.IsPPEEquipped = true`[cite: 1].
    * `EventLogger.Log("ppe_item_equipped", { item: "gloves", order_index: 3, timestamp: "2026-08-21T10:03:58Z" })`[cite: 1].
    * `EventLogger.Log("ppe_donning_completed", { total_time_seconds: 21.4 })`[cite: 1].

---

## Beat 8: Advance to Hazard Zone Perimeter (0:49 – 0:56)

* **Game/Engine Scene Reference:** `SCENE 2 → SCENE 4 (Hazard Zone Perimeter Transit)`[cite: 1]
* **Target Objective:** Traverse from the PPE staging station across the boundary line into the hazard zone, validating zero penalty when PPE is equipped[cite: 1].
* **Camera Configuration:** First-Person POV through mask visor, dynamic running camera bob, depth-of-field shifting toward burning storage yard in the mid-ground[cite: 1].
* **Lighting & Atmosphere:** Volumetric light rays slicing through billowing yellow-gray smoke plumes, reflections of orange flames shimmering in chemical puddles on asphalt[cite: 1].

### Second-by-Second Breakdown
* **49.00s – 50.00s (Frame 1176 – 1200):**
  * **Visual:** Trainee breaks into a full sprint toward the open sliding gate of Storage Bay 03[cite: 1]. Orange-sleeved arms pump in and out of the lower peripheral view[cite: 1].
  * **Camera Movement:** Full sprint camera oscillation (frequency 2.4 Hz, dynamic lateral sway)[cite: 1].
  * **HUD / UI Elements:** Visor glass reflects passing floodlight poles on the interior curved edges.
  * **Audio:** Accelerated, heavy breathing through the filter canisters; rapid muffled boot thuds[cite: 1].
* **50.00s – 51.00s (Frame 1200 – 1224):**
  * **Visual:** Passing the yellow hazard sign `ENV_WarningSignage` on the left gatepost[cite: 1]. Ground transition shows chemical runoff foam spreading across the asphalt[cite: 1].
  * **Camera Movement:** Camera tracks straight ahead through the center of the gate opening[cite: 1].
  * **HUD / UI Elements:** Waypoint marker updates: `[HAZARD ZONE PERIMETER: 5m]`[cite: 1].
  * **Audio:** Ambient roar of secondary fire builds in volume through the mask muffling[cite: 1].
* **51.00s – 52.00s (Frame 1224 – 1248):**
  * **Visual:** **Boundary Crossing**. Trainee's boots step across the yellow-and-black painted hazard demarcation line on the ground into `ZONE_HazardZoneTrigger`[cite: 1].
  * **Camera Movement:** Forward sprint maintains velocity across the boundary plane[cite: 1].
  * **HUD / UI Elements:** Top HUD briefly flashes a green safety confirmation: `ATMOSPHERIC SHIELD: PPE ACTIVE — NO CONTAMINATION DETECTED`[cite: 1].
  * **Audio:** Deep, steady intake of breath through the respirator[cite: 1].
* **52.00s – 53.00s (Frame 1248 – 1272):**
  * **Visual:** Inside the yard, the environment is chaotic: overturned steel drums, burning wooden pallets, and a dense fog bank hovering 1 meter off the ground[cite: 1].
  * **Camera Movement:** Trainee begins decelerating, scanning left-to-right across the chemical drum cluster[cite: 1].
  * **HUD / UI Elements:** Objective prompt shifts: *"Locate gas detector on utility crate to begin chemical sweeps."*[cite: 1]
  * **Audio:** Crackle of burning pallets, chemical sizzle, rhythmic breathing cycle[cite: 1].
* **53.00s – 54.00s (Frame 1272 – 1296):**
  * **Visual:** Directly to the right of the entrance path, an olive-drab plastic utility crate sits against the warehouse wall, holding the yellow handheld gas detector (`INT_GasDetector`)[cite: 1].
  * **Camera Movement:** Camera pans 35° right, locking onto the utility crate and detector tool[cite: 1].
  * **HUD / UI Elements:** Tactical green brackets snap onto `INT_GasDetector` with label `[E] EQUIP MULTI-GAS DETECTOR`[cite: 1].
  * **Audio:** Electronic lock-on chime in helmet audio[cite: 1].
* **54.00s – 55.00s (Frame 1296 – 1320):**
  * **Visual:** Trainee takes two controlled steps toward the utility crate, extending the gloved left hand[cite: 1].
  * **Camera Movement:** Smooth stop directly in front of the utility crate (1.0m distance)[cite: 1].
  * **HUD / UI Elements:** Reticle turns bright green over the detector mesh[cite: 1].
  * **Audio:** Exhalation valve release sound (`*PFFFT*`)[cite: 1].
* **55.00s – 56.00s (Frame 1320 – 1344):**
  * **Visual:** Gloved hand reaches down and grips the ergonomic handle of the yellow gas detector tool[cite: 1].
  * **Camera Movement:** Slight downward camera tilt (25°) to frame the grab action[cite: 1].
  * **HUD / UI Elements:** `UI_Timer` ticks to `00:48`[cite: 1].
  * **Audio:** Plastic click as detector is unlatched from its charging cradle[cite: 1].
  * **Engine Logic / Backend Event:**
    * `ZONE_HazardZoneTrigger.OnTriggerEnter` validates `IsPPEEquipped == true` -> Zero penalty events fired[cite: 1].

---

## Beat 9: Entry & Handheld Gas Detector Acquisition (0:56 – 1:03)

* **Game/Engine Scene Reference:** `SCENE 4 — Hazard Zone: Detection (Stage 3 Initialization)`[cite: 1]
* **Target Objective:** Equip the handheld multi-gas detector, activate the HUD detector gauge (`UI_DetectorReading`), establish baseline ppm reading, and transition seamlessly to Phase 2 leak identification[cite: 1].
* **Camera Configuration:** First-Person POV through mask visor, right hand holding the detector tool in lower-right foreground, facing outward toward the smoking drum clusters[cite: 1].
* **Lighting & Atmosphere:** Strong atmospheric volumetric fog, flashing amber alarm reflections against the wet yellow casing of the detector device[cite: 1].

### Second-by-Second Breakdown
* **56.00s – 57.00s (Frame 1344 – 1368):**
  * **Visual:** Trainee lifts `INT_GasDetector` off the utility crate into active first-person view[cite: 1]. The device features a rugged yellow rubberized casing, an intake probe at the tip, and a backlit LCD screen[cite: 1].
  * **Camera Movement:** Camera tilts back up to level perspective while the detector enters lower-right screen space[cite: 1].
  * **HUD / UI Elements:** Bottom-right HUD sector unlocks: `UI_DetectorReading` canvas activates, showing a circular needle gauge graphic and a numeric ppm display[cite: 1].
  * **Audio:** Multi-tone electronic startup chirp from the handheld detector unit (`*BEEP-BOOP-BEEP*`)[cite: 1].
* **57.00s – 58.00s (Frame 1368 – 1392):**
  * **Visual:** The detector's LCD screen cycles its self-test screen, displaying `SENSOR SELF-TEST: OK // PIDs ACTIVE`[cite: 1].
  * **Camera Movement:** Trainee holds the detector forward in a functional scanning posture[cite: 1].
  * **HUD / UI Elements:** The analog needle gauge on `UI_DetectorReading` calibrates, swinging from max to zero, then settling at a low baseline reading: `12.4 ppm` (background contamination)[cite: 1].
  * **Audio:** Low, steady rhythmic sensory clicking (1 click per second, baseline rate)[cite: 1].
* **58.00s – 59.00s (Frame 1392 – 1416):**
  * **Visual:** Trainee turns to face the open expanse of Storage Bay 03[cite: 1]. In the center of the yard sits the primary drum cluster (`INT_Drum_01`, `INT_Drum_02`, `INT_Drum_03`, `INT_Drum_04`)[cite: 1]. Dense chemical fog slowly vents from the rear of the cluster[cite: 1].
  * **Camera Movement:** Slow 40° left scan surveying the four potential drum targets[cite: 1].
  * **HUD / UI Elements:** `UI_StagePrompt` updates: *"Use your detector to scan drums and locate the leaking source."*[cite: 1]
  * **Audio:** Filtered inhalation breath; distant hiss of the active chemical leak[cite: 1].
* **59.00s – 1:00.00s (Frame 1416 – 1440):**
  * **Visual:** Trainee takes two measured steps forward into the smoky courtyard[cite: 1]. The detector's sample intake pump hums softly as it draws in ambient air[cite: 1].
  * **Camera Movement:** Forward tracking shot, maintaining detector framed in lower-right corner[cite: 1].
  * **HUD / UI Elements:** Distance to nearest drum (`INT_Drum_01`) displays: `8.5m`[cite: 1].
  * **Audio:** Detector sample pump motorized hum (`*whirrr*`)[cite: 1].
* **1:00.00s – 1:01.00s (Frame 1440 – 1464):**
  * **Visual:** Drifting yellow vapor curls past the responder's mask visor[cite: 1]. The needle on the HUD detector gauge flutters slightly between `14.0` and `16.2 ppm` (ambient dispersion noise)[cite: 1].
  * **Camera Movement:** Steady advance toward the drum cluster[cite: 1].
  * **HUD / UI Elements:** Green crosshair aligns with the first drum in the row (`INT_Drum_01`)[cite: 1].
  * **Audio:** Detector clicks increase slightly in frequency (2 clicks per second)[cite: 1].
* **1:01.00s – 1:02.00s (Frame 1464 – 1488):**
  * **Visual:** Trainee closes within 4 meters of the drums[cite: 1]. Chemical puddles on the ground reflect the flashing warning lights above[cite: 1].
  * **Camera Movement:** Slight downward tilt aligning the detector probe tip with the base of the drums[cite: 1].
  * **HUD / UI Elements:** Interactive prompt appears: `[CLICK TO SCAN DRUM_01]`[cite: 1].
  * **Audio:** Exhalation valve release (`*PFFFT*`)[cite: 1].
* **1:02.00s – 1:03.00s (Frame 1488 – 1512):**
  * **Visual:** Trainee steps directly into scanning range of the drum cluster[cite: 1]. In the background, `INT_Drum_02` shows active gas particle emissions (`ENV_GasVFX_Leak`)[cite: 1], setting up Phase 2[cite: 1].
  * **Camera Movement:** Smooth hold in ready position facing the drums[cite: 1].
  * **HUD / UI Elements:** `UI_Timer` hits `00:55`[cite: 1]. All systems nominal for Stage 3 detection sweeps[cite: 1].
  * **Audio:** Deep intake of breath as detector sample intake pump continues to hum[cite: 1].
  * **Engine Logic / Backend Event:**
    * `MGR_GameManager.DetectorEquipped = true`[cite: 1].
    * `EventLogger.Log("detector_equipped", {})`[cite: 1].
    * Seamless hand-off to Beat 10 (Phase 2: Hazard Detection & Identification)[cite: 1].

---

## Complete Phase 1 Event Logging Schema (Backend Reference)

Every event logged during these first 63 seconds is dispatched through `MGR_EventLogger.Log()` using the following JSON payloads[cite: 1]:

```json
/* Beat 1: Scenario Start */
{
  "session_id": "c7a84e20-53ab-4412-b2fa-908cf4e81a33",
  "event_type": "scenario_started",
  "event_data": {
    "trainee_id": "TRN-4089",
    "scenario_id": "chemical_spill_v1"
  },
  "timestamp": "2026-08-21T10:03:15Z"
}

/* Beat 5: Hazmat Suit Equipped */
{
  "session_id": "c7a84e20-53ab-4412-b2fa-908cf4e81a33",
  "event_type": "ppe_item_equipped",
  "event_data": {
    "item": "suit",
    "order_index": 1
  },
  "timestamp": "2026-08-21T10:03:43Z"
}

/* Beat 6: Gas Mask Equipped */
{
  "session_id": "c7a84e20-53ab-4412-b2fa-908cf4e81a33",
  "event_type": "ppe_item_equipped",
  "event_data": {
    "item": "mask",
    "order_index": 2
  },
  "timestamp": "2026-08-21T10:03:50Z"
}

/* Beat 7: Gloves Equipped */
{
  "session_id": "c7a84e20-53ab-4412-b2fa-908cf4e81a33",
  "event_type": "ppe_item_equipped",
  "event_data": {
    "item": "gloves",
    "order_index": 3
  },
  "timestamp": "2026-08-21T10:03:58Z"
}

/* Beat 7: All PPE Complete */
{
  "session_id": "c7a84e20-53ab-4412-b2fa-908cf4e81a33",
  "event_type": "ppe_donning_completed",
  "event_data": {
    "total_time_seconds": 21.4
  },
  "timestamp": "2026-08-21T10:03:58Z"
}

/* Beat 9: Detector Tool Equipped */
{
  "session_id": "c7a84e20-53ab-4412-b2fa-908cf4e81a33",
  "event_type": "detector_equipped",
  "event_data": {},
  "timestamp": "2026-08-21T10:04:12Z"
}

```

```

```