# Chemical Spill Scenario — EXHAUSTIVE Scene-by-Scene Build Script
## SIH260088 — VR-Based CBRN Disaster Response Training (Chemical Module)

**Purpose of this document:** This is a maximally detailed, unambiguous build specification. It is written so that an AI assistant or a fresher developer can implement any scene without needing to ask clarifying questions. Every object, trigger, UI state, camera behavior, event, and transition is specified explicitly. This document supersedes the summarized version for implementation purposes — use that version for pitch/overview, use this one for actual building.

**How to read this doc:** Each Scene has: Purpose → Environment/Objects present → Exact object list with naming convention → Player capabilities in this scene → Every possible interaction with exact trigger conditions → Every UI element shown → Every event logged (with full payload schema) → Exit condition to next scene → Failure/edge-case handling.

---

## 0. Global Conventions (apply to every scene)

### 0.1 Naming convention for Unity objects
All interactable objects use the prefix `INT_`, all trigger zones use `ZONE_`, all UI canvases use `UI_`, all NPCs use `NPC_`, all managers/empty logic objects use `MGR_`. This lets any team member instantly recognize an object's role by its name alone.

### 0.2 Global GameObjects that exist for the entire scenario (not scene-specific)
| Object Name | Type | Purpose |
|---|---|---|
| `MGR_GameManager` | Empty GameObject + script | Tracks current stage, session_id, overall timer, holds references to all other managers |
| `MGR_EventLogger` | Empty GameObject + script | Single source responsible for POSTing every event to Supabase. All other scripts call `EventLogger.Log(eventType, payload)` — never POST directly from gameplay scripts |
| `MGR_ScoreTracker` | Empty GameObject + script | Optional local running-score display only (authoritative score is computed server-side by Spring Boot after scenario ends) |
| `UI_HUD_Root` | Canvas (Screen Space - Overlay) | Persistent HUD — houses stage prompt text, PPE checklist, detector reading, timer |
| `Player` | FPS Controller (from Unity Starter Assets) | Camera + capsule collider + movement script |
| `MGR_AudioManager` | Empty GameObject + script | Plays alarm sound, ambient factory hum, event-specific stings (e.g. "ding" on correct action, "buzz" on mistake) |

### 0.3 Global event payload schema
Every event sent to Supabase's `events` table follows this exact JSON shape:
```json
{
  "session_id": "<uuid, set once at scenario_started>",
  "event_type": "<string, e.g. ppe_item_equipped>",
  "event_data": { "...": "varies per event, detailed per scene below" },
  "timestamp": "<ISO 8601 UTC, e.g. 2026-08-21T10:03:15Z>"
}
```
`session_id` is generated client-side (Unity, using a GUID) the moment the scenario begins, and reused for every event in that playthrough.

### 0.4 Global input scheme
- **Move:** WASD
- **Look:** Mouse
- **Interact:** Left Click (when crosshair is over an object tagged `Interactable`) OR `E` key as a fallback/duplicate binding
- **Crosshair:** Small circle UI element at screen center; changes color (white → green) when hovering over any `Interactable`-tagged object within interaction range (2.5 Unity units)

### 0.5 Global HUD elements (always visible, contents change per scene)
| Element Name | Location | Content |
|---|---|---|
| `UI_StagePrompt` | Top-center | Current instruction text (e.g. "Assess the situation before proceeding") |
| `UI_PPEChecklist` | Top-left | Three icons (Mask/Suit/Gloves), greyed out until equipped, turn green + checkmark when equipped |
| `UI_DetectorReading` | Bottom-right | Only visible when detector is equipped; shows numeric ppm value + a needle gauge graphic |
| `UI_Timer` | Top-right | MM:SS counting up from scenario start |
| `UI_Crosshair` | Screen center | As described in 0.4 |
| `UI_MistakeToast` | Center, temporary popup | Red-tinted popup box, appears for 2.5 seconds on any mistake event, then fades out |

---

## SCENE 1 — Main Menu / Scenario Briefing

### Purpose
Establish context before gameplay begins. This is a UI-only scene (no 3D world yet, or a static background render of the facility).

### Objects present
| Object Name | Type | Description |
|---|---|---|
| `UI_MainMenuCanvas` | Canvas | Full-screen UI |
| `UI_TitleText` | Text (TMP) | "KIT SPOC / SIH260088 — CBRN Chemical Response Training" |
| `UI_BriefingPanel` | Panel | Contains the briefing paragraph |
| `UI_BriefingText` | Text (TMP) | Exact copy: *"Alert: Gas leak reported at Storage Bay 3. Suspected chemical agent release. Proceed with standard CBRN chemical response protocol."* |
| `UI_BeginButton` | Button | Label: "BEGIN SCENARIO" |
| `UI_TraineeNameInput` | Input Field (optional, if trainee ID entry is in scope) | Placeholder text: "Enter Trainee ID" |

