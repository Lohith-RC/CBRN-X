# 📦 Unity Asset Store Acquisition & Integration Workflow

A production-grade pipeline and automation framework for discovering, acquiring, importing, and integrating free Unity Asset Store assets with architectural and visual cohesion.

**Authored By:**
- **Harshini R B**: Unity Environment Artist & 3D Asset Developer
- **Chandana M N**: Frontend Developer, Designer & Unity Physics Developer
- **Lohith R C**: Team Lead, Unity Developer, Designer, Database Administrator, Frontend Verifier, Backend Developer & Version Control Manager
- **Pavitra J H**: UI/UX Designer, Tester, Documentation Manager & Project Progress Tracker

---

## 🎯 Pipeline Overview

```
[Phase 1: Discovery & Filtering]
  └── Search Asset Store (Rating ≥ 4.5, URP/HDRP, Low-Poly / Clean Topology, Free License)
       │
[Phase 2: Account Acquisition]
  └── One-Click "Add to My Assets" via Unity ID Web Portal
       │
[Phase 3: Automated Extraction & Import]
  └── Local Cache Scan (`APPDATA/Unity/Asset Store-5.x/`) → `unity_asset_pipeline.py` or Unity Editor Window
       │
[Phase 4: Optimization & Scene Organization]
  └── Auto-Upgrade Shaders to URP Lit → Organize Hierarchy into Standard System Parents
```

---

## 🔍 Phase 1: Searching for High-Quality Free Assets

When acquiring assets for industrial/simulation environments (e.g. CBRN Hazmat, logistics, architectural visualization), filter by the following quality standards:

### 1. Filtering Checklist:
* **Pricing**: Filter by **Free Assets** (`Price = $0`).
* **Rating**: Select packages with **4.5★ or higher** with at least 50+ reviews.
* **Pipeline Compatibility**: Verify **Universal Render Pipeline (URP)** or **HDRP** support to prevent magenta/pink missing shader errors.
* **Polygon Budget**: Ensure static industrial props are under **15,000 tris per model** and include LOD groups (LOD0, LOD1, LOD2).
* **Texture Maps**: PBR workflow (Albedo/BaseMap, Normal, Metallic/Smoothness, Ambient Occlusion, Emission) in `2048x2048` or `4096x4096` PNG/TGA.

### 2. Recommended High-Quality Free Asset Categories:
* **Particle Systems & VFX**: *War FX* (Jean Moreno), *Legacy Particle Pack* (Unity Technologies).
* **Shaders & Grid Visualizers**: *Grid Master* (Decimate), *Toon Shader URP*.
* **Industrial & Props**: *Industrial Props Pack*, *Warehouse Pallet & Logistics Kit*.
* **Audio & Acoustics**: *Industrial Ambient SFX*, *Footstep Audio System*.

---

## 👤 Phase 2: Adding Assets to Your Personal Unity Account

1. Open the [Unity Asset Store](https://assetstore.unity.com/) in your browser.
2. Sign in with your **Unity ID**.
3. Navigate to the asset page and click **"Add to My Assets"** (or "Open in Unity").
4. Accept the Standard Asset Store EULA.
5. The package is now permanently bound to your Unity ID cloud library and will appear in Unity's **Package Manager** under **"My Assets"**.

---

## ⚡ Phase 3: Automated Project Import & Pipeline Tools

Two automated methods are provided in this codebase:

### Method A: Command-Line Automation (`scripts/unity_asset_pipeline.py`)

A standalone Python pipeline that searches local package caches and extracts `.unitypackage` archives directly into `Assets/` while preserving `.meta` GUIDs:

```powershell
# 1. List all downloaded asset packages on your machine
python scripts/unity_asset_pipeline.py list

# 2. Import a specific package directly into the Unity project
python scripts/unity_asset_pipeline.py import "War FX" --project-dir .

# 3. Import package into a specific third-party subfolder
python scripts/unity_asset_pipeline.py import "Grid Master" --project-dir . --subfolder "ThirdParty/Decimate"
```

### Method B: Unity In-Editor Pipeline Window (`AssetStorePipelineWindow.cs`)

1. In Unity Editor, click **`Window > CBRS-X > Asset Store Pipeline Manager`**.
2. Browse all locally cached packages with file sizes and publishers.
3. Click **"Import to Project"** — the tool extracts the package and automatically triggers the **URP Material Auto-Converter**.

---

## 🏗️ Phase 4: Production Scene Organization & Visual Cohesion

### 1. Standard Project Folder Hierarchy (`Assets/`)
Keep imported assets isolated from core project scripts to prevent asset collisions:

```
Assets/
 ├── Scripts/                 ← Core gameplay, managers, and telemetry scripts
 ├── Scenes/                  ← Production training and scenario scenes
 ├── Materials/               ← Master PBR and project-wide shared materials
 ├── Prefabs/                 ← Configured composite game objects
 ├── Audio/                   ← Sound effects, alerts, and ambient tracks
 └── ThirdParty/              ← Imported Asset Store packages
      ├── JeanMoreno/WarFX/
      └── Decimate/GridMaster/
```

### 2. Standard Scene Root Parent Organization
Enforce clean scene hierarchies using non-transform root categorizers:

```
StorageBay03_Training.unity
 ├── [--- ENVIRONMENT & ARCHITECTURE ---]  ← Floors, steel I-beams, walls, HVAC ducting, rail spur
 ├── [--- LIGHTING & ATMOSPHERE ---]       ← Directional daylight, task spotlights, beacon flashers
 ├── [--- INTERACTIVE STATIONS ---]        ← Spill kit, gas detector wall dock, eyewash station
 ├── [--- ACTORS & NPCS ---]               ← Containment sumps, leaking drums, civilian targets
 ├── [--- MANAGERS & SYSTEMS ---]          ← SimulationManager, ScenarioTelemetrySender, AudioListener
 ├── [--- TACTICAL_CCTV_CAMERAS ---]       ← MultiCameraController rig (5 switched views)
 └── [HUD_Canvas]                          ← Reticle, telemetry stats, timer, PPE status
```

### 3. Automatic URP Shader Standardization
Legacy packages often import with Built-in Standard shaders (resulting in pink materials). 
Run the built-in converter via:
* **Editor Window**: `Window > CBRS-X > Asset Store Pipeline Manager > Run URP Material Auto-Converter`
* **Unity Native**: `Edit > Rendering > Materials > Convert Selected Built-in Materials to URP`

---

## 🛡️ Summary Checklist for Every Imported Asset

- [x] Unpacked with valid `.meta` GUIDs.
- [x] Shaders upgraded to `Universal Render Pipeline/Lit`.
- [x] Textures compressed with Crunch Compression (Desktop/VR optimal).
- [x] Added to appropriate `--- CATEGORY ---` scene parent.
- [x] Static batching enabled for non-moving architecture (`Static` flag checked).
