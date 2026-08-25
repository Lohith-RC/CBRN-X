# 📡 CBRS-X: SYSTEM DATA FLOW & FROZEN API CONTRACT SPECIFICATION
### *End-to-End Integration Backbone: Unity VR ➔ Spring Boot ➔ PostgreSQL ➔ React Command Dashboard*
**Document Identifier:** `CBRS-X-CONTRACT-SPEC-V1.0-FROZEN`  
**Classification:** `ENTERPRISE DISASTER SIMULATION INTEGRATION STANDARD`  
**Target Repository:** `Lohith-RC/CBRN-X` | **Branch:** `main`  
**Authors / Task Force (SIH260088):**
- **Lohith R C**: Team Lead, Unity Developer, Designer, Database Administrator, Frontend Verifier, Backend Developer & Version Control Manager
- **Monica K S**: Backend Developer & Database Administrator
- **Chandana M P**: Admin Dashboard Developer (Frontend and Backend) & Workflow Manager
- **Chandana M N**: Frontend Developer, Designer & Unity Physics Developer
- **Harshini R B**: Unity Environment Artist & 3D Asset Developer
- **Pavitra J H**: UI/UX Designer, Tester, Documentation Manager & Project Progress Tracker  

---

## 📑 1. High-Level Data Flow Topology

```
+----------------------------------------------------------------------------------------------------------------------+
|                                             CBRS-X DATA FLOW PIPELINE                                                |
+----------------------------------------------------------------------------------------------------------------------+

  +-----------------------+              HTTP REST (JSON)              +-----------------------+
  |    TACTICAL CLIENTS   | -----------------------------------------> |  NGINX EDGE GATEWAY   |
  |  - Unity 6 OpenXR     |                                            |  - Port 80 (Command)  |
  |  - WebGL 3D Station   | <========================================= |  - Port 5000 (Trainee)|
  +-----------------------+              STOMP WebSocket               +-----------------------+
              |                                                                    |
              | (Local Cache / Retry Queue)                                        | (Reverse Proxy / Rate Limit)
              v                                                                    v
  +-----------------------+                                            +-----------------------+
  |  CbrsEventLogger.cs   |                                            |  SPRING BOOT CORE     |
  |  - ISO-8601 UTC Stamp |                                            |  - ApiKeyAuthFilter   |
  |  - Exponential Retry  |                                            |  - STOMP MessageBroker|
  +-----------------------+                                            |  - Scoring Engine     |
                                                                       +-----------------------+
                                                                                   |
                                                        +--------------------------+--------------------------+
                                                        |                                                     |
                                                        v                                                     v
                                            +-----------------------+                             +-----------------------+
                                            |  POSTGRESQL DATABASE  |                             | INSTRUCTOR DASHBOARD  |
                                            |  - Relational Schema  |                             |  - React 18 / Three.js|
                                            |  - Cascading Deletes  |                             |  - Real-Time Radar    |
                                            |  - Compound Indexes   |                             |  - Live AAR Debrief   |
                                            +-----------------------+                             +-----------------------+
```

---

## 🔒 2. Frozen JSON Entity Contracts

The four foundational contracts below are frozen across the entire CBRS-X pipeline. All clients, services, and visualizers strictly conform to these structures.

