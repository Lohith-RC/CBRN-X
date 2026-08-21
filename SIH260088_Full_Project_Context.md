# SIH260088 — VR-Based CBRN Disaster Response Training Platform

**Full project context document — share this with any team member's Claude (or any AI) to get complete context on the project and continue work seamlessly.**

---

## 1. Problem Statement

- **ID:** SIH260088
- **Category:** Disaster Management, Software
- **Title:** Virtual Reality-Based Training for CBRN Disaster Response
- **Organization:** Ministry of Home Affairs (India)

**Official description:**
A virtual reality-based training system for CBRN (Chemical, Biological, Radiological, and Nuclear) disaster response, intended for NDRF (National Disaster Response Force) personnel. Currently there is no dedicated system to train NDRF for CBRN emergencies. VR training would immerse trainees in realistic emergency scenarios, letting them practice rescue techniques, handle hazardous material simulations, and build response skills — all without real-world risk. Goal: improve NDRF's preparedness, skill retention, and confidence for CBRN emergencies, ultimately helping save lives and minimize damage.

**What CBRN means:**
- **C – Chemical:** toxic industrial chemicals or chemical warfare agents (e.g. chlorine gas, nerve agents)
- **B – Biological:** pathogens/toxins causing disease outbreaks, natural or deliberate
- **R – Radiological:** dispersal of radioactive material (e.g. "dirty bomb") without a nuclear explosion
- **N – Nuclear:** nuclear weapon detonation or reactor accident (e.g. Chernobyl, Fukushima)

These are grouped together because responders use a similar operational workflow across all four: **detect → protect → contain → decontaminate → evacuate**, even though the underlying science differs. This shared workflow is why one VR platform can reasonably cover all four hazard types.

---

## 2. Team & Roles

Team of 6 students, all freshers, no prior experience with this domain or VR/game development. Building a prototype in **one week**.

| Member | Final Role |
|---|---|
| **Lohith R C** | Team Lead + Backend (Supabase schema design + Spring Boot core connection) |
| **Monica K S** | Backend (Spring Boot scoring/validation endpoints, paired with Lohith) |
| **Chandana M N** | VR/3D Interaction (Unity scripting — what happens on click/interact) |
| **Harshini R B** | Environment Design (Unity — placing 3D assets, lighting, scene layout) |
| **Chandana M P** | Dashboard (React frontend showing trainee scores/data) |
| **Pavitra J H** | UI/UX + Documentation + Testing |

**Note on role evolution:** The team's original self-assigned roles had overlaps (two people both doing "backend/dashboard," two people both doing "frontend/VR"). Roles above are the cleaned-up version — Backend pair (Lohith + Monica), Unity pair (Chandana M N + Harshini), Dashboard (Chandana M P), Docs/UX/Testing (Pavitra).

---

## 3. Key Decision: No VR Headset — Desktop-Simulated VR

**Constraint:** Student team, no budget for VR headsets (Quest/Vive etc.)

**Decision:** Build the same first-person 3D interactive experience in Unity, but run it as a **desktop app** (mouse-look instead of head tracking, click instead of hand-tracked grab) rather than deploying to an actual headset.

**Why this is acceptable for SIH judging:**
- Very common constraint for student teams — not penalized if framed correctly
- Architecture stays VR-ready: same Unity + XR Interaction Toolkit approach, so it could be deployed to a real headset later with minimal rework
- Pitch framing to use: *"Built VR-ready using Unity + XR Toolkit architecture; demoed via desktop simulation mode due to hardware constraints — deployable to Quest/Vive with existing codebase, no rearchitecture needed."*

---

## 4. Scope Decision: One Scenario Only — Chemical Spill

With 4 CBRN hazard types possible, the team is building **only the Chemical hazard module** for the prototype, not all four.

**Why Chemical was chosen over Biological/Radiological/Nuclear:**

| Scenario | Asset availability | Complexity | Visual impact |
|---|---|---|---|
| **Chemical (chosen)** | High — industrial/factory asset packs common | Low-medium — gas leak, PPE, evacuation logic is straightforward | Good — gas/fog VFX reads well on camera |
| Biological | Medium | High — quarantine/spread modeling hard to fake convincingly | Weak — hard to visualize "infection" |
| Radiological | Medium-low | Medium | Good, but assets rarer |
| Nuclear | Low | Very high — unrealistic scale for one week | Hard to pull off, looks generic |

