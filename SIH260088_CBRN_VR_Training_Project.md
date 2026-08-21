# SIH260088 — VR-Based CBRN Disaster Response Training Platform

**Project context document — share this with any team member's Claude to get full context on the project.**

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

## 2. Team

Team of 6 students, all freshers, no prior experience with this domain or VR/game development. Building a prototype in **one week**.

| Member | Role |
|---|---|
| **Lohith R C** | Team Lead + Backend |
| **Monica K S** | Backend (API + database, paired with Lohith) |
| **Chandana M N** | VR/3D Interaction (Unity scripting — what happens on click/interact) |
| **Harshini R B** | Environment Design (Unity — placing pre-made 3D assets, lighting) |
| **Chandana M P** | Dashboard (Frontend — React page showing trainee scores/data) |
| **Pavitra J H** | UI/UX + Documentation + Testing |

**Note on role evolution:** Original role split had overlaps (two people both doing "backend/dashboard," two people both doing "frontend/VR"). Revised split above cleanly separates: Backend pair (Lohith + Monica) vs. Unity pair (Chandana M N + Harshini) vs. Dashboard (Chandana M P) vs. Docs/UX/Testing (Pavitra).

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

**Chemical scenario flow (linear sequence):**
1. Detect leak
2. Don PPE (gas mask/suit)
3. Use gas detector (interact → reading changes)
4. Evacuate civilians
5. Seal/contain the leak
6. Decontamination

**Pitch framing for scope:** *"Prototype demonstrates the Chemical hazard module of a multi-hazard CBRN VR training platform — architecture designed to extend to Biological, Radiological, and Nuclear modules post-prototype."*

---

## 5. Proposed Tech Stack

Chosen for being both capable and learnable by a fresher team in a week — reuses stacks the team lead (Lohith) already knows from other projects (AI-First CRM, etc.).

| Layer | Choice | Why |
|---|---|---|
| **VR/3D Engine** | Unity + XR Interaction Toolkit | Best asset ecosystem, C# is beginner-friendly, most VR tutorials available |
| **VR SDK** | OpenXR (headset-agnostic) | Not required for desktop-sim prototype, but keeps architecture VR-ready |
| **Backend** | FastAPI (Python) + PostgreSQL | Logs trainee actions, scores, session time; team lead has prior experience with FastAPI |
| **Dashboard** | React + Chart.js/Recharts | Instructor-facing view of trainee performance — visual "impact" layer for judges |
| **3D Assets** | Unity Asset Store (free industrial/hazmat packs) + Blender (only if custom models needed) | Saves massive dev time vs. modeling from scratch |
| **Alerts/Voice (optional polish)** | Unity built-in TTS or pre-recorded audio cues | Easier than real-time TTS integration under time pressure |

**Rejected/deprioritized options:**
- Unreal Engine — too steep a learning curve for freshers in one week
- A-Frame/WebXR — considered as an "easiest" option but Unity chosen instead for better asset ecosystem and because desktop-sim doesn't need true WebXR
- Real VR headset deployment — no budget; deferred to future roadmap

---

## 6. One-Week Build Plan (6 people)

**Day 1 — Setup**
- Install Unity, agree on Chemical scenario scope
- Lohith sets up GitHub repo + backend skeleton

**Day 2–3 — Core build**
- Harshini: environment (industrial site using free asset packs)
- Chandana M N: first-person controller + interaction scripts (pick up detector/PPE, click to scan)
- Lohith + Monica: backend API for logging trainee actions/time/score
- Chandana M P: dashboard skeleton (parallel work, doesn't block on Unity)
- Pavitra: UI overlays (on-screen prompts, alerts, HUD text)

**Day 4–5 — Integration**
- Connect Unity scenario → backend (send session data on scenario completion)
- Wire dashboard to display that data
- Bug fixes and polish of the core loop

**Day 6 — Demo prep**
- Record a clean gameplay video (backup in case live demo fails)
- Build pitch deck, rehearse

**Day 7 — Buffer / submission**

**Scope discipline note:** One scenario done end-to-end (interaction → backend logging → dashboard) beats multiple half-built scenarios. Judges reward a working loop over breadth.

---

## 7. Learning Path for Freshers (No Prior Experience)

Team does not need to become experts — just needs to complete specific, scoped tasks, ideally using starter code rather than building from scratch.

- **Unity basics** (Chandana M N + Harshini): Official Unity Learn beginner tutorials; drag-drop objects + basic C# click scripts
- **FastAPI basics** (Lohith + Monica): Official "build an API in 15 minutes" tutorial; can start from generated starter code
- **React basics** (Chandana M P): Can start from a generated working dashboard template and customize
- **No-code parts** (Pavitra): Documentation and testing require no coding — good low-risk starting task

**Next planned step (not yet done):** Generating starter code for each part — Unity C# interaction script, FastAPI backend skeleton, React dashboard template — so the team edits/customizes working code instead of building from a blank file.

---

## 8. Open / Next Steps
- [ ] Generate Unity interaction script (PPE pickup, detector scan mechanic)
- [ ] Generate FastAPI backend skeleton (session logging, score endpoints)
- [ ] Generate React dashboard template
- [ ] Source specific free Unity Asset Store packs for chemical/industrial environment
- [ ] Draft detailed chemical spill scenario script (exact trainee step sequence, scoring rules)
- [ ] Build SIH idea submission document (formal write-up with problem, solution, tech stack, team roles)
- [ ] Build pitch deck / slide content

---

*This document summarizes all project discussion to date for SIH260088. Any team member can share this file with their own Claude to get full context and continue work seamlessly.*