### Player capabilities
None — this is a menu, no 3D movement. Only UI interaction (mouse click on button, optional text input).

### Interactions
**`UI_BeginButton` — OnClick:**
1. Validate `UI_TraineeNameInput` is non-empty (if trainee ID entry is included in scope). If empty, show inline red validation text "Trainee ID required" and do not proceed.
2. Generate a new GUID, store as `sessionId` in `MGR_GameManager` (persists for the rest of the playthrough).
3. Call `EventLogger.Log("scenario_started", { trainee_id: <entered id>, scenario_id: "chemical_spill_v1" })`.
4. Start the global timer (`MGR_GameManager.StartTime = Time.time`).
5. Load/activate Scene 2 (either a Unity scene load via `SceneManager.LoadScene("FacilityEntrance")`, or if using a single-scene setup, deactivate `UI_MainMenuCanvas` and activate the 3D world root object).

### UI shown
Only the menu itself. No HUD yet (HUD activates in Scene 2).

### Events logged in this scene
| Event Type | Trigger | Payload |
|---|---|---|
| `scenario_started` | Click `UI_BeginButton` | `{ trainee_id, scenario_id: "chemical_spill_v1" }` |

### Exit condition
Successful click of `UI_BeginButton` with valid input → transitions to Scene 2.

### Edge cases
- Double-click on Begin button: debounce with a boolean flag `hasStarted` set true on first click, ignore subsequent clicks, to avoid double-logging `scenario_started`.

---

## SCENE 2 — Facility Entrance (Stage 1: Initial Assessment)

### Purpose
Player spawns outside the hazard zone. Teaches "do not rush in without PPE" — the first protocol lesson.

### Environment/Objects present
| Object Name | Type | Description |
|---|---|---|
| `ZONE_SpawnPoint` | Empty Transform | Player spawn location, position `(0, 1, 0)` (ground-level reference; exact world coords set by Harshini during layout) |
| `ZONE_HazardZoneTrigger` | Box Collider (trigger, `IsTrigger = true`) | Invisible volume surrounding the drum/leak area, roughly `10x10` units, positioned around `ZONE_DrumCluster` (see Scene 4) |
| `ENV_WarningSignage` | Static Mesh (non-interactable) | Visual "Hazard / No Entry Without PPE" sign near the zone boundary |
| `ENV_GasVFX_Distant` | Particle System | A visible fog/gas puff in the distance (toward the drum cluster), signals "something is wrong over there" from spawn |
| `ENV_FactoryBuilding`, `ENV_PerimeterFence`, etc. | Static meshes | General scene dressing, non-interactable, Harshini's asset placement |

### Player capabilities
Full WASD movement + mouse look. No items equipped yet.

### Interactions
**Entering `ZONE_HazardZoneTrigger` (OnTriggerEnter) — Mistake path:**
1. Check `MGR_GameManager.IsPPEEquipped` (boolean, false by default).
2. If `false`:
   - Show `UI_MistakeToast` with text: *"⚠ Contamination Risk — PPE Required Before Entry"*
   - Play mistake audio sting (`MGR_AudioManager.PlayMistakeSound()`)
   - Call `EventLogger.Log("entered_hazard_zone_without_ppe", { player_position: <x,y,z> })`
   - **Soft-block, not hard-block:** player is NOT teleported back or frozen — this is a training lesson via penalty, not a wall. They can continue walking in, but the mistake is permanently logged.
3. If `true` (PPE already equipped — this trigger will also fire normally later in Stage 3, see Scene 4): no mistake logged, proceed normally.

**Note:** This trigger can fire multiple times if the player walks in and out repeatedly before equipping PPE. Each entry without PPE logs a new `entered_hazard_zone_without_ppe` event (design decision: repeated mistakes should be visible in the report, not deduplicated).

### UI shown
- `UI_StagePrompt` text: *"Assess the situation before proceeding. Do not enter the hazard zone without PPE."*
- Rest of persistent HUD as defined in 0.5 (PPE checklist all greyed out, timer running, detector reading hidden since no detector yet)

### Events logged in this scene
| Event Type | Trigger | Payload |
|---|---|---|
| `entered_hazard_zone_without_ppe` | Player enters `ZONE_HazardZoneTrigger` while `IsPPEEquipped == false` | `{ player_position: {x,y,z} }` |

### Exit condition
No hard exit trigger for this scene specifically — player naturally walks toward `ZONE_PPEStation` (Scene 3) at their own pace. Scene 2 and Scene 3 exist in the same continuous 3D space (not a scene-load transition, just a spatial progression) unless the team decides to split Unity scenes technically, in which case Scene 2 "ends" when the player enters `ZONE_PPEStationTrigger`.