### 2.1 `TraineeSession` (Session Lifecycle Contract)
* **Schema Definition:** [`docs/schemas/TraineeSession.schema.json`](file:///c:/Users/lohit/OneDrive/Desktop/CBRS-X/docs/schemas/TraineeSession.schema.json)
* **Java Entity:** `com.cbrsx.backend.entity.TrainingSession`
* **JSON Payload Representation:**

```json
{
  "sessionId": "sess-f4a7c891e23",
  "traineeId": "tr-001",
  "traineeName": "Inspector Lohith R C",
  "batchUnit": "10th NDRF Battalion",
  "scenarioId": "scen-chem-01",
  "scenarioCode": "CBRN-CHEM-01",
  "startedAt": "2026-08-25T14:30:00.000Z",
  "completedAt": "2026-08-25T14:32:22.000Z",
  "finalScore": 95,
  "passStatus": "PASSED"
}
```

### 2.2 `TelemetryEvent` (Real-Time Ingestion Contract)
* **Schema Definition:** [`docs/schemas/TelemetryEvent.schema.json`](file:///c:/Users/lohit/OneDrive/Desktop/CBRS-X/docs/schemas/TelemetryEvent.schema.json)
* **Java Entity / DTO:** `com.cbrsx.backend.dto.LogEventRequest` / `com.cbrsx.backend.entity.SessionEvent`
* **C# Client Model:** `CBRSX.Unity.LogEventPayloadV2`
* **Standardized Event Types:**

| `eventType` | Triggering Simulation Condition | Expected `eventData` Schema |
|---|---|---|
| `ppe_donning_completed` | Responder inspects and equips Level-A suit + SCBA. | `{"suitType": "LEVEL_A", "scbaPressureBar": 300}` |
| `entered_hazard_zone_without_ppe` | Responder crosses Hot Zone boundary before completing PPE donning. | `{"zone": "HOT", "initialViolation": true}` |
| `leak_source_identified` | Responder points PID detector at drum breach. | `{"correct": true, "ppm": 4820.5, "drumId": "drum_03"}` |
| `civilian_evacuated` | Responder leads or extracts civilian to Warm Zone. | `{"casualtyId": "civ_01", "state": "AMBULATORY", "count": 1}` |
| `containment_completed` | Magnetic patch applied and clamp tightened on leak. | `{"clampTorque": "100%", "durationSec": 12.4}` |
| `decontamination_completed`| Responder executes full washdown cycle in Decon Station. | `{"dwellSeconds": 15.0, "cleanExit": true}` |
| `gas_concentration_sampled`| Periodic ambient detector reading. | `{"ppm": 1250.0, "x": 12.4, "z": -4.2}` |
| `scba_low_air_warning` | Cylinder pressure drops below 50 Bar. | `{"remainingPressureBar": 48.0}` |
| `session_voided` | Instructor aborts drill due to technical or safety reset. | `{"reason": "Drill aborted", "voidedBy": "admin"}` |

### 2.3 `Mission` / `Scenario` (Disaster Definition Contract)
* **Schema Definition:** [`docs/schemas/Mission.schema.json`](file:///c:/Users/lohit/OneDrive/Desktop/CBRS-X/docs/schemas/Mission.schema.json)
* **Java Entity:** `com.cbrsx.backend.entity.Scenario`

```json
{
  "scenarioId": "scen-chem-01",
  "code": "CBRN-CHEM-01",
  "title": "Chemical Spill Emergency Response",
  "description": "Industrial Chemical Leak Incident at Storage Bay 3. Respond with full CBRN protocol: PPE, Hazard Detection, Civilian Evacuation, Containment, Decontamination.",
  "maxScore": 100
}
```

### 2.4 `ScoreResult` (Deterministic Evaluation Contract)
* **Schema Definition:** [`docs/schemas/ScoreResult.schema.json`](file:///c:/Users/lohit/OneDrive/Desktop/CBRS-X/docs/schemas/ScoreResult.schema.json)
* **Java DTO:** `com.cbrsx.backend.dto.ScoreReportDTO`

```json
{
  "sessionId": "sess-f4a7c891e23",
  "traineeName": "Inspector Lohith R C",
  "batchUnit": "10th NDRF Battalion",
  "scenarioCode": "CBRN-CHEM-01",
  "scenarioTitle": "Chemical Spill Emergency Response",
  "totalDurationSeconds": 142,
  "finalScore": 95,
  "passStatus": "PASSED",
  "passed": true,
  "breakdown": {
    "ppeScore": 10,
    "detectionScore": 10,
    "evacuationScore": 15,
    "containmentScore": 15,
    "decontaminationScore": 10,
    "timeBonusScore": 20,
    "totalPenalties": 0,
    "netScore": 80
  },
  "mistakes": [],
  "recommendations": [
    "Excellent response! Full compliance with NDRF Chemical Disaster Standard Operating Procedure."
  ]
}
```

---

## ⚡ 3. STOMP WebSocket Message Protocol

### 3.1 Connection Handshake
* **Endpoint:** `ws://localhost:8080/ws-telemetry` (or `wss://domain/ws-telemetry`)
* **Transport:** Native WebSocket / SockJS fallback
* **Heartbeat:** `4000ms` Incoming / `4000ms` Outgoing

### 3.2 Broadcast Topic Catalog

| STOMP Topic | Publishing Source | Payload Type | Description |
|---|---|---|---|
| `/topic/events` | Spring Boot `EventController` | `SessionEvent` JSON | Broadcasts every raw telemetry event in real time to Instructor Command Radar. |
| `/topic/sessions` | Spring Boot `SessionService` | `SessionSummaryDTO` JSON | Broadcasts session lifecycle transitions (`STARTED`, `COMPLETED`, `VOIDED`). |
| `/topic/sessions/{sessionId}` | Spring Boot `SessionService` | `ScoreReportDTO` JSON | Scoped stream delivering individual evaluation results directly to the trainee terminal. |
| `/user/queue/errors` | Spring Boot Exception Handler | `ValidationErrorDTO` JSON | Direct user queue for malformed telemetry or authentication rejections. |

---

## 🌐 4. REST API Endpoint Specifications

| HTTP Verb | Path | Request Body | Response Schema | Permitted Roles |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `LoginRequest` | `AuthResponse` | `Public (Rate Limited)` |
| `GET` | `/api/auth/csrf` | *None* | `{"token": "..."}` | `Public` |
| `POST` | `/api/sessions/start` | `StartSessionRequest` | `StartSessionResponse` | `ROLE_SIMULATION`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `POST` | `/api/events/log` | `LogEventRequest` | `LogEventResponse` | `ROLE_SIMULATION`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `POST` | `/api/sessions/{id}/complete` | *None* | `ScoreReportDTO` | `ROLE_SIMULATION`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `POST` | `/api/sessions/{id}/void` | `{"reason": "..."}` | `TrainingSession` | `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `GET` | `/api/sessions` | *Query Params* | `PagedSessionsDTO` | `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `GET` | `/api/sessions/export` | *Query Params* | `text/csv` Stream | `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `GET` | `/api/sessions/{id}/report` | *None* | `ScoreReportDTO` | `ROLE_TRAINEE (Owner)`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `GET` | `/api/sessions/{id}/events` | *None* | `List<EventTimelineEntry>` | `ROLE_TRAINEE (Owner)`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `GET` | `/api/sessions/{id}/debrief` | *None* | `DebriefReportDTO` | `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `GET` | `/api/sessions/{id}/certificate` | *None* | `application/pdf` | `ROLE_TRAINEE (Owner)`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |
| `GET` | `/api/dashboard/stats` | *None* | `DashboardStatsDTO` | `ROLE_INSTRUCTOR`, `ROLE_ADMIN` |

---

## 🗄️ 5. Database Relational Topology & Cascades

```
[ trainees ] (1)
    └── ON DELETE CASCADE ──> [ sessions ] (N)
                                  ├── ON DELETE CASCADE ──> [ events ] (N)
                                  └── ON DELETE RESTRICT <── [ scenarios ] (1)
```

1. **`trainees ➔ sessions` (1:N):** Deleting a trainee cascades to delete all associated session records and certificates.
2. **`sessions ➔ events` (1:N):** Deleting a session automatically removes all associated telemetry event rows.
3. **`scenarios ➔ sessions` (1:N):** Deleting an active scenario is restricted (`ON DELETE RESTRICT`) to preserve historical audit integrity.

---

## 🐳 6. 1-Click Docker Compose Deployment

```bash
# 1. Clone repository
git clone https://github.com/Lohith-RC/CBRN-X.git
cd CBRN-X

# 2. Copy environment template
cp .env.example .env

# 3. Launch full stack with a single command
docker compose up -d --build

# 4. Verify running services
docker compose ps
```

### Port Map Matrix
* `http://localhost:80` ➔ Nginx Central Gateway & Instructor Command Dashboard
* `http://localhost:3000` ➔ Direct Instructor React Dashboard
* `http://localhost:5000` ➔ Trainee 3D WebGL Simulation Station
* `http://localhost:8080` ➔ Spring Boot Core REST API & STOMP WebSocket
* `localhost:5432` ➔ PostgreSQL 15 Database
