# CBRS-X Engineering Workflow Management & PR Governance Policy

## 1. Executive Summary
This document defines the formal software engineering workflow, task lifecycle tracking protocol, and Pull Request (PR) governance policies for the **CBRS-X Command Dashboard & 3D Telemetry Platform**. Compliance with these guidelines ensures code maintainability, architectural consistency, high reliability, and strict bundle size enforcement (< 200 KB entry JS).

---

## 2. Sprint Task Lifecycle Tracking

All engineering deliverables are tracked across a structured 5-stage sprint lifecycle:

```
┌──────────┐     ┌─────────────┐     ┌─────────────────┐     ┌──────────────┐     ┌────────────┐
│ 1. BACKLOG│ ──► │2. IN PROGRESS│ ──► │3. CODE REVIEW   │ ──► │4. QA & STAGE │ ──► │5. RELEASED │
│          │     │ (Feature Branch)  │  (Pull Request) │     │ (Staging Env)│     │(Production)│
└──────────┘     └─────────────┘     └─────────────────┘     └──────────────┘     └────────────┘
```

### Stage Definitions & Guidelines

1. **Backlog & Sprint Grooming:**
   - Tasks are estimated using Fibonacci story points (1, 2, 3, 5, 8).
   - Acceptance criteria must be documented prior to moving a story into `In Progress`.

2. **In Progress (Feature/Fix Branch):**
   - Developers must create a dedicated branch off `main` following strict naming conventions:
     - Feature branches: `feature/cbrn-<issue_number>-<short-description>`
     - Bug fixes: `fix/cbrn-<issue_number>-<short-description>`
     - Performance refactors: `perf/cbrn-<issue_number>-<short-description>`
   - Example: `feature/cbrn-102-3d-ghost-replay`

3. **Code Review & Automated CI Check:**
   - Once implementation and local unit testing are complete, open a Pull Request targeting `main`.
   - PR titles must include the issue key: `[CBRN-102] Implement Three.js Storage Bay 03 Ghost Avatars`.

4. **QA & Staging Deployment:**
   - Approved PRs are merged into `main` and automatically built and deployed to the staging environment.
   - Domain testers verify 3D WebGL rendering performance (60 FPS target) and WebSockets telemetry stability.

5. **Production Release:**
   - Bi-weekly tagged release tags (`v1.x.x`) promoted to production after passing final sign-off.

---

## 3. PR Policy & Architectural Governance Enforcement

To prevent architectural drift, bundle size inflation, and broken builds, all Pull Requests must adhere to the following mandatory enforcement policies:

### Policy Controls & Mandatory Gateways

| Policy Check | Requirement | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Peer Approvals** | Minimum **2 code review approvals** (1 Lead Architect + 1 Domain Engineer). | GitHub / GitLab PR Branch Protection Rules |
| **Bundle Size Budget** | Initial JavaScript entry bundle MUST NOT exceed **200 KB** (gzipped/minified). | Automated CI Vite Build Audit (`npm run build`) |
| **Unit Test Coverage** | 100% pass rate on all unit tests with mandatory coverage check. | Vitest CI Workflow (`npm run test`) |
| **Code Splitting** | Heavy libraries (`three`, `recharts`, `lucide`, `@stomp/stompjs`) must be manually chunked. | Vite `manualChunks` config verification |
| **Lazy Loading** | Route-level panels and 3D viewports must use `React.lazy()` + `<Suspense>`. | Architectural Code Review Checklist |
| **Lint & Quality** | Zero static analysis errors or unhandled promises. | ESLint & Prettier automated checks |

### PR Review Checklist for Reviewers

- [ ] **Bundle Audit:** Does this PR introduce dependencies that bloat the entry chunk?
- [ ] **Component Scoping:** Are Three.js WebGL resources properly disposed of in `useEffect` cleanup return functions to prevent WebGL context loss and memory leaks?
- [ ] **Accessibility & Fallbacks:** Are `<Suspense>` boundaries and screen-reader `aria-live` regions provided for live telemetry alerts?
- [ ] **State Integrity:** Are state mutations properly isolated without modifying global objects directly?

---

## 4. Architectural Standards for 3D & Telemetry Modules

1. **Three.js Resource Management:**
   - Geometries, materials, textures, and renderers created within components MUST be tracked and explicit `.dispose()` calls executed on unmount.
2. **Telemetry Data Stream Decoupling:**
   - Scrubber timeline logic in `MissionReplayControls.jsx` must remain decoupled from rendering components, passing immutable state props or subscribing to event hooks.