### Edge cases
- Player tries to skip straight to the drums without ever approaching the PPE station: allowed, but they will keep triggering `entered_hazard_zone_without_ppe` on every entry attempt, and later stages (drum scanning, containment) remain accessible but PPE-related scoring stays at zero/penalty.

---

## SCENE 3 — PPE Station (Stage 2: PPE Donning)

### Purpose
Trainee equips protective gear. This is the first "hard gate" — later interactions should ideally require this, though per the design doc it's a soft block via HUD warning, not a physical wall.

### Environment/Objects present
| Object Name | Type | Description |
|---|---|---|
| `ZONE_PPEStationTrigger` | Box Collider (trigger) | Proximity trigger around the PPE station table/locker, radius ~3 units |
| `ENV_PPEStationTable` | Static Mesh | Visual locker/table object |
| `INT_PPE_GasMask` | Interactable Mesh + Collider, tag `Interactable` | Clickable gas mask model on the table |
| `INT_PPE_HazmatSuit` | Interactable Mesh + Collider, tag `Interactable` | Clickable suit model |
| `INT_PPE_Gloves` | Interactable Mesh + Collider, tag `Interactable` | Clickable gloves model |

### Player capabilities
Full movement. Crosshair turns green when looking at any `INT_PPE_*` object within 2.5 units.

