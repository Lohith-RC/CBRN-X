# ☣️ CBRS-X // CBRN HAZMAT PROTOCOL & RESPONSE SIMULATOR
### *Enterprise Tactical VR & WebGL Chemical, Biological & Radiological Emergency Training Platform*

<div align="center">

[![SIH Problem Statement](https://img.shields.io/badge/SIH_2024-SIH260088-FF6B00.svg?style=for-the-badge&logo=target&logoColor=white)](https://www.sih.gov.in)
[![Category](https://img.shields.io/badge/Category-Disaster_Management-0052CC.svg?style=for-the-badge&logo=shield&logoColor=white)](https://www.ndrf.gov.in)
[![Ministry](https://img.shields.io/badge/Ministry-Home_Affairs_(Govt._of_India)-138808.svg?style=for-the-badge&logo=gov.uk&logoColor=white)](https://mha.gov.in)
[![Institution](https://img.shields.io/badge/Institution-Kalpataru_Institute_of_Technology-800020.svg?style=for-the-badge&logo=academic-tree&logoColor=white)](https://kit-tpt.ac.in)

[![Backend](https://img.shields.io/badge/Backend-Spring_Boot_3.2.5_|_Java_17-6DB33F.svg?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io)
[![VR Engine](https://img.shields.io/badge/Simulation-Unity_2022.3_LTS_|_OpenXR_|_URP-000000.svg?style=for-the-badge&logo=unity&logoColor=white)](https://unity.com)
[![Web Station](https://img.shields.io/badge/Web_Station-React_18_|_Three.js_|_Vite_5-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_15_|_Supabase-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Orchestration](https://img.shields.io/badge/Orchestration-Docker_Compose_|_Nginx-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Build Status](https://img.shields.io/badge/Unit_%26_Integration_Tests-16%2F16_Passed-10B981.svg?style=for-the-badge&logo=checkmarx&logoColor=white)]()

</div>

---

```
========================================================================================================================
[CLASSIFIED // NDRF TACTICAL RESPONSE DIVISION // HAZCHEM & CBRN SECTOR 09]
INCIDENT SIMULATION DESIGNATION : CBRS-X / SCENARIOS: CBRN-CHEM-01 / CBRN-RAD-02 / CBRN-BIO-03
TARGET OPERATIONAL FACILITY     : INDUSTRIAL STORAGE BAY 03 - HAZARDOUS MATERIAL & ISOTOPE DEPOT
THREAT CLASSIFICATION           : LEVEL 4 VOLATILE ORGANIC / RADIOLOGICAL DISPERSION / AIRBORNE BIO-HAZARD
PRIMARY MISSION CYCLE           : DETECT ➔ PROTECT (PPE) ➔ CONTAIN ➔ EVACUATE ➔ DECONTAMINATE
TELEMETRY & SCORING STATUS      : SPRING BOOT 3.2.5 DETERMINISTIC AUDIT ENGINE [ACTIVE // PORT 8080]
========================================================================================================================
```

---

## 📑 Master Table of Contents

- [1. 🛡️ Executive Summary & Problem Statement Lore](#1-️-executive-summary--problem-statement-lore)
- [2. 🚀 3-Minute Quickstart Guide (New User Perspective)](#2--3-minute-quickstart-guide-new-user-perspective)
- [3. 🏛️ Master System Architecture & Multi-Tier Topology](#3-️-master-system-architecture--multi-tier-topology)
- [4. 🔄 Real-Time Telemetry & Scoring Lifecycle (Sequence Flow)](#4--real-time-telemetry--scoring-lifecycle-sequence-flow)
- [5. ⚡ Multi-Hazard Polymorphic Scenario State Machine](#5--multi-hazard-polymorphic-scenario-state-machine)
- [6. 👥 Multiplayer Squad Co-Op Telemetry Sync Flow](#6--multiplayer-squad-co-op-telemetry-sync-flow)
- [7. 🥽 Frontline Simulation Clients (9-Beat Narrative Journey)](#7--frontline-simulation-clients-9-beat-narrative-journey)
- [8. 🎯 Multi-Hazard Protocol Matrix & Scoring Model](#8--multi-hazard-protocol-matrix--scoring-model)
- [9. 🔒 Defense-in-Depth Security & Hardening Architecture](#9--defense-in-depth-security--hardening-architecture)
- [10. 🗄️ Database Architecture & Entity-Relationship Model (ERD)](#10-️-database-architecture--entity-relationship-model-erd)
- [11. 📡 REST API & STOMP WebSocket Specifications](#11--rest-api--stomp-websocket-specifications)
- [12. 📈 Observability & Monitoring (Prometheus & Grafana)](#12--observability--monitoring-prometheus--grafana)
- [13. 🛠️ Standard Operating Procedures (Installation & Setup)](#13-️-standard-operating-procedures-installation--setup)
- [14. 🔄 Disaster Recovery, Backups & E2E Validation](#14--disaster-recovery-backups--e2e-validation)
- [15. 👥 Engineering Task Force (SIH260088)](#15--engineering-task-force-sih260088)
- [16. 📜 Compliance & Verification Status](#16--compliance--verification-status)

---

## 1. 🛡️ Executive Summary & Problem Statement Lore

**CBRS-X** is an enterprise-grade Virtual Reality and WebGL disaster response simulation ecosystem engineered specifically for the **National Disaster Response Force (NDRF)**, hazardous materials (HAZMAT) emergency squads, petrochemical disaster response units, and civil defense agencies under **Smart India Hackathon (SIH) Problem Statement SIH260088**.

In real-world CBRN incidents, procedural infractions—such as entering a volatile hot zone without positive-pressure SCBA, misinterpreting photoionization detector (PID) ppm gradients, failing to isolate ventilation airlocks, or bypassing multi-stage decontamination—lead to catastrophic toxic exposure and loss of human life.

**CBRS-X delivers zero-risk, high-fidelity immersive tactical training** coupled with an automated deterministic telemetry scoring engine. First responders navigate hazardous industrial environments in VR or WebGL 3D while the backend continuously audits decisions, timestamps, PID detector sampling accuracy, containment sealant kinetics, and decontamination compliance against standard NDRF Standard Operating Procedures (SOPs).

```mermaid
mindmap
  root((☣️ CBRS-X Platform))
    Simulation Layer
      Unity 2022.3 LTS VR Client (OpenXR / URP)
      Three.js WebGL Trainee Simulator (9-Beat Engine)
      Volumetric Gaussian Plume Dispersion Shaders
      Physics-Driven Interactive Seal Kits & Decon Archway
    Scoring & Telemetry Engine
      Spring Boot 3.2.5 Reactive Telemetry Ingestion
      Deterministic 100-Point Protocol Evaluator
      Multi-Hazard Polymorphic Logic (Chem, Rad, Bio)
      Dead-Letter Resilient Event Ingestion Queue
    Command & Analytics
      Instructor Real-time Hologram HUD & Tactical Grid
      Longitudinal Trainee Skill-Growth Learning Curve
      Automated AI After-Action Review (AAR) Debrief
      Official PDF Certificate Engine with SHA-256 Digest
    Security & Infrastructure
      PostgreSQL 15 / Supabase Persistent Storage
      STOMP WebSocket Header Authentication
      Sliding-Window LRU Rate Limiting (10k IP Bounded)
      DDE / CSV Formula Injection Sanitization Guard
```

---

## 2. 🚀 3-Minute Quickstart Guide (New User Perspective)

### 2.1 Prerequisites
- **Node.js**: v18.0.0+ (`node -v`)
- **Java**: JDK 17+ (`java -version` - *optional if using Docker*)
- **Docker & Docker Compose**: (*recommended for full-stack one-click launch*)

### 2.2 Option A: One-Click Launch via PowerShell (Windows)
```powershell
# 1. Clone the repository
git clone https://github.com/Lohith-RC/CBRN-X.git
cd CBRN-X

# 2. Launch all services simultaneously with auto-JDK detection and Maven fallback
.\start_all_services.ps1
```

### 2.3 Option B: One-Click Production Deployment via Docker Compose
```bash
# 1. Copy master environment configuration
cp .env.example .env

# 2. Build and launch all 6 service containers in background
docker compose up --build -d
```

### 2.4 Service Port Mapping & Access Points

| Service | Port / URL | Description | Default Credentials |
| :--- | :--- | :--- | :--- |
| **Instructor Dashboard** | [http://localhost:3000](http://localhost:3000) | Tactical Command Center, Analytics, DVR Replay | `admin` / `ndrf-admin-123` |
| **Trainee Web Station** | [http://localhost:5000](http://localhost:5000) | 9-Beat Interactive 3D WebGL Simulation Station | N/A (One-Click Launch) |
| **Unity 3D WebGL Sim** | [http://localhost:3000/unity-sim/index.html](http://localhost:3000/unity-sim/index.html) | Direct Embedded 3D Viewport | N/A |
| **Spring Boot Backend** | [http://localhost:8080](http://localhost:8080) | REST API, STOMP WebSockets, Scoring Engine | Header `X-API-Key: dev_api_key_cbrsx_demo_9841` |
| **Prometheus Metrics** | [http://localhost:9090](http://localhost:9090) | Telemetry Ingestion Rate, P99 Latencies | N/A |
| **Grafana Dashboards** | [http://localhost:3001](http://localhost:3001) | Live Tactical Grid & Health Observability | `admin` / `cbrsx-grafana-2026` |

---

## 3. 🏛️ Master System Architecture & Multi-Tier Topology

```mermaid
flowchart TD
    subgraph Clients ["🕹️ Frontline Simulation Clients"]
        VR["Unity 3D Tactical VR Client<br/>(OpenXR / Meta Quest / SteamVR)"]
        Web3D["React Trainee View (Port 5000)<br/>(Three.js 9-Beat WebGL Station)"]
    end

    subgraph Ingress ["🌐 Ingress Gateway & Load Balancer"]
        Nginx["Nginx Reverse Proxy (Port 80)<br/>(SSL Termination & Service Dispatcher)"]
        SecurityFilter["ApiKeyAuthFilter & RateLimiter<br/>(Bounded LRU 10k Capacity)"]
    end

    subgraph Backend ["⚙️ Core Telemetry & Scoring Services (Spring Boot 3.2.5 - Port 8080)"]
        SessionService["Session Orchestrator & State Machine"]
        ScoringEngine["Deterministic 100-Point Scoring Engine"]
        DebriefService["AI After-Action Review (AAR) Engine"]
        CertEngine["iText7 PDF Certificate Engine (SHA-256)"]
        WsBroker["STOMP / SockJS WebSocket Broker"]
    end

    subgraph Storage ["🗄️ Persistence & Database Layer"]
        Postgres[("PostgreSQL 15 / Supabase<br/>(Flyway Migrations V1, V2)")]
    end

    subgraph Observability ["📈 Observability & Monitoring"]
        Prometheus["Prometheus Metric Scraper (Port 9090)"]
        Grafana["Grafana Tactical Dashboard (Port 3001)"]
    end

    Clients -->|HTTP / WebSocket| Nginx
    Nginx --> SecurityFilter
    SecurityFilter --> Backend
    Backend -->|JPA / HikariCP| Postgres
    Backend -->|Spring Actuator /actuator/prometheus| Prometheus
    Prometheus --> Grafana
    WsBroker -.->|Live Telemetry Broadcast| Clients
```

---

## 4. 🔄 Real-Time Telemetry & Scoring Lifecycle (Sequence Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Trainee as 🥽 Trainee (VR / WebGL)
    participant Nginx as 🌐 Nginx Proxy
    participant Auth as 🔒 ApiKeyAuthFilter
    participant SessionSvc as ⚙️ SessionService
    participant EventRepo as 🗄️ EventRepository
    participant ScoringSvc as 🎯 ScoringService
    participant WsBroker as 📡 STOMP Broker
    actor Instructor as 📊 Instructor Dashboard

    Trainee->>Nginx: POST /api/sessions/start
    Nginx->>Auth: Validate X-API-Key & Rate Limit
    Auth->>SessionSvc: Initialize Session (CBRN-CHEM-01)
    SessionSvc->>EventRepo: Persist Session Record (STATUS: IN_PROGRESS)
    SessionSvc-->>Trainee: Return sessionId ("SESS-2026-088")

    loop Active Disaster Response Drill
        Trainee->>Nginx: POST /api/events/log (PID Sensor, PPE Donning, Containment)
        Nginx->>Auth: Verify Token & Sanitize DDE
        Auth->>SessionSvc: Process Telemetry Event
        SessionSvc->>EventRepo: Save Event with Precise Nanosecond Timestamp
        SessionSvc->>WsBroker: Broadcast Event to /topic/telemetry/{sessionId}
        WsBroker-->>Instructor: Update Real-time HUD, SCBA PSI & Trajectory Map
    end

    Trainee->>Nginx: POST /api/sessions/{sessionId}/complete
    Nginx->>SessionSvc: Trigger Session Completion
    SessionSvc->>ScoringSvc: Calculate Deterministic 100-Point Score
    ScoringSvc->>ScoringSvc: Apply Multi-Hazard Rubric & Safety Deductions
    ScoringSvc->>EventRepo: Persist Final Score, Pass Status & AAR Report
    SessionSvc->>WsBroker: Broadcast Finalized Scorecard
    WsBroker-->>Instructor: Display Automated Scorecard, Radar Chart & PDF Download
```

---

## 5. ⚡ Multi-Hazard Polymorphic Scenario State Machine

```mermaid
stateDiagram-v2
    [*] --> INITIALIZED: Start Scenario Session

    INITIALIZED --> BRIEFING_REVIEWED: Read Emergency Incident Alert
    BRIEFING_REVIEWED --> PPE_DONNING_IN_PROGRESS: Approach Equipment Station

    state PPE_DONNING_IN_PROGRESS {
        [*] --> SUIT_ZIPPED: Don Level-A / B Torso Suit
        SUIT_ZIPPED --> MASK_SEALED: Seal CBRN Full-Face Respirator
        MASK_SEALED --> GLOVES_SNAPPED: Snap Chemical-Resistant Gloves
    }

    PPE_DONNING_IN_PROGRESS --> HOTZONE_AUTHORIZED: PPE Check Verified (3/3)
    PPE_DONNING_IN_PROGRESS --> CRITICAL_SAFETY_VIOLATION: Enter Hotzone without PPE (-50 pts)

    HOTZONE_AUTHORIZED --> PERIMETER_BREACHED: Enter Storage Bay 03
    PERIMETER_BREACHED --> SOURCE_LOCALIZATION: Deploy PID Sensor / Geiger / Bio-Sampler

    state SOURCE_LOCALIZATION {
        [*] --> SCANNING_GRADIENTS: Ambient Raycast Reading
        SCANNING_GRADIENTS --> SOURCE_CONFIRMED: Correct Hotspot Identified (+20 pts)
        SCANNING_GRADIENTS --> FALSE_POSITIVE: False Positive Scan (-5 pts)
    }

    SOURCE_LOCALIZATION --> CONTAINMENT_ACTION: Apply Seal Patch / Foam / Lead Shield
    CONTAINMENT_ACTION --> EVACUATION_PROTOCOL: Escort Trapped Civilian Personnel
    EVACUATION_PROTOCOL --> DECONTAMINATION_STATION: Multi-Stage Chemical Washdown
    DECONTAMINATION_STATION --> EVALUATION_FINALIZED: Final Scoring & Debriefing

    CRITICAL_SAFETY_VIOLATION --> EVALUATION_FINALIZED: Mission Failed
    EVALUATION_FINALIZED --> [*]
```

---

## 6. 👥 Multiplayer Squad Co-Op Telemetry Sync Flow

```mermaid
flowchart LR
    subgraph SquadAlpha ["🎖️ NDRF Alpha Squad (Hot-Zone)"]
        Operator1["Responder Alpha-1<br/>(Lead Recon)"]
        Operator2["Responder Alpha-2<br/>(Containment Specialist)"]
    end

    subgraph SquadBravo ["🛡️ NDRF Bravo Squad (Backup / Decon)"]
        Operator3["Responder Bravo-1<br/>(SCBA Backup)"]
    end

    subgraph WsHub ["📡 WebSocket Mesh Sync (:8080)"]
        WsEngine["STOMP Broker Channel<br/>/topic/squad/alpha<br/>/topic/squad/bravo"]
    end

    subgraph InstructorView ["🖥️ Instructor Command HUD"]
        SafetyMatrix["Personnel Safety & SCBA Matrix<br/>(Real-Time PSI, Exposure Timer, BPM)"]
        RadarComparison["Multiplayer Squad Radar Comparison<br/>(Alpha vs Bravo Benchmark)"]
    end

    Operator1 -->|Stream Telemetry| WsEngine
    Operator2 -->|Stream Telemetry| WsEngine
    Operator3 -->|Stream Telemetry| WsEngine
    WsEngine -->|Live Telemetry Broadcast| SafetyMatrix
    WsEngine -->|Aggregated Cohort Metrics| RadarComparison
```

---

## 7. 🥽 Frontline Simulation Clients (9-Beat Narrative Journey)

```mermaid
timeline
    title 9-Beat CBRN First-Person Simulation Progression
    Beat 1 (0:00 - 0:07) : CCTV Surveillance Notice : Catastrophic Storage Bay 03 Chlorine Leak Alert
    Beat 2 (0:07 - 0:14) : Safety Orientation : First-Person Viewport Boot & Airlock Approach
    Beat 3 (0:14 - 0:21) : Hazard Telemetry Scan : IDLH Atmospheric Toxicity Exceeded (>400 PPM)
    Beat 4 (0:21 - 0:28) : PPE Donning Lock-On : Equipment Station Identification
    Beat 5 (0:28 - 0:35) : Chemical Torso Suit : Hermetic Seal Zipping & Positive Pressure Check
    Beat 6 (0:35 - 0:42) : CBRN Gas Mask : Full-Face Visor Hermetic Seal & HUD Overlay
    Beat 7 (0:42 - 0:49) : Protective Gloves : Barrier Snap & Full Hotzone Clearance
    Beat 8 (0:49 - 0:56) : Tactical Advance : Sprint through Gate to Hazard Perimeter
    Beat 9 (0:56 - 1:03) : Multi-Gas Detector : Photoionization Detector Deployment & Drum Scan
```

---

## 8. 🎯 Multi-Hazard Protocol Matrix & Scoring Model

### 8.1 Normalized 100-Point Scoring Formula

$$\text{Final Score} = S_{\text{PPE}} + S_{\text{Detection}} + S_{\text{Containment}} + S_{\text{Evacuation}} + S_{\text{Decon}} + S_{\text{Velocity}} - \sum P_{\text{SafetyViolations}}$$

| Evaluation Category | Max Points | Evaluation Criteria |
| :--- | :---: | :--- |
| **PPE Donning Sequence** | **20 pts** | Proper chronological order: Suit $\rightarrow$ Mask $\rightarrow$ Gloves before hot-zone entry |
| **Hazard Identification** | **20 pts** | Accurate PID sensor / Geiger counter / Bio-sampler source localization |
| **Leak Containment** | **20 pts** | Rapid application of magnetic patch / chemical foam sealant / lead shielding |
| **Civilian Evacuation** | **20 pts** | Triaging and escorting trapped industrial personnel through cold-zone corridor |
| **Decontamination SOP** | **10 pts** | Multi-stage washdown compliance and residue verification |
| **Velocity Bonus** | **10 pts** | Execution speed bonus for completion within baseline operational time |
| **Critical Safety Penalties** | **Up to -50 pts** | Immediate deduction for entering hot zone without PPE or incorrect equipment |

---

## 9. 🔒 Defense-in-Depth Security & Hardening Architecture

```mermaid
flowchart TD
    subgraph Perimeter ["🛡️ Layer 1: Perimeter Gateway (Nginx)"]
        TLS["TLS 1.3 / SSL Termination"]
        Headers["HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff"]
    end

    subgraph IngressSecurity ["🔒 Layer 2: Ingress & Rate Limiting"]
        RateLimit["Bounded LRU Rate Limiter (10k IP Capacity, 120 req/min)"]
        CorsGuard["CORS Strict Origin Allowlist (Unified Config)"]
    end

    subgraph AuthSecurity ["🔑 Layer 3: Authentication & RBAC"]
        BCrypt["BCrypt (Cost Factor 12) Instructor Password Hash"]
        ApiKeyAuth["Role-Scoped API Keys (ADMIN, INSTRUCTOR, SIMULATION, TRAINEE)"]
        CsrfGuard["Double-Submit CBRSX-XSRF Cookie (SameSite=Lax)"]
    end

    subgraph AppSecurity ["🛡️ Layer 4: Application & Data Sanitization"]
        DdeSanitize["CSV / DDE Formula Injection Sanitization (=, +, -, @)"]
        SqlParam["Parameterized JPA Repositories (SQL Injection Immune)"]
        CertDigest["iText7 PDF Certificates Sealed with SHA-256 Cryptographic Salt"]
    end

    Perimeter --> IngressSecurity
    IngressSecurity --> AuthSecurity
    AuthSecurity --> AppSecurity
```

---

## 10. 🗄️ Database Architecture & Entity-Relationship Model (ERD)

```mermaid
erDiagram
    INSTRUCTOR_USERS {
        bigint id PK
        varchar username UK
        varchar password_hash
        varchar role
        timestamp created_at
    }

    TRAINEES {
        varchar trainee_id PK
        varchar name
        varchar batch_unit
        timestamp registered_at
    }

    SCENARIOS {
        varchar scenario_id PK
        varchar scenario_code UK
        varchar title
        varchar hazard_type
        integer baseline_time_seconds
    }

    TRAINING_SESSIONS {
        varchar session_id PK
        varchar trainee_id FK
        varchar scenario_id FK
        varchar squad_id
        integer final_score
        varchar pass_status
        timestamp started_at
        timestamp completed_at
    }

    SESSION_EVENTS {
        bigint event_id PK
        varchar session_id FK
        varchar event_type
        text event_data
        timestamp timestamp
    }

    AUDIT_LOGS {
        bigint audit_id PK
        varchar principal
        varchar action
        varchar resource
        varchar ip_address
        timestamp timestamp
    }

    TRAINEES ||--o{ TRAINING_SESSIONS : "undertakes"
    SCENARIOS ||--o{ TRAINING_SESSIONS : "defines"
    TRAINING_SESSIONS ||--o{ SESSION_EVENTS : "streams"
    INSTRUCTOR_USERS ||--o{ AUDIT_LOGS : "generates"
```

---

## 11. 📡 REST API & STOMP WebSocket Specifications

### 11.1 Key REST Endpoints

```http
POST   /api/auth/login                  # Instructor session authentication
POST   /api/auth/logout                 # Invalidate session and clear cookies
POST   /api/sessions/start              # Initialize new simulation session
POST   /api/events/log                  # Stream telemetry event from VR/WebGL
POST   /api/sessions/{id}/complete      # Complete run and trigger scoring engine
GET    /api/sessions/{id}/report        # Fetch full evaluation report & breakdown
GET    /api/sessions/{id}/certificate   # Generate tamper-evident PDF certificate
GET    /api/dashboard/stats             # Aggregated battalion performance metrics
GET    /actuator/prometheus             # Prometheus metric scrape endpoint
```

### 11.2 WebSocket STOMP Channels
- **Broker Endpoint**: `/ws` (with fallback to SockJS)
- **Telemetry Broadcast**: `/topic/telemetry/{sessionId}`
- **Instructor Command Channel**: `/topic/commands/{teamId}`

---

## 12. 📈 Observability & Monitoring (Prometheus & Grafana)

The integrated monitoring stack tracks operational system health:
- **Telemetry Ingestion Rate**: Real-time throughput of `/api/events/log`.
- **P95 / P99 Latencies**: Scoring engine calculation and DB write latencies.
- **Active WebSocket Connections**: Active VR headsets and web simulation clients.

---

## 13. 🛠️ Standard Operating Procedures (Installation & Setup)

### 13.1 Manual Setup for Development

#### Backend (Spring Boot 3.2.5)
```bash
cd backend
# Using Maven Wrapper
./mvnw clean spring-boot:run
# Or using global Maven
mvn clean spring-boot:run
```

#### Instructor Dashboard (React + Vite)
```bash
cd dashboard
npm install
npm run dev
```

#### Trainee Web Station (React + Three.js + Vite)
```bash
cd trainee_view
npm install
npm run dev
```

---

## 14. 🔄 Disaster Recovery, Backups & E2E Validation

Automated operations and testing scripts in `scripts/`:
- **Database Backup**: `scripts/backup.bat` / `scripts/backup.sh` (automated pg_dump with 14-day retention).
- **End-to-End Test Suite**: `node scripts/e2e_simulation_test.js` (validates complete multi-hazard lifecycle).
- **Stress & Load Testing**: `node scripts/stress_tester.js` (simulates 50+ concurrent VR telemetry streams).

---

## 15. 👥 Engineering Task Force (SIH260088)

<div align="center">

| Contributor | Core System Roles & Responsibilities |
| :--- | :--- |
| **Lohith R C** | **Team Lead**, Unity Developer, UI/UX Designer, Database Administrator, Frontend Verifier, Backend Developer & Version Control Manager |
| **Monica K S** | **Backend Developer** & Database Administrator |
| **Chandana M P** | **Admin Dashboard Developer** (Frontend & Backend) & Workflow Manager |
| **Chandana M N** | **Frontend Developer**, UI Designer & Unity Physics Developer |
| **Harshini R B** | **Unity Environment Artist** & 3D Asset Developer |
| **Pavitra J H** | **UI/UX Designer**, Quality Assurance Tester, Documentation Manager & Progress Tracker |

</div>

---

## 16. 📜 Compliance & Verification Status

```
========================================================================================================================
[VERIFICATION SUMMARY]
  • Backend Unit & Integration Tests : Passed (Scoring, Security, Certificates, Cohort Analytics)
  • Dashboard Frontend Vitest Suite  : 7 / 7 Tests Passed
  • Trainee View Frontend Vitest Suite: 9 / 9 Tests Passed
  • Total Verified Test Cases        : 16 / 16 Passed (100% Green)
  • Security SAIF & OWASP Compliance : Verified (CSRF, RBAC, Rate Limiting, Injection Sanitization)
========================================================================================================================
```

<div align="center">
  <sub>Developed with ☣️ for the National Disaster Response Force (NDRF) under Smart India Hackathon 2024 (SIH260088).</sub>
</div>
