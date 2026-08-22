# CBRS-X Unity XR Simulation Module

This folder contains the complete **Unity 6 (Universal Render Pipeline)** project assets for the **Storage Bay 03 Chemical Disaster Response Simulation**.

---

## 🏗️ Architecture & Asset Layout

```
Assets/
├── Scenes/
│   ├── StorageBay03_Training.unity      # Master 3D simulation training environment
│   └── SampleScene.unity
├── Scripts/                             # 11 Core Simulation & Interaction C# Scripts
│   ├── EmergencyLightingFlasher.cs      # Procedural strobe & beacon lighting animator
│   ├── FirstPersonResponderController.cs# Movement, head bob & acoustic low-pass filter
│   ├── PlayerInteraction.cs             # SphereCast raycaster & dynamic HUD crosshair
│   ├── PpeStation.cs                    # Level B PPE donning order validation (Suit ➔ Mask ➔ Gloves)
│   ├── GasDetector.cs                   # 3D Gaussian plume dispersion sensor & mass-spring gauge
│   ├── LeakDrum.cs                      # Chemical puddle scale, corrosive shader & plume decay
│   ├── ContainmentKit.cs                # Hold-to-interact pneumatic patch applicator
│   ├── Civilian.cs                      # 3-State trauma FSM & toxicity exposure tracking
│   ├── DeconStation.cs                  # 6-Second deluge mist shower trigger volume
│   ├── HudManager.cs                    # Military tactical HUD (Compass, Ribbon, Checklist, Timer)
│   ├── PostProcessingController.cs      # Visor optical distortion & alarm vignette driver
│   └── CbrsEventLogger.cs               # REST client streaming telemetry to Spring Boot backend
├── Settings/                            # URP Pipeline settings & renderer assets
├── TextMesh Pro/                        # High-resolution fonts & SDF shader graphs
├── PostProcessing_StorageBay03.asset    # ACES Tonemapping, Bloom, Vignette, CA Volume Profile
└── Mat_*.mat                            # 30+ Industrial PBR materials (Concrete, Metal, Corrosive Drum, etc.)
```

---

## 🎮 How to Open & Run in Unity

1. Open **Unity Hub** and click **Add project from disk**.
2. Select the repository root folder (`c:\Users\lohit\OneDrive\Desktop\CBRS-X`).
3. Ensure **Unity 6 (6000.x)** with Universal Render Pipeline (URP) is selected.
4. In the Project window, navigate to `Assets/Scenes/StorageBay03_Training.unity` and double-click to open.
5. Press **Play** to enter first-person training mode.