### Interactions
**Click `INT_PPE_GasMask`:**
1. Check `MGR_GameManager.MaskEquipped` — if already true, ignore click (idempotent, prevent duplicate event logging).
2. Set `MaskEquipped = true`.
3. Play equip animation/sound (simple scale-pop or attach-to-camera visual is enough for prototype — full first-person arm animation is a stretch goal, not required).
4. Update `UI_PPEChecklist` — Mask icon turns green + checkmark.
5. Call `EventLogger.Log("ppe_item_equipped", { item: "mask", order_index: <1,2,or 3 based on click order>, timestamp })`.
6. Disable/hide `INT_PPE_GasMask` from the table (it's now "worn").

**Click `INT_PPE_HazmatSuit`:** identical pattern, `item: "suit"`.
**Click `INT_PPE_Gloves`:** identical pattern, `item: "gloves"`.

**`order_index` field:** track a simple incrementing counter (`MGR_GameManager.PpeEquipOrderCounter`, starts at 1) that increments with each of the 3 items regardless of which is clicked first — this lets Spring Boot later evaluate whether the "ideal order" (suit → mask → gloves) bonus applies, without Unity needing to know or enforce the correct order itself.

**All 3 items equipped (check after every equip click):**
1. If `MaskEquipped && SuitEquipped && GlovesEquipped`:
   - Set `MGR_GameManager.IsPPEEquipped = true`
   - Call `EventLogger.Log("ppe_donning_completed", { total_time_seconds: <time since first PPE item equipped> })`
   - Update `UI_StagePrompt` to: *"PPE equipped. Proceed to the hazard zone and use your detector to locate the leak."*
   - Play a positive confirmation sound/sting.

**Attempting to proceed to hazard zone with incomplete PPE (re-entering `ZONE_HazardZoneTrigger` from Scene 2 logic):** already handled by Scene 2's trigger logic — no separate hard block needed; the HUD warning + penalty IS the block mechanism per design.

### UI shown
- `UI_StagePrompt`: *"Equip your PPE: Gas Mask, Hazmat Suit, and Gloves."* (updates to the "proceed" message once complete, as above)
- `UI_PPEChecklist`: live-updates as each item is clicked

### Events logged in this scene
| Event Type | Trigger | Payload |
|---|---|---|
| `ppe_item_equipped` | Click any `INT_PPE_*` object (fires once per item, 3 times total) | `{ item: "mask"/"suit"/"gloves", order_index: <int> }` |
| `ppe_donning_completed` | All 3 items equipped | `{ total_time_seconds: <float> }` |

### Exit condition
All 3 PPE items equipped → `UI_StagePrompt` updates, player is free to walk toward the hazard zone (Scene 4).

### Edge cases
- Player clicks the same PPE item twice rapidly: guarded by the `MaskEquipped`/`SuitEquipped`/`GlovesEquipped` boolean checks in step 1 of each interaction — second click is a no-op.
- Player equips PPE, then somehow "un-equips" (not in scope for prototype — no un-equip mechanic exists; once worn, always worn for the rest of the session).

---

## SCENE 4 — Hazard Zone: Detection (Stage 3)

### Purpose
Core "detective" mechanic — find the leaking drum using a handheld detector tool.

### Environment/Objects present
| Object Name | Type | Description |
|---|---|---|
| `ZONE_DrumCluster` | Empty Transform (parent) | Groups all drum objects together spatially |
| `INT_Drum_01`, `INT_Drum_02`, `INT_Drum_03`, `INT_Drum_04` | Interactable Mesh + Collider, tag `Interactable` | 3–4 drum objects; exactly ONE is designated the leak source via a boolean field `IsLeakSource` set in the Inspector per playthrough/build (for prototype, hardcode `INT_Drum_02` as the leak source) |
| `ENV_GasVFX_Leak` | Particle System, child of the leak-source drum only | Visible gas cloud, only active on the true leak source |
| `INT_GasDetector` | Interactable Mesh + Collider, tag `Interactable`, OR auto-equipped when entering this zone | Handheld detector tool |
| `UI_DetectorGaugeCanvas` | World-space or screen-space UI | Needle gauge / numeric ppm readout |

### Player capabilities
Full movement, PPE equipped (ideally — soft-enforced only). Can pick up/equip the detector.

### Interactions

**Pick up `INT_GasDetector` (click):**
1. Set `MGR_GameManager.DetectorEquipped = true`.
2. Show `UI_DetectorReading` HUD element (previously hidden).
3. Call `EventLogger.Log("detector_equipped", {})`.
4. Detector becomes "attached" to player view (simple UI overlay is sufficient — no need for a 3D held-object model for prototype, though it's a nice-to-have).

**Aiming detector near a drum (continuous, while `DetectorEquipped == true`):**
1. Every frame (or throttled to every 0.2s for performance), calculate distance from `Player` to each `INT_Drum_*`.
2. For the closest drum within range (e.g. 5 units), compute a simulated ppm reading:
   - If that drum `IsLeakSource == true`: reading scales inversely with distance, e.g. `reading = Mathf.Clamp(200 - (distance * 20), 20, 200)` — gets higher as player gets closer, capping at 200 ppm at point-blank range.
   - If that drum `IsLeakSource == false`: reading stays low/flat, e.g. random noise between 5–15 ppm regardless of distance (background reading).
3. Update `UI_DetectorGaugeCanvas` needle/number live with this calculated value.

**Click on a drum while detector is equipped (the "flag as source" action):**
1. Call `EventLogger.Log("drum_scanned", { drum_id: "<INT_Drum_XX>", reading_value: <current ppm at click moment>, is_correct: <IsLeakSource bool> })`.
2. If `IsLeakSource == true`:
   - Set `MGR_GameManager.LeakSourceIdentified = true` and store `MGR_GameManager.IdentifiedDrumId = "INT_Drum_02"`.
   - Call `EventLogger.Log("leak_source_identified", { correct: true, drum_id: "INT_Drum_02" })`.
   - Show positive HUD feedback: *"✅ Leak source confirmed: Drum 02."*
   - Update `UI_StagePrompt`: *"Leak source identified. Proceed to evacuate civilians, then return to contain the leak."*
3. If `IsLeakSource == false`:
   - Call `EventLogger.Log("leak_source_identified", { correct: false, drum_id: "<clicked drum id>" })`.
   - Show `UI_MistakeToast`: *"❌ Incorrect — re-scan and confirm the source."*
   - Play mistake sound.
   - **No hard block — player can keep scanning other drums.** `LeakSourceIdentified` remains false until the correct drum is clicked.

### UI shown
- `UI_StagePrompt`: *"Use your detector to locate the leaking drum."*
- `UI_DetectorReading`: live ppm value + needle graphic, only visible once detector is equipped
- `UI_MistakeToast`: on wrong drum click

### Events logged in this scene
| Event Type | Trigger | Payload |
|---|---|---|
| `detector_equipped` | Pick up `INT_GasDetector` | `{}` |
| `drum_scanned` | Click any `INT_Drum_*` while detector equipped | `{ drum_id, reading_value, is_correct }` |
| `leak_source_identified` | Click the correct drum (can also log `correct: false` attempts per above) | `{ correct: bool, drum_id }` |

### Exit condition
`LeakSourceIdentified == true` — player is free to proceed to Scene 5 (evacuation) or Scene 6 (containment); design allows evacuation and containment in either order, though the narrative suggests evacuation first (civilians are closer to immediate danger).

### Edge cases
- Player clicks a drum WITHOUT the detector equipped: interaction should be disabled/ignored entirely (no event fires) — detector must be equipped first. Enforce via a guard clause: `if (!DetectorEquipped) return;` at the top of the drum click handler.
- Player re-clicks the already-identified correct drum again: guard with `if (LeakSourceIdentified) return;` to avoid duplicate `leak_source_identified: true` events.

---

## SCENE 5 — Civilian Evacuation (Stage 4)

### Purpose
Trainee locates and leads civilian NPCs to safety.

### Environment/Objects present
| Object Name | Type | Description |
|---|---|---|
| `NPC_Civilian_01`, `NPC_Civilian_02`, `NPC_Civilian_03` | Character model + simple AI script, tag `Interactable` | Idle "distressed" animation/pose by default |
| `ZONE_SafeZoneTrigger` | Box Collider (trigger) | Marks the safe zone area, visually distinct (e.g. green ground decal) |
| `ENV_SafeZoneMarker` | Static Mesh / Decal | Visual flag or marker for the safe zone |

### Player capabilities
Full movement. Can interact with civilians by clicking/approaching within range (2.5 units).

### Interactions

**Click/approach `NPC_Civilian_XX` (first contact):**
1. Check `NPC_Civilian_XX.IsContacted` — if true, ignore (idempotent).
2. Set `IsContacted = true`.
3. Show a simple speech-bubble UI or floating text above the NPC: *"This way — follow me to the safe zone!"* (displayed for ~2 seconds, or persistent until evacuated).
4. Call `EventLogger.Log("civilian_contacted", { civilian_id: "NPC_Civilian_01" })`.
5. Set NPC's simple AI state to `Following` — NPC now moves toward `Player.transform.position` continuously, maintaining a small following distance (e.g. 2 units behind), using a basic `Vector3.MoveTowards` or `NavMeshAgent` if available (NavMesh is a stretch goal; direct MoveTowards is acceptable for prototype).

**NPC enters `ZONE_SafeZoneTrigger` while `IsFollowing == true`:**
1. Set `NPC_Civilian_XX.IsEvacuated = true`, `IsFollowing = false` (NPC stops moving, plays idle-safe animation or simply stays put).
2. Call `EventLogger.Log("civilian_evacuated", { civilian_id: "NPC_Civilian_01" })`.
3. Update a running HUD counter (optional): *"Civilians evacuated: 1/3"*.

**Checking evacuation completeness (triggered when player attempts to proceed to containment, i.e. approaches `ZONE_DrumCluster` again after having identified the leak source):**
1. Count how many `NPC_Civilian_*` have `IsEvacuated == true` out of total spawned (3 for full scope, or 1 for MVP-reduced scope per Section 5 of the original doc).
2. If count < total:
   - Call `EventLogger.Log("evacuation_incomplete", { evacuated_count: <n>, total_count: <total>, left_behind_ids: [...] })`.
   - Show `UI_MistakeToast`: *"⚠ Not all civilians were evacuated."*
   - **Soft block only** — does not prevent proceeding to containment, this is a scoring penalty captured for the final report, matching the "no hard gate" pattern used elsewhere.

### UI shown
- `UI_StagePrompt`: *"Evacuate all civilians to the safe zone."*
- Optional: `UI_CivilianCounter` — "Civilians evacuated: X/3"

### Events logged in this scene
| Event Type | Trigger | Payload |
|---|---|---|
| `civilian_contacted` | First click on an NPC | `{ civilian_id }` |
| `civilian_evacuated` | NPC enters safe zone while following | `{ civilian_id }` |
| `evacuation_incomplete` | Player proceeds to containment with civilians still not evacuated | `{ evacuated_count, total_count, left_behind_ids }` |

### Exit condition
Not a hard gate — player can proceed to Scene 6 (Containment) regardless of evacuation completeness, with the `evacuation_incomplete` event capturing any shortfall for scoring purposes.

### Edge cases
- NPC gets stuck on scenery while following (pathing failure): for prototype scope, keep the following path simple/direct (no obstacles between civilian spawn and safe zone) to avoid needing full NavMesh pathfinding.
- Player leads a civilian partway then abandons them to go elsewhere: `IsFollowing` remains true, NPC keeps trying to follow — acceptable behavior, will simply resolve if the player returns later, or remain uncounted if scenario ends first (captured naturally by the `evacuation_incomplete` check).

---

## SCENE 6 — Containment (Stage 5)

### Purpose
Trainee physically resolves the hazard by sealing the identified drum.

### Environment/Objects present
| Object Name | Type | Description |
|---|---|---|
| `INT_ContainmentKit` | Interactable Mesh + Collider, tag `Interactable` | Sealant/patch tool, placed near the hazard zone entrance or PPE station |
| (Reuses `INT_Drum_01`–`04` from Scene 4) | — | The containment action targets the drum already flagged in Scene 4 |

### Player capabilities
Full movement. Can pick up containment kit, then click the identified drum.

### Interactions

**Pick up `INT_ContainmentKit` (click):**
1. Set `MGR_GameManager.ContainmentKitEquipped = true`.
2. Simple visual: kit "attaches" to player view/hand (UI icon overlay is sufficient for prototype).

**Click the identified leak-source drum (`INT_Drum_02` per hardcoded example) while `ContainmentKitEquipped == true`:**
1. Guard: `if (!MGR_GameManager.LeakSourceIdentified) { show blocked message; return; }`
   - If leak source was never identified in Scene 4 (edge case — player skipped ahead): show `UI_StagePrompt` override: *"Confirm leak source before containment."* Do not proceed. No event logged for this blocked attempt (or optionally log a `containment_blocked_no_source` event for completeness).
2. If guard passes: Call `EventLogger.Log("containment_started", { drum_id: "INT_Drum_02" })`.
3. Trigger a progress-bar UI (`UI_ContainmentProgress`) that fills over 5–10 seconds (exact duration configurable, suggest 6 seconds for demo pacing) — player must remain within interaction range for the full duration (simplest implementation: a `Coroutine` that ticks the bar and cancels/resets if the player walks away or clicks elsewhere mid-action).
4. On progress bar completion:
   - Stop `ENV_GasVFX_Leak` particle system on the drum (visual payoff — leak visibly stops).
   - Call `EventLogger.Log("containment_completed", { drum_id: "INT_Drum_02", duration_seconds: <actual time taken> })`.
   - Update `UI_StagePrompt`: *"Leak contained. Proceed to the decontamination station."*
   - Set `MGR_GameManager.ContainmentComplete = true`.

### UI shown
- `UI_StagePrompt`: *"Equip the containment kit and seal the leaking drum."*
- `UI_ContainmentProgress`: fill bar, visible only during the 5–10 second hold action

### Events logged in this scene
| Event Type | Trigger | Payload |
|---|---|---|
| `containment_started` | Click identified drum with kit equipped (guard passes) | `{ drum_id }` |
| `containment_completed` | Progress bar reaches 100% | `{ drum_id, duration_seconds }` |

### Exit condition
`ContainmentComplete == true` → player proceeds to Scene 7 (Decontamination).

### Edge cases
- Player interrupts the containment hold (walks away mid-progress): reset progress bar to 0, do NOT log `containment_completed`, allow retry from scratch. No penalty for this — just no event logged.
- Player attempts containment on a wrong drum with kit equipped: since only the correctly-identified drum accepts the containment click (guarded by checking the clicked drum's ID against `MGR_GameManager.IdentifiedDrumId`), clicking any other drum should either be a no-op or show a small hint text: *"This is not the confirmed leak source."* (no penalty event needed here, since the real mistake was already captured back in Scene 4's `drum_scanned` mismatches).

---

## SCENE 7 — Decontamination (Stage 6)

### Purpose
Final protocol step before scenario conclusion — cleanse trainee of any residual contamination.

### Environment/Objects present
| Object Name | Type | Description |
|---|---|---|
| `ZONE_DecontaminationTrigger` | Box Collider (trigger) | Archway or marked floor area |
| `ENV_DecontArchway` | Static Mesh | Visual archway structure |
| `ENV_DecontVFX` | Particle System | Spray/mist visual, triggered on entry |

### Player capabilities
Full movement, walks through the zone (no click interaction needed — this is a walk-through trigger).

### Interactions

**Player enters `ZONE_DecontaminationTrigger` (OnTriggerEnter):**
1. Check `MGR_GameManager.DecontaminationComplete` — if already true, ignore (idempotent, in case player walks through twice).
2. Set `DecontaminationComplete = true`.
3. Play `ENV_DecontVFX` particle burst for ~3 seconds.
4. Play a "cleanse" sound effect.
5. Call `EventLogger.Log("decontamination_completed", {})`.
6. Update `UI_StagePrompt`: *"Decontamination complete. Return to base to conclude the scenario."* (or auto-proceed directly to Scene 8 if no further player action is needed — recommended for simplicity: auto-proceed).

### UI shown
- `UI_StagePrompt`: *"Proceed through the decontamination station."*

### Events logged in this scene
| Event Type | Trigger | Payload |
|---|---|---|
| `decontamination_completed` | Enter `ZONE_DecontaminationTrigger` | `{}` |

### Exit condition
`DecontaminationComplete == true` → auto-transition to Scene 8 (or require one final "End Scenario" button click, team's choice — auto-transition recommended for demo smoothness).

### Edge cases
- Player never walks through decon and manually ends the scenario some other way (e.g. an "End Scenario" debug button, if one exists for testing): this should still be possible — the omission is captured as a scoring penalty (`decontamination_completed` simply never fires), not a hard block, per the original design's "soft penalty, not hard block" rule for this stage.

---

## SCENE 8 — Scenario Complete / Report Generation

### Purpose
Conclude the playthrough, hand off to backend for scoring, show a "generating report" holding screen.

### Environment/Objects present
| Object Name | Type | Description |
|---|---|---|
| `UI_CompletionCanvas` | Canvas | Full-screen overlay |
| `UI_CompletionText` | Text (TMP) | "Scenario Complete — Generating Report..." |
| `UI_LoadingSpinner` | Simple animated UI element | Visual "please wait" indicator while Spring Boot computes score |
| `UI_ScoreResultPanel` | Panel (appears after score is fetched) | Displays final score, pass/fail, and a mistake summary |

### Player capabilities
None — this is a results/summary screen, no 3D movement.

### Interactions

**On scene entry (automatic, no click needed):**
1. Calculate `total_time_seconds = Time.time - MGR_GameManager.StartTime`.
2. Call `EventLogger.Log("scenario_completed", { total_time_seconds })`.
3. Show `UI_CompletionText` + `UI_LoadingSpinner`.
4. Make an HTTP GET (or POST, depending on Spring Boot's endpoint design) request to the Spring Boot scoring endpoint, e.g. `GET /api/sessions/{session_id}/score` — this triggers Spring Boot to read all events for this `session_id` from Supabase and compute the score per the point table (Section 3 of the summary doc).
5. On response received:
   - Hide `UI_LoadingSpinner`.
   - Show `UI_ScoreResultPanel` populated with: final score (0–100), pass/fail label, and a short list of any mistake-flagged events pulled from the response (e.g. "Entered hazard zone without PPE — 1 occurrence", "1 civilian left behind").
6. If the HTTP request fails/times out (network issue during a live demo): show a graceful fallback message: *"Report generation delayed — session data saved, check the instructor dashboard shortly."* — **never let a failed network call crash or freeze the demo.**

### UI shown
- `UI_CompletionText`, `UI_LoadingSpinner` → then replaced by `UI_ScoreResultPanel`

### Events logged in this scene
| Event Type | Trigger | Payload |
|---|---|---|
| `scenario_completed` | Scene entry (automatic) | `{ total_time_seconds }` |

### Exit condition
This is the terminal scene — optionally offer a "Return to Menu" button to loop back to Scene 1 for the next trainee.

### Edge cases
- Spring Boot scoring endpoint is slow/unreachable during a live judge demo: **always have the backup recorded video** (per the risk notes in the main project doc) in case this exact failure happens live.

---

## 3. Cross-Scene State Reference (single source of truth for `MGR_GameManager` fields)

This table lists every persistent boolean/value tracked across the whole playthrough, so Unity devs know exactly what state exists and where it's read/written.

| Field | Type | Set in Scene | Read in Scene |
|---|---|---|---|
| `SessionId` | string (GUID) | 1 | All (attached to every event) |
| `StartTime` | float | 1 | 8 (to compute total time) |
| `MaskEquipped`, `SuitEquipped`, `GlovesEquipped` | bool | 3 | 3 (to compute `IsPPEEquipped`) |
| `IsPPEEquipped` | bool | 3 | 2 (mistake check), 4 (soft gate for detector use, optional) |
| `PpeEquipOrderCounter` | int | 3 | — (sent in event payload only, order bonus computed server-side) |
| `DetectorEquipped` | bool | 4 | 4 |
| `LeakSourceIdentified` | bool | 4 | 4 (guard), 6 (guard) |
| `IdentifiedDrumId` | string | 4 | 6 (guard) |
| `ContainmentKitEquipped` | bool | 6 | 6 |
| `ContainmentComplete` | bool | 6 | 7 (not strictly required but logically follows) |
| `DecontaminationComplete` | bool | 7 | 8 (optional, for local pre-check before final event) |

---

## 4. Full Event Type Reference (all events in one place, for backend/dashboard devs)

| # | event_type | Fired From Scene | payload fields |
|---|---|---|---|
| 1 | `scenario_started` | 1 | `trainee_id`, `scenario_id` |
| 2 | `entered_hazard_zone_without_ppe` | 2 | `player_position` |
| 3 | `ppe_item_equipped` | 3 | `item`, `order_index` |
| 4 | `ppe_donning_completed` | 3 | `total_time_seconds` |
| 5 | `detector_equipped` | 4 | `{}` |
| 6 | `drum_scanned` | 4 | `drum_id`, `reading_value`, `is_correct` |
| 7 | `leak_source_identified` | 4 | `correct`, `drum_id` |
| 8 | `civilian_contacted` | 5 | `civilian_id` |
| 9 | `civilian_evacuated` | 5 | `civilian_id` |
| 10 | `evacuation_incomplete` | 5 | `evacuated_count`, `total_count`, `left_behind_ids` |
| 11 | `containment_started` | 6 | `drum_id` |
| 12 | `containment_completed` | 6 | `drum_id`, `duration_seconds` |
| 13 | `decontamination_completed` | 7 | `{}` |
| 14 | `scenario_completed` | 8 | `total_time_seconds` |

This is the complete, exhaustive list — Spring Boot's scoring function should switch/case over exactly these 14 event types and nothing else for prototype scope.

---

## 5. Scoring Rules (unchanged from summary doc, restated here for completeness)

| Criteria | Points / Penalty | Derived from event(s) |
|---|---|---|
| PPE fully donned before hazard zone entry | +10 | `ppe_donning_completed` occurs before first `entered_hazard_zone_without_ppe`, OR no `entered_hazard_zone_without_ppe` at all |
| Entered hazard zone without PPE | −15 per occurrence | count of `entered_hazard_zone_without_ppe` |
| Correct leak source on first scan | +10 | first `drum_scanned` for the true leak source has `is_correct: true` |
| Incorrect drum flagged before correct one | −5 per wrong flag | count of `drum_scanned` with `is_correct: false` before the correct one |
| All civilians evacuated | +15 | `civilian_evacuated` count == total spawned, no `evacuation_incomplete` |
| Each civilian left behind | −10 per civilian | `left_behind_ids` length in `evacuation_incomplete` |
| Containment completed | +15 | presence of `containment_completed` |
| Decontamination completed | +10 | presence of `decontamination_completed` |
| Decontamination skipped | −10 | absence of `decontamination_completed` by the time `scenario_completed` fires |
| Time bonus | up to +20, scaled | `total_time_seconds` from `scenario_completed`, scaled against a target benchmark time (suggest: full points under 5 minutes, tapering to 0 bonus at 10+ minutes) |

**Final score:** sum, normalized/clamped to 0–100.
**Pass/Fail threshold:** ≥70 = Pass, <70 = Needs Retraining.

---

## 6. Data Schema (unchanged, restated for completeness)

**`sessions` table:** `session_id` (PK), `trainee_id`, `scenario_id`, `started_at`, `completed_at`, `final_score`, `pass_status`

**`events` table:** `event_id` (PK), `session_id` (FK), `event_type`, `event_data` (JSON), `timestamp`

**`trainees` table:** `trainee_id` (PK), `name`, `batch`/`unit`

---

## 7. Minimum Viable Scope (unchanged — restated for completeness)

If behind schedule by Day 4, cut from the bottom up:
1. ✅ PPE donning — keep
2. ✅ Detector + leak identification — keep
3. ✅ Containment — keep
4. ⚠️ Civilian evacuation — reduce to 1 civilian instead of 3
5. ⚠️ Decontamination — simplify to walk-through trigger only, skip VFX polish
6. ❌ Scoring nuance (PPE order bonus, time bonus curve) — default to flat pass/fail if needed

---

## 8. Per-Role Build Notes (Scene-Mapped)

- **Chandana M N (Unity Interaction):** Build Scenes 3 through 7's interaction scripts in this order — Scene 3 (PPE) first since it's the simplest click-to-equip pattern, then Scene 4 (Detector) which reuses that pattern plus adds proximity-based reading logic, then Scene 6 (Containment) which reuses the "equip tool + click target" pattern from Scene 3/4, then Scene 5 (Civilians) which is the most complex due to NPC following logic, then Scene 7 (Decon) which is the simplest (pure trigger volume, no clicking).
- **Harshini (Environment):** Build spatial layout in this order — Scene 2 (entrance + hazard zone boundary) → Scene 3 (PPE station placement) → Scene 4 (drum cluster, 3-4 drums with one VFX-marked) → Scene 5 (civilian spawn points + safe zone) → Scene 6 (containment kit placement, reuses drum cluster) → Scene 7 (decon archway). A single top-down sketch covering all of these before building saves rework.
- **Lohith/Monica (Backend):** Section 4 (event reference table) is your complete list of `event_type` values to handle — build the Spring Boot scoring function as a switch/case or lookup-table over these 14 types, matching Section 5's point rules exactly.
- **Chandana M P (Dashboard):** Section 4's event list is also what you'll display in a session's mistake breakdown — filter `events` where `event_type` is one of: `entered_hazard_zone_without_ppe`, `drum_scanned` (is_correct: false), `evacuation_incomplete`, to build the "mistakes made" list per trainee.
- **Pavitra (Docs/Testing):** Use Scenes 1–8 above as your exact test script — for each scene, walk through every interaction listed and confirm the exact event fires with the exact payload shape described. This document's Section 4 event reference table doubles as your master checklist (14 events to verify).

---

*This is the authoritative, implementation-level scene-by-scene script for the Chemical Spill module. The earlier summarized version (`Chemical_Spill_Scenario_Script.md`) remains valid for pitch/overview purposes; this document is the source of truth for actual development. Any flow changes should be updated here first.*