**Pitch framing for scope:** *"Prototype demonstrates the Chemical hazard module of a multi-hazard CBRN VR training platform — architecture designed to extend to Biological, Radiological, and Nuclear modules post-prototype."*

---

## 5. Detailed Chemical Spill Scenario (Full Trainee Flow)

This is the single source of truth for what the trainee experiences and what gets logged/scored. (Full version exists as a separate file: `Chemical_Spill_Scenario_Script.md` — summarized here.)

**Setting:** Industrial chemical storage facility. A drum is leaking toxic gas ("Chemical Agent X" — generic industrial framing). Trainee plays an NDRF responder arriving after an alarm.

**Stage 0 — Briefing:** On-screen alert text, timer starts. Event: `scenario_started`

**Stage 1 — Initial Assessment:** Trainee must not enter hazard zone without PPE. Mistake if they do → `entered_hazard_zone_without_ppe` flag + penalty.

**Stage 2 — PPE Donning:** Click PPE station → equip mask, suit, gloves sequentially (HUD checklist). Events: `ppe_item_equipped` (x3), `ppe_donning_completed`. Blocked from proceeding if incomplete.

**Stage 3 — Enter Hazard Zone + Detection:** Pick up gas detector, aim at drums (3–4 present, 1 leaking with VFX + highest reading). Click correct drum to flag it. Events: `detector_equipped`, `drum_scanned` (per drum), `leak_source_identified` (correct: true/false). Wrong flags = penalty, retry allowed.

**Stage 4 — Civilian Evacuation:** 2–3 NPC civilians near hazard zone. Click/approach to trigger follow behavior, lead them to Safe Zone marker. Events: `civilian_contacted`, `civilian_evacuated` (per civilian), `evacuation_incomplete` if any left behind (penalty + "casualty" flag).

**Stage 5 — Containment:** Return to identified drum with containment kit, click to apply (progress bar/animation). Blocked if wrong/unidentified drum. Events: `containment_started`, `containment_completed`.

**Stage 6 — Decontamination:** Walk through decon station/archway (auto-triggered spray VFX). Event: `decontamination_completed`. Skipping is a soft penalty, not a hard block.

**Stage 7 — Scenario Complete:** HUD shows "Generating Report." Event: `scenario_completed` (total time). Triggers Spring Boot score calculation.

### Scoring Rules
| Criteria | Points |
|---|---|
| PPE fully donned before hazard zone entry | +10 |
| Entered hazard zone without PPE | −15 per occurrence |
| Correct leak source on first scan | +10 |
| Wrong drum flagged | −5 per wrong flag |
| All civilians evacuated | +15 |
| Civilian left behind | −10 per civilian |
| Containment completed | +15 |
| Decontamination completed | +10 |
| Decontamination skipped | −10 |
| Time bonus | up to +20 (scaled) |

Final score normalized to 0–100. Suggested pass threshold: ≥70 = Pass.

### Data Schema (Supabase tables)
- **`sessions`**: session_id (PK), trainee_id, scenario_id, started_at, completed_at, final_score, pass_status
- **`events`**: event_id (PK), session_id (FK), event_type, event_data (JSON), timestamp
- **`trainees`**: trainee_id (PK), name, batch/unit

### Minimum Viable Scope (if behind schedule)
Priority order to cut from bottom if needed: 1) PPE donning (keep), 2) Detector/leak ID (keep), 3) Containment (keep), 4) Civilian evacuation (can reduce to 1 civilian), 5) Decontamination (can simplify to walk-through only), 6) Scoring nuance (can default to flat pass/fail).

---

## 6. Tech Stack (Final)

| Layer | Choice | Why |
|---|---|---|
| **VR/3D Engine** | Unity + XR Interaction Toolkit | Best asset ecosystem, C# is beginner-friendly, most tutorials available |
| **VR SDK** | OpenXR (headset-agnostic) | Not required for desktop-sim prototype, but keeps architecture VR-ready |
| **Backend (hybrid)** | Supabase (Postgres + auto-API) for raw event logging and simple reads; Spring Boot (Java) on top for computed logic — scoring, pass/fail validation, mistake analysis | Fast for a week timeline (Supabase handles simple CRUD with zero boilerplate) while keeping custom scoring logic structured in Spring Boot, where Lohith has prior experience from SkillPassport AI |
| **Dashboard** | React + Chart.js/Recharts | Instructor-facing performance view — visual "impact" layer for judges |
| **3D Assets** | Unity Asset Store (free industrial/hazmat packs) + Blender if needed | Saves dev time vs. modeling from scratch |
| **Alerts/Voice (optional)** | Unity built-in TTS or pre-recorded audio cues | Easier than real-time TTS under time pressure |

**Rejected/deprioritized:** Unreal Engine (too steep for freshers in a week), FastAPI (swapped for Spring Boot per Lohith's preference/experience), real VR headset deployment (no budget, deferred to roadmap).

### Backend Architecture Detail — Supabase + Spring Boot Hybrid
- **Supabase** handles: raw event logging (Unity POSTs events directly to Supabase's REST API), simple reads for dashboard, trainee/session storage — no custom backend code needed
- **Spring Boot** handles: computed logic — final score calculation, pass/fail validation, mistake analysis. Connects to Supabase's underlying Postgres via JDBC.
- **Data flow:** Unity → POSTs simple events directly to Supabase. Unity/Dashboard → for computed results, calls Spring Boot, which reads/writes the same Supabase Postgres DB. React Dashboard → reads simple tables directly via Supabase JS client; calls Spring Boot for computed/aggregated data.
- **Simplicity rule:** raw logging → Supabase directly; anything computed → Spring Boot. Default to Supabase-direct when in doubt.

---

## 7. One-Week Build Plan

**Day 1 (Learning Day)** — Entire team learns fundamentals from scratch (see Section 8 for detailed breakdown)

**Day 2–3 — Core build**
- Harshini: environment (industrial site, free asset packs)
- Chandana M N: first-person controller + interaction scripts
- Lohith + Monica: Supabase tables + Spring Boot scoring API
- Chandana M P: dashboard skeleton (parallel, doesn't block on Unity — can build against dummy Supabase rows)
- Pavitra: UI overlays, HUD prompts, written submission drafting, pitch deck skeleton

**Day 4–5 — Integration**
- Connect Unity → Supabase → Spring Boot → Dashboard
- First integration checkpoint target: Day 2–3 end — get ONE real event (e.g. `ppe_item_equipped`) flowing end-to-end from Unity → Supabase → visible on dashboard, rather than waiting until everything is "done" to connect pieces

**Day 6 — Demo prep**
- Record clean gameplay video (backup in case live demo fails)
- Build pitch deck, rehearse

**Day 7 — Buffer / submission**

**Scope discipline principle:** One scenario done end-to-end beats multiple half-built scenarios. Judges reward a working loop over breadth.

---

## 8. Day 1 Learning Roadmap (Detailed — Zero to Intermediate)

A full detailed learning guide was created as a separate deliverable: **`Team_Learning_Roadmap.docx` / `.pdf`** (12 pages). Summary below.

### Shared Foundations (all 6 members read first, ~30-40 min)
- What we're building: desktop 3D sim (VR-styled/architected, no headset) training NDRF on chemical leak response
- Why each stack layer exists (table: Unity = renders/interaction, Supabase = simple logging, Spring Boot = custom scoring logic, React = instructor report card)
- How pieces talk: Unity → Supabase (raw events) → Spring Boot (reads events, computes score) → React dashboard (displays)
- Golden rule: nobody needs to become an expert — editing/understanding working starter code is normal and expected

### Per-Person Day 1 Tracks (each includes: why, what to learn in order, where to learn — official free resources, hour-by-hour 9am-5pm timeline, end-of-day milestone)

**Lohith R C** — REST API concepts, relational DB tables, Supabase basics (create project/tables via UI), Spring Boot core annotations refresher, connecting Spring Boot to Supabase Postgres via JDBC. *Milestone: Supabase project with 3 correct tables + Spring Boot querying one successfully.*

**Monica K S** — Java basics refresher if needed, Spring Boot annotations (@RestController, @Service, @Repository, @Entity, @GetMapping, @PostMapping), JPA repositories, testing with Postman. *Milestone: built and tested one working Spring Boot endpoint herself.*

**Chandana M N** — Unity Editor basics (Scene/Game view, Hierarchy, Inspector), C# basics for Unity, making objects clickable (OnMouseDown/Raycasting), simple state changes on interaction, first-person camera via Unity Starter Assets package. *Milestone: Unity scene with movement working + one clickable object with on-screen feedback.*

**Harshini R B** — Unity Editor navigation, importing Asset Store packages, basic lighting, Prefabs, particle effects for gas/fog VFX. *Milestone: basic scene laid out with entrance, PPE station, 2-3 drums via Prefab, one working particle effect.*

**Chandana M P** — React basics (components/props/state), useEffect + useState hooks, Supabase JavaScript client, rendering lists/tables in React, Recharts (awareness only for Day 1). *Milestone: React app fetching and displaying real Supabase data in a table.*

**Pavitra J H** — SIH submission structure, basic UI/UX principles (Nielsen heuristics), Figma wireframing basics, software testing/test case basics, hackathon pitch storytelling. *Milestone: test checklist derived from all 7 scenario stages, drafted SIH submission skeleton, rough wireframes for 2+ screens.*

### End of Day 1 Sync
15-20 min team call: did everyone hit milestones? Any blockers? Confirm naming/structure decisions (e.g. exact Unity object names backend/dashboard will reference). Reconfirm Day 2 plan still makes sense.

**Principle:** A working, simple version beats an ambitious, broken one — if someone falls behind, simplify their scope (see Minimum Viable Scope in Section 5) rather than skip fundamentals.

---

## 9. Things to Watch / Risk Areas (ongoing)

1. **Scenario script was the original blocker** — now resolved (Section 5), unblocks all parallel work
2. **Schema must be designed once** — Lohith's Supabase schema design should happen before Monica/Chandana M P build against it, to avoid rework
3. **Keep Supabase/Spring Boot boundary simple** — don't over-engineer the hybrid split; default to Supabase-direct when in doubt
4. **Unity learning curve is the biggest time risk** — two freshers (Chandana M N, Harshini) learning from scratch; if stuck by Day 2, simplify scope further rather than push through
5. **Integration (Days 4-5) is historically where hackathon weeks fall apart** — do a tiny end-to-end test (one dummy event, logged and shown on dashboard) early (Day 2-3), not at the end
6. **Always have a backup demo video** — live VR/Unity demos are prone to last-minute bugs

---

## 10. Deliverables Created So Far

1. `SIH260088_CBRN_VR_Training_Project.md` — original project overview doc (superseded/expanded by this file)
2. `Chemical_Spill_Scenario_Script.md` — full detailed scenario script (stages, events, scoring, schema, MVP fallback, per-role notes)
3. `Team_Learning_Roadmap.docx` / `.pdf` — 12-page detailed Day 1 learning guide, one section per team member

## 11. Open / Next Steps
- [ ] Generate Spring Boot backend skeleton (entity, repository, controller for session logging + score endpoints)
- [ ] Generate Unity interaction script starter (PPE pickup, detector scan mechanic)
- [ ] Generate React dashboard starter template
- [ ] Source specific free Unity Asset Store packs for chemical/industrial environment
- [ ] Complete SIH idea submission document (formal write-up — Pavitra has skeleton started)
- [ ] Complete pitch deck (Pavitra has skeleton started)
- [ ] Day 2-3: core build per assigned roles
- [ ] Day 2-3 end: first end-to-end integration test (one event, Unity → Supabase → dashboard)

---

*This document summarizes all project discussion to date for SIH260088. Any team member can share this file with their own AI assistant to get full context and continue work seamlessly. Companion files: `Chemical_Spill_Scenario_Script.md` and `Team_Learning_Roadmap.docx`/`.pdf`.*
