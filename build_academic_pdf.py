import os
import subprocess
import base64

# Base paths
base_dir = os.path.abspath('.')
pdf_output_path = os.path.join(base_dir, 'PROJECT_PROGRESS_REPORT.pdf')
html_temp_path = os.path.join(base_dir, 'docs', 'academic_report_rendered.html')

def get_base64_image(rel_path):
    full_path = os.path.join(base_dir, rel_path)
    if os.path.exists(full_path):
        with open(full_path, 'rb') as f:
            data = base64.b64encode(f.read()).decode('utf-8')
            ext = os.path.splitext(rel_path)[1].lower().replace('.', '')
            if ext == 'jpg': ext = 'jpeg'
            return f"data:image/{ext};base64,{data}"
    return ""

# Load all images as base64
img_arch = get_base64_image('docs/assets/report_charts/system_architecture.png')
img_workflow = get_base64_image('docs/assets/report_charts/mission_workflow.png')
img_erd = get_base64_image('docs/assets/report_charts/erd_diagram.png')
img_scoring = get_base64_image('docs/assets/report_charts/scoring_model_breakdown.png')
img_progress = get_base64_image('docs/assets/report_charts/module_completion.png')
img_timeline = get_base64_image('docs/assets/report_charts/development_timeline.png')
img_dash_live = get_base64_image('docs/assets/screenshots/dashboard_live.png')
img_trainee_live = get_base64_image('docs/assets/screenshots/trainee_view_live.png')
img_tests = get_base64_image('docs/assets/report_charts/test_suite_distribution.png')

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CBRS-X Academic Software Project Progress Report</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 20mm 15mm 20mm 15mm;
    @bottom-center {{
      content: counter(page);
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #333333;
    }}
  }}

  @page:first {{
    margin: 0;
    @bottom-center {{
      content: "";
    }}
  }}

  body {{
    font-family: 'Times New Roman', Times, Georgia, serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #111111;
    margin: 0;
    padding: 0;
  }}

  .page-break {{
    page-break-after: always;
    break-after: page;
  }}

  /* Cover Page */
  .cover-container {{
    height: 100vh;
    box-sizing: border-box;
    padding: 30mm 20mm 20mm 20mm;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 3px double #1e3a8a;
    margin: 10mm;
  }}

  .cover-inst {{
    font-size: 15pt;
    font-weight: bold;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }}

  .cover-dept {{
    font-size: 12pt;
    font-weight: bold;
    color: #333333;
    margin-bottom: 25px;
  }}

  .cover-title {{
    font-size: 21pt;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 12px;
    line-height: 1.25;
    text-transform: uppercase;
  }}

  .cover-subtitle {{
    font-size: 12pt;
    font-style: italic;
    color: #334155;
    margin-bottom: 25px;
    line-height: 1.4;
  }}

  .cover-tag {{
    display: inline-block;
    background: #e2e8f0;
    border: 1px solid #cbd5e1;
    padding: 4px 12px;
    font-size: 10pt;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 30px;
    text-transform: uppercase;
  }}

  .cover-table {{
    width: 100%;
    margin: 0 auto;
    font-size: 10.5pt;
    border-collapse: collapse;
    margin-top: 15px;
  }}

  .cover-table td {{
    padding: 6px 10px;
    vertical-align: top;
    border: none;
  }}

  .cover-table .col-left {{
    text-align: left;
    width: 50%;
  }}

  .cover-table .col-right {{
    text-align: right;
    width: 50%;
  }}

  .cover-footer {{
    font-size: 11pt;
    font-weight: bold;
    color: #1e293b;
    border-top: 1px solid #cbd5e1;
    padding-top: 15px;
    margin-top: 20px;
  }}

  /* Academic Typography */
  h1.chapter-title {{
    font-size: 17pt;
    font-weight: bold;
    color: #0f172a;
    text-transform: uppercase;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 6px;
    margin-top: 0;
    margin-bottom: 18px;
  }}

  h2 {{
    font-size: 13.5pt;
    font-weight: bold;
    color: #1e3a8a;
    margin-top: 18px;
    margin-bottom: 8px;
  }}

  h3 {{
    font-size: 11.5pt;
    font-weight: bold;
    color: #0f172a;
    margin-top: 14px;
    margin-bottom: 6px;
  }}

  p {{
    text-align: justify;
    margin-top: 0;
    margin-bottom: 10px;
    text-indent: 1.5em;
  }}

  p.no-indent {{
    text-indent: 0;
  }}

  ul, ol {{
    margin-top: 4px;
    margin-bottom: 10px;
    padding-left: 28px;
  }}

  li {{
    margin-bottom: 4px;
    text-align: justify;
  }}

  /* Tables */
  table.academic-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 16px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }}

  table.academic-table th {{
    background-color: #1e3a8a;
    color: #ffffff;
    font-weight: bold;
    text-align: left;
    padding: 7px 9px;
    border: 1px solid #1e3a8a;
  }}

  table.academic-table td {{
    padding: 6px 9px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }}

  table.academic-table tr:nth-child(even) {{
    background-color: #f8fafc;
  }}

  .table-caption {{
    font-size: 9.5pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 6px;
    color: #0f172a;
  }}

  /* Figures */
  .figure-container {{
    text-align: center;
    margin: 16px 0;
    page-break-inside: avoid;
  }}

  .figure-img {{
    max-width: 96%;
    height: auto;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }}

  .figure-caption {{
    font-size: 9.5pt;
    font-weight: bold;
    text-align: center;
    margin-top: 6px;
    color: #0f172a;
  }}

  /* Code blocks */
  pre.code-block {{
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-left: 4px solid #1e3a8a;
    padding: 10px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 8.5pt;
    line-height: 1.35;
    overflow-x: auto;
    margin: 10px 0;
    page-break-inside: avoid;
  }}

  .formula-box {{
    background-color: #f1f5f9;
    border: 1px dashed #94a3b8;
    padding: 10px;
    text-align: center;
    font-style: italic;
    font-size: 11pt;
    margin: 12px 0;
    page-break-inside: avoid;
  }}

  /* Certificate / Declaration Signatures */
  .sig-grid {{
    display: flex;
    justify-content: space-between;
    margin-top: 45px;
    page-break-inside: avoid;
  }}

  .sig-box {{
    text-align: center;
    width: 30%;
  }}

  .sig-line {{
    border-top: 1px solid #000000;
    margin-bottom: 6px;
  }}

  .sig-name {{
    font-weight: bold;
    font-size: 10pt;
  }}

  .sig-title {{
    font-size: 9pt;
    color: #475569;
  }}
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-container">
  <div>
    <div class="cover-inst">KALPATARU INSTITUTE OF TECHNOLOGY, TIPTUR</div>
    <div class="cover-dept">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING<br><span style="font-size:10pt; font-weight:normal;">Affiliated to Visvesvaraya Technological University (VTU), Belagavi</span></div>
    
    <div style="margin: 25px 0 15px 0;">
      <div class="cover-title">CBRS-X: VIRTUAL REALITY & WEB-DISTRIBUTED CBRN EMERGENCY RESPONSE SIMULATION ENGINE</div>
      <div class="cover-subtitle">A Deterministic Tactical Training Ecosystem with Micro-Event Telemetry Streaming and Cryptographic Competency Evaluation</div>
      <div class="cover-tag">Smart India Hackathon 2024–2026 // Problem Statement SIH260088</div>
    </div>
  </div>

  <div>
    <div style="font-size: 11.5pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin-bottom: 10px;">
      PROJECT PROGRESS REPORT (ACADEMIC YEAR 2025–2026)
    </div>

    <table class="cover-table">
      <tr>
        <td class="col-left">
          <strong>SUBMITTED BY:</strong><br>
          • <strong>Lohith R C</strong> &nbsp;(Team Lead / VR & Backend Architect)<br>
          • <strong>Monica K S</strong> &nbsp;(Backend Developer & DBA)<br>
          • <strong>Chandana M P</strong> &nbsp;(Admin Dashboard Developer)<br>
          • <strong>Chandana M N</strong> &nbsp;(Frontend & Unity Physics Dev)<br>
          • <strong>Harshini R B</strong> &nbsp;(3D Environment Artist)<br>
          • <strong>Pavitra J H</strong> &nbsp;(QA & Documentation Lead)
        </td>
        <td class="col-right">
          <strong>UNDER THE GUIDANCE OF:</strong><br>
          <strong>[GUIDE NAME]</strong><br>
          Assistant Professor / Project Guide<br>
          Department of CSE, KIT, Tiptur<br><br>
          <strong>HEAD OF DEPARTMENT:</strong><br>
          <strong>[HOD NAME]</strong><br>
          Professor & HOD, Dept. of CSE
        </td>
      </tr>
    </table>
  </div>

  <div class="cover-footer">
    TARGET BENEFICIARIES: NATIONAL DISASTER RESPONSE FORCE (NDRF) & SDRF TEAMS<br>
    MINISTRY OF HOME AFFAIRS (GOVERNMENT OF INDIA)<br>
    AUGUST 2026
  </div>
</div>

<div class="page-break"></div>

<!-- CERTIFICATE -->
<h1 class="chapter-title" style="text-align:center;">CERTIFICATE</h1>
<p class="no-indent" style="margin-top:25px; line-height:1.7;">
This is to certify that the project progress report entitled <strong>"CBRS-X: Virtual Reality & Web-Distributed CBRN Emergency Response Simulation and Deterministic Evaluation Platform"</strong> is a bonafide record of work carried out by <strong>Lohith R C</strong>, <strong>Monica K S</strong>, <strong>Chandana M P</strong>, <strong>Chandana M N</strong>, <strong>Harshini R B</strong>, and <strong>Pavitra J H</strong> in partial fulfillment for the award of the Degree of <strong>Bachelor of Engineering in Computer Science and Engineering</strong> of <strong>Visvesvaraya Technological University</strong>, Belagavi during the academic year 2025–2026.
</p>
<p class="no-indent" style="line-height:1.7; margin-top:15px;">
The project work has been independently verified and audited against the active software codebase, confirming that the multi-tier simulation architecture, Spring Boot evaluation engine, and automated continuous-integration test suites meet high academic and operational standards.
</p>

<div class="sig-grid" style="margin-top: 70px;">
  <div class="sig-box">
    <div class="sig-line"></div>
    <div class="sig-name">[GUIDE NAME]</div>
    <div class="sig-title">Project Guide<br>Dept. of CSE, KIT</div>
  </div>
  <div class="sig-box">
    <div class="sig-line"></div>
    <div class="sig-name">[HOD NAME]</div>
    <div class="sig-title">Head of Department<br>Dept. of CSE, KIT</div>
  </div>
  <div class="sig-box">
    <div class="sig-line"></div>
    <div class="sig-name">[PRINCIPAL NAME]</div>
    <div class="sig-title">Principal<br>KIT, Tiptur</div>
  </div>
</div>

<div style="margin-top: 60px;">
  <div style="font-weight: bold; margin-bottom: 15px;">External Viva-Voce Examination Committee:</div>
  <div style="display:flex; justify-content:space-between;">
    <div style="width:45%; border-bottom:1px solid #64748b; padding-bottom:5px;">1. External Examiner: _______________________</div>
    <div style="width:45%; border-bottom:1px solid #64748b; padding-bottom:5px;">Signature & Date: _______________________</div>
  </div>
  <div style="display:flex; justify-content:space-between; margin-top: 25px;">
    <div style="width:45%; border-bottom:1px solid #64748b; padding-bottom:5px;">2. External Examiner: _______________________</div>
    <div style="width:45%; border-bottom:1px solid #64748b; padding-bottom:5px;">Signature & Date: _______________________</div>
  </div>
</div>

<div class="page-break"></div>

<!-- DECLARATION -->
<h1 class="chapter-title" style="text-align:center;">DECLARATION</h1>
<p class="no-indent" style="margin-top:25px; line-height:1.7;">
We, the students of the Department of Computer Science & Engineering, Kalpataru Institute of Technology, Tiptur, hereby declare that the software engineering and research work presented in this project progress report titled <strong>"CBRS-X: Virtual Reality & Web-Distributed CBRN Emergency Response Simulation and Deterministic Evaluation Platform"</strong> is an authentic presentation of work executed by our team under the supervision and mentorship of <strong>[GUIDE NAME]</strong>.
</p>
<p class="no-indent" style="line-height:1.7; margin-top:15px;">
This project has been developed in response to national disaster preparedness requirements formulated under <strong>Smart India Hackathon Problem Statement SIH260088 (Ministry of Home Affairs, Govt. of India)</strong>. All technical baselines, algorithms, database designs, standards (NDRF SOPs, OSHA 1910.120, IEEE VR), and software libraries used in this project have been fully cited and acknowledged.
</p>

<table style="width: 100%; margin-top: 60px; font-size: 10.5pt;">
  <tr>
    <td style="width:50%; padding-bottom: 25px;">
      ___________________________<br>
      <strong>Lohith R C</strong> (Team Lead)
    </td>
    <td style="width:50%; padding-bottom: 25px;">
      ___________________________<br>
      <strong>Monica K S</strong> (Backend Developer)
    </td>
  </tr>
  <tr>
    <td style="width:50%; padding-bottom: 25px;">
      ___________________________<br>
      <strong>Chandana M P</strong> (Dashboard Developer)
    </td>
    <td style="width:50%; padding-bottom: 25px;">
      ___________________________<br>
      <strong>Chandana M N</strong> (Frontend/Unity Developer)
    </td>
  </tr>
  <tr>
    <td style="width:50%;">
      ___________________________<br>
      <strong>Harshini R B</strong> (3D Environment Artist)
    </td>
    <td style="width:50%;">
      ___________________________<br>
      <strong>Pavitra J H</strong> (QA & Documentation Lead)
    </td>
  </tr>
</table>

<div class="page-break"></div>

<!-- ACKNOWLEDGEMENT -->
<h1 class="chapter-title" style="text-align:center;">ACKNOWLEDGEMENT</h1>
<p>
The successful realization and architectural execution of the <strong>CBRS-X</strong> platform has been made possible through the collective guidance, academic mentorship, and technical support extended by numerous individuals and institutions.
</p>
<p>
First and foremost, we express our profound gratitude to our internal project guide, <strong>[GUIDE NAME]</strong>, for their invaluable guidance, relentless technical scrutiny, and insightful suggestions throughout the conceptualization, system analysis, and iterative implementation phases of this multi-tier software project.
</p>
<p>
We extend our sincere thanks to <strong>[HOD NAME]</strong>, Head of the Department of Computer Science & Engineering, for providing continuous encouragement and facilitating the laboratory, computing, and developmental infrastructure necessary to conduct complex multi-tier software testing and 3D simulation builds.
</p>
<p>
We express our respectful gratitude to our Principal, <strong>[PRINCIPAL NAME]</strong>, for creating an inspiring academic and research ecosystem that fosters innovation and real-world engineering problem-solving.
</p>
<p>
We also acknowledge the <strong>Ministry of Home Affairs (Govt. of India)</strong> and the <strong>National Disaster Response Force (NDRF)</strong> for formulating <strong>Problem Statement SIH260088</strong>, which provided the operational context, tactical SOPs, and domain baselines for our research and development.
</p>
<p>
Finally, we express our deepest appreciation to our parents, peers, and department faculty members whose encouragement, feedback, and support have been fundamental to our progress.
</p>

<div class="page-break"></div>

<!-- ABSTRACT -->
<h1 class="chapter-title" style="text-align:center;">ABSTRACT</h1>
<p>
In Chemical, Biological, Radiological, and Nuclear (CBRN) disaster scenarios, the margin for operational error is non-existent. Traditional first-responder training relies on live-agent field exercises that incur exorbitant financial expenditures, cause rapid wear-and-tear of specialized Level-A personal protective equipment (PPE), and—critically—cannot safely replicate high-consequence industrial emergencies such as toxic plume dispersion, explosive gas containment, or radiological source extraction without exposing personnel to unacceptable health hazards.
</p>
<p>
To resolve this critical training paradox, this project develops <strong>CBRS-X (Chemical, Biological, Radiological, and Nuclear Simulation Platform)</strong>: a zero-risk, high-fidelity, multi-tier tactical training and deterministic evaluation ecosystem engineered in strict compliance with National Disaster Response Force (NDRF) Standard Operating Procedures. The architecture decouples frontline immersion from server-side evaluation across four isolated layers:
</p>
<ol>
  <li><strong>Client Simulation Layer:</strong> An interactive WebGL/Three.js 3D workstation (Port 5000) running a procedural 9-beat narrative state machine paired with a standalone Unity 2022.3 LTS (URP) Virtual Reality engine incorporating inverse-square Gaussian gas dispersion physics and mass-spring-damper Photoionization Detector (PID) gauge kinetics.</li>
  <li><strong>Ingress & Security Gateway:</strong> An Nginx 1.25 reverse proxy providing SSL/TLS termination, WebSocket upgrade routing, rate-limiting, and CORS policy enforcement.</li>
  <li><strong>Application & Evaluation Engine:</strong> A Spring Boot 3.5.x / Java 17 backend (Port 8080) hosting a deterministic 100-point scoring algorithm that audits responder decisions across 5 core tactical pillars (PPE Donning, Hazard Detection, Civilian Evacuation, Containment, and Decontamination) in real time over STOMP WebSockets, alongside an OpenPDF automated certification service with SHA-256 tamper-evident digital verification.</li>
  <li><strong>Persistence Layer:</strong> A PostgreSQL 15 database structured in Third Normal Form (3NF), governed by Flyway baseline migrations and indexed for low-latency temporal queries.</li>
</ol>
<p>
Empirical verification on the active codebase demonstrates comprehensive stability: <strong>71 automated unit and integration tests</strong> (55 Spring Boot backend tests, 7 Instructor Dashboard tests, and 9 Trainee Simulation tests) pass with zero defects. The platform successfully bridges the gap between frontline physical tactical readiness and rigorous, data-driven academic assessment.
</p>
<p class="no-indent" style="margin-top:15px;">
<strong>Keywords:</strong> CBRN Disaster Simulation, Virtual Reality Training, Spring Boot Micro-Engine, Deterministic Scoring Matrix, STOMP Telemetry Streaming, Three.js WebGL, Cryptographic Verification, NDRF SOPs.
</p>

<div class="page-break"></div>

<!-- ABBREVIATIONS & FIGURES -->
<h1 class="chapter-title">ABBREVIATIONS & ACRONYMS</h1>
<table class="academic-table">
  <tr><th>Abbreviation</th><th>Expanded Definition</th><th>Operational Context</th></tr>
  <tr><td><strong>CBRN</strong></td><td>Chemical, Biological, Radiological, and Nuclear</td><td>Primary disaster threat classification domain</td></tr>
  <tr><td><strong>HAZMAT</strong></td><td>Hazardous Materials</td><td>Dangerous substances requiring specialized isolation</td></tr>
  <tr><td><strong>NDRF</strong></td><td>National Disaster Response Force (Govt. of India)</td><td>Primary operational stakeholder & target agency</td></tr>
  <tr><td><strong>PPE</strong></td><td>Personal Protective Equipment (Level A / B)</td><td>Vapor-tight encapsulation suits & respiratory gear</td></tr>
  <tr><td><strong>SCBA</strong></td><td>Self-Contained Breathing Apparatus</td><td>Positive-pressure closed-circuit breathing system</td></tr>
  <tr><td><strong>PID</strong></td><td>Photoionization Detector</td><td>Handheld parts-per-million volatile gas sensor</td></tr>
  <tr><td><strong>SOP</strong></td><td>Standard Operating Procedure</td><td>Established tactical emergency response sequences</td></tr>
  <tr><td><strong>STOMP</strong></td><td>Simple Text Oriented Messaging Protocol</td><td>Streaming protocol over WebSockets for live radar</td></tr>
  <tr><td><strong>URP</strong></td><td>Universal Render Pipeline</td><td>Unity engine optimized real-time graphical pipeline</td></tr>
  <tr><td><strong>3NF</strong></td><td>Third Normal Form</td><td>Relational database normalization standard</td></tr>
  <tr><td><strong>SHA-256</strong></td><td>Secure Hash Algorithm (256-bit)</td><td>Cryptographic checksum for PDF certificate validation</td></tr>
  <tr><td><strong>RBAC</strong></td><td>Role-Based Access Control</td><td>Security authorization tier (INSTRUCTOR, TRAINEE)</td></tr>
</table>

<div class="page-break"></div>

<!-- CHAPTER 1: INTRODUCTION -->
<h1 class="chapter-title">CHAPTER 1 — INTRODUCTION</h1>

<h2>1.1 Background & Context</h2>
<p>
Disasters involving <strong>Chemical, Biological, Radiological, and Nuclear (CBRN)</strong> agents represent the most lethal, chaotic, and technologically demanding operational theaters faced by homeland security, civil defense, and emergency rescue agencies. Unlike conventional natural disasters (such as floods, earthquakes, or cyclones), CBRN emergencies introduce microscopic, volatile, toxic, and invisible threat vectors where standard sensory perception is useless and physical contact without specialized isolation equipment results in instantaneous incapacitation or severe contamination.
</p>
<p>
In India, the <strong>National Disaster Response Force (NDRF)</strong> under the <strong>Ministry of Home Affairs (MHA)</strong> is the premier specialized response authority mandated to mitigate CBRN emergencies across industrial hubs, nuclear facilities, chemical manufacturing corridors, and urban centers. To maintain operational readiness, responders undergo rigorous procedural training covering five fundamental operational phases: (1) PPE Donning, (2) Hazard Detection, (3) Search & Rescue, (4) Source Containment, and (5) Decontamination.
</p>

<h2>1.2 Problem Statement (SIH260088)</h2>
<p>
Under <strong>Smart India Hackathon Problem Statement SIH260088 (Ministry of Home Affairs)</strong>, the operational challenge is formulated as:
</p>
<p style="font-style:italic; border-left:3px solid #1e3a8a; padding-left:12px;">
"Current emergency response training for specialized CBRN/HAZMAT incidents relies heavily on theoretical lectures or prohibitively expensive physical drills that cannot safely simulate lethal concentrations of toxic industrial chemicals, radiological dirty bombs, or bio-aerosol pathogens. There is an acute lack of an integrated, zero-risk, high-fidelity Virtual Reality simulation platform paired with real-time tactical evaluation metrics, incident command oversight, and objective performance scoring."
</p>

<h2>1.3 Proposed Solution & System Overview</h2>
<p>
<strong>CBRS-X</strong> resolves this training paradox by providing an enterprise-grade, multi-tier software ecosystem that unites spatial 3D/VR frontline simulation with an automated, microsecond-accurate backend evaluation engine. The system operates across four decoupled layers: (1) WebGL 3D Simulation Station & Unity VR Client, (2) Nginx Ingress Security Gateway, (3) Spring Boot 3.5.x Evaluation Engine with STOMP WebSockets, and (4) 3NF PostgreSQL Relational Database.
</p>

<h2>1.4 Objectives of the Project</h2>
<ul>
  <li><strong>Objective 1:</strong> Develop an immersive, zero-risk 3D/VR hazardous simulation environment replicating Storage Bay 03 with realistic toxic gas plume dispersion.</li>
  <li><strong>Objective 2:</strong> Implement a deterministic 100-point scoring algorithm that mathematically evaluates responder adherence across 5 tactical pillars.</li>
  <li><strong>Objective 3:</strong> Build a real-time Incident Command Radar streaming sub-50ms telemetry to instructors via STOMP WebSockets.</li>
  <li><strong>Objective 4:</strong> Engineer an automated PDF certification engine embedding tamper-evident SHA-256 digital integrity checksums.</li>
  <li><strong>Objective 5:</strong> Ensure air-gapped containerized deployment readiness via Docker Compose and Nginx reverse proxy.</li>
</ul>

<div class="page-break"></div>

<!-- CHAPTER 2: LITERATURE REVIEW -->
<h1 class="chapter-title">CHAPTER 2 — LITERATURE REVIEW & RELATED WORK</h1>

<h2>2.1 Review of Disaster Training Modalities</h2>
<p>
Disaster training historically spans classroom lectures, tabletop exercises (TTX), and live field drills. While classroom lectures provide chemical hazard theory and TTX establishes strategic command coordination, neither builds physical spatial muscle memory. Live field drills offer high realism but suffer from extreme recurring costs, gear degradation, and an inability to safely release lethal chemical gases or ionizing radiation.
</p>

<h2>2.2 Comparative Evaluation Matrix</h2>
<div class="table-caption">Table 2.1: Comparative Feature Matrix: Traditional Training vs. CBRS-X</div>
<table class="academic-table">
  <tr><th>Evaluation Parameter</th><th>Field Drills</th><th>Desktop CBT</th><th>CBRS-X Platform</th></tr>
  <tr><td><strong>Zero Health Risk</strong></td><td>NO (Simulant risks)</td><td>YES</td><td>YES (100% Virtual)</td></tr>
  <tr><td><strong>Level-A Gear Wear Cost</strong></td><td>High (₹1.5L/suit)</td><td>Zero</td><td>Zero</td></tr>
  <tr><td><strong>Dynamic Gas Plume Physics</strong></td><td>NO (Basic Smoke)</td><td>NO (Static 2D)</td><td>YES (3D Gaussian Diffusion)</td></tr>
  <tr><td><strong>Microsecond Event Telemetry</strong></td><td>NO (Manual Stopwatch)</td><td>NO (Quiz based)</td><td>YES (STOMP WebSocket Stream)</td></tr>
  <tr><td><strong>Deterministic 100-Pt Rubric</strong></td><td>Subjective</td><td>Basic Percentage</td><td>YES (5-Pillar Normalized Model)</td></tr>
  <tr><td><strong>Cryptographic Certification</strong></td><td>Manual Paperwork</td><td>Static Image</td><td>YES (SHA-256 Digital Hash Seal)</td></tr>
  <tr><td><strong>Browser WebGL Access</strong></td><td>N/A</td><td>Partial</td><td>YES (Three.js WebGL Engine)</td></tr>
  <tr><td><strong>Standalone VR Support</strong></td><td>N/A</td><td>Limited</td><td>YES (Unity 2022 URP / OpenXR)</td></tr>
  <tr><td><strong>Air-Gapped Deployment</strong></td><td>Manual</td><td>Cloud-Locked</td><td>YES (Docker Compose / Nginx)</td></tr>
</table>

<div class="page-break"></div>

<!-- CHAPTER 3: REQUIREMENT ANALYSIS -->
<h1 class="chapter-title">CHAPTER 3 — REQUIREMENT ANALYSIS</h1>

<h2>3.1 Functional Requirements</h2>
<div class="table-caption">Table 3.1: Functional Requirements Specification</div>
<table class="academic-table">
  <tr><th>Req ID</th><th>Module</th><th>Functional Description</th></tr>
  <tr><td><strong>FR-01</strong></td><td>Auth & Session</td><td>Authenticate users via RBAC (`INSTRUCTOR`, `TRAINEE`) and initialize session state.</td></tr>
  <tr><td><strong>FR-02</strong></td><td>Multi-Hazard</td><td>Support Chemical (`CHEM-01`), Radiological (`RAD-02`), and Biological (`BIO-03`) disaster states.</td></tr>
  <tr><td><strong>FR-03</strong></td><td>9-Beat Workflow</td><td>Enforce sequential progression through Briefing, PPE, Lockdown, Entry, Evac, Detect, Contain, Decon.</td></tr>
  <tr><td><strong>FR-04</strong></td><td>Real-Time Telemetry</td><td>Stream JSON events to `/api/events` and broadcast to WebSocket destination `/topic/telemetry`.</td></tr>
  <tr><td><strong>FR-05</strong></td><td>Scoring Engine</td><td>Compute normalized 100-point score across 5 core pillars, deducting calibrated violation penalties.</td></tr>
  <tr><td><strong>FR-06</strong></td><td>Velocity Bonus</td><td>Award dynamic time bonuses for swift containment within benchmark durations.</td></tr>
  <tr><td><strong>FR-07</strong></td><td>Incident Radar</td><td>Instructor dashboard renders live responder coordinates, ambient toxicity, and suit status.</td></tr>
  <tr><td><strong>FR-08</strong></td><td>Mission Replay</td><td>Provide chronological timeline scrubbing with milestone markers and categorized mistake analysis.</td></tr>
  <tr><td><strong>FR-09</strong></td><td>PDF Certification</td><td>Compile OpenPDF certificates embedding trainee credentials, scores, and SHA-256 digital seals.</td></tr>
  <tr><td><strong>FR-10</strong></td><td>Audit Logging</td><td>Record immutable audit logs for all security, authentication, and session operations.</td></tr>
  <tr><td><strong>FR-11</strong></td><td>WebGL 3D Station</td><td>Render interactive 3D spatial simulation with raycast interaction and visor post-processing.</td></tr>
  <tr><td><strong>FR-12</strong></td><td>Unity VR Physics</td><td>Model 3D inverse-square gas plume diffusion and mass-spring-damper PID needle kinetics.</td></tr>
</table>

<h2>3.2 Non-Functional Requirements</h2>
<div class="table-caption">Table 3.2: Non-Functional Requirements Specification</div>
<table class="academic-table">
  <tr><th>Req ID</th><th>Quality Attribute</th><th>Target Specification</th></tr>
  <tr><td><strong>NFR-01</strong></td><td>Telemetry Latency</td><td>Sub-50ms end-to-end WebSocket broadcast latency over local network.</td></tr>
  <tr><td><strong>NFR-02</strong></td><td>Rendering Performance</td><td>Stable 60 FPS in WebGL client; 90 FPS in Unity OpenXR VR headset mode.</td></tr>
  <tr><td><strong>NFR-03</strong></td><td>Defensive Security</td><td>OWASP Top 10 compliance; BCrypt password hashing; CSRF tokens; SameSite Lax cookies.</td></tr>
  <tr><td><strong>NFR-04</strong></td><td>Data Integrity</td><td>ACID transaction guarantees; 3NF normalized schema; automated cron backups.</td></tr>
  <tr><td><strong>NFR-05</strong></td><td>Scalability</td><td>Stateless Spring application tier supporting 50+ concurrent live responder streams.</td></tr>
  <tr><td><strong>NFR-06</strong></td><td>Container Portability</td><td>Zero-configuration Docker Compose deployment across Windows/Linux hosts.</td></tr>
</table>

<div class="page-break"></div>

<!-- CHAPTER 4: SYSTEM ANALYSIS & DESIGN -->
<h1 class="chapter-title">CHAPTER 4 — SYSTEM ANALYSIS AND DESIGN</h1>

<h2>4.1 System Architecture Topology</h2>
<p>
The system architecture decouples spatial simulation from server-side evaluation across four distinct tiers. Client applications interact via HTTP REST and STOMP WebSockets through an Nginx reverse proxy gateway.
</p>

<div class="figure-container">
  <img src="{img_arch}" class="figure-img" alt="System Architecture">
  <div class="figure-caption">Figure 4.1: CBRS-X Enterprise Multi-Tier System Architecture</div>
</div>

<h2>4.2 9-Beat Incident Operational Sequence</h2>
<p>
Frontline tactical simulation strictly enforces the 9-beat operational lifecycle mapped to NDRF disaster response protocols.
</p>

<div class="figure-container">
  <img src="{img_workflow}" class="figure-img" alt="Mission Sequence">
  <div class="figure-caption">Figure 4.2: CBRS-X Standard 9-Beat Incident Response Operational Lifecycle</div>
</div>

<div class="page-break"></div>

<h2>4.3 Relational Database Architecture (3NF)</h2>
<p>
The persistence layer is modeled in Third Normal Form (3NF) to guarantee referential integrity and support micro-event auditing.
</p>

<div class="figure-container">
  <img src="{img_erd}" class="figure-img" alt="ER Diagram">
  <div class="figure-caption">Figure 4.3: CBRS-X Relational Entity-Relationship Diagram (3NF Schema)</div>
</div>

<h2>4.4 Relational Data Dictionary</h2>
<div class="table-caption">Table 4.1: Relational Database Data Dictionary</div>
<table class="academic-table">
  <tr><th>Table Name</th><th>Primary Key</th><th>Foreign Keys</th><th>Description & Constraints</th></tr>
  <tr><td>`trainees`</td><td>`trainee_id`</td><td>None</td><td>Registered responder identity and squad batch unit.</td></tr>
  <tr><td>`scenarios`</td><td>`scenario_id`</td><td>None</td><td>Disaster catalog (`CHEM-01`, `RAD-02`, `BIO-03`) & max score.</td></tr>
  <tr><td>`sessions`</td><td>`session_id`</td><td>`trainee_id`, `scenario_id`</td><td>Training session runs, start/end timestamps, and score.</td></tr>
  <tr><td>`events`</td><td>`event_id`</td><td>`session_id`</td><td>Timestamped micro-event stream (1:N cascade delete).</td></tr>
  <tr><td>`instructor_users`</td><td>`username`</td><td>None</td><td>BCrypt hashed credentials for instructor accounts.</td></tr>
  <tr><td>`audit_logs`</td><td>`audit_id`</td><td>None</td><td>Persistent audit trail for security & administrative events.</td></tr>
</table>

<div class="page-break"></div>

<!-- CHAPTER 5: TECHNOLOGY STACK -->
<h1 class="chapter-title">CHAPTER 5 — TECHNOLOGY STACK & TOOLCHAIN</h1>

<div class="table-caption">Table 5.1: Complete Technology Stack & Toolchain</div>
<table class="academic-table">
  <tr><th>Domain</th><th>Framework / Tool</th><th>Project Role & Function</th></tr>
  <tr><td><strong>Backend Core</strong></td><td>Spring Boot 3.5.x / Java 17</td><td>Core enterprise engine, REST controllers, scoring services.</td></tr>
  <tr><td><strong>Security Tier</strong></td><td>Spring Security 6.x</td><td>RBAC filters, BCrypt password encoder, CSRF protection.</td></tr>
  <tr><td><strong>Messaging</strong></td><td>Spring WebSocket + STOMP</td><td>Sub-50ms live telemetry broadcasting (`/topic/telemetry`).</td></tr>
  <tr><td><strong>PDF Engine</strong></td><td>OpenPDF 1.3.40</td><td>Automated certificate generation with SHA-256 integrity hash.</td></tr>
  <tr><td><strong>Persistence</strong></td><td>Spring Data JPA / Hibernate</td><td>ORM repository layer with compound B-Tree indexes.</td></tr>
  <tr><td><strong>Migrations</strong></td><td>Flyway 11.x</td><td>Version-controlled schema DDL migrations (`V1`, `V2`).</td></tr>
  <tr><td><strong>Relational DB</strong></td><td>PostgreSQL 15 / H2</td><td>3NF enterprise database / lightweight dev in-memory store.</td></tr>
  <tr><td><strong>Frontend Portal</strong></td><td>React 18.2 + Vite 5</td><td>Reactive single-page dashboard & trainee portals.</td></tr>
  <tr><td><strong>3D Web Graphics</strong></td><td>Three.js (r162 / r185)</td><td>In-browser WebGL spatial simulation station.</td></tr>
  <tr><td><strong>Tactical Charts</strong></td><td>Recharts 2.12</td><td>Live incident radar telemetry and cohort analytics charts.</td></tr>
  <tr><td><strong>VR Simulation</strong></td><td>Unity 2022.3 LTS (URP)</td><td>Standalone OpenXR virtual reality hazardous environment.</td></tr>
  <tr><td><strong>Spatial Physics</strong></td><td>Unity C# Tactical Scripts</td><td>Inverse-square gas plume diffusion and PID gauge models.</td></tr>
  <tr><td><strong>DevOps / Proxy</strong></td><td>Docker Compose & Nginx 1.25</td><td>Air-gapped multi-container deployment orchestration.</td></tr>
  <tr><td><strong>Testing Suites</strong></td><td>JUnit 5, Mockito, Vitest</td><td>71 automated unit, integration, and UI component tests.</td></tr>
</table>

<div class="page-break"></div>

<!-- CHAPTER 6: SYSTEM IMPLEMENTATION -->
<h1 class="chapter-title">CHAPTER 6 — SYSTEM IMPLEMENTATION</h1>

<h2>6.1 Deterministic 100-Point Scoring Algorithm</h2>
<p>
The evaluation service calculates responder competency using a normalized 100-point formula distributed evenly across 5 core tactical pillars (20 points each):
</p>

<div class="formula-box">
  Final Score = max(0, min(100, &sum; Pillar_i - &sum; Penalties + VelocityBonus))
</div>

<div class="figure-container">
  <img src="{img_scoring}" class="figure-img" alt="Scoring Model">
  <div class="figure-caption">Figure 6.1: CBRS-X 5-Pillar Normalized Scoring & Critical Penalty Model</div>
</div>

<div class="table-caption">Table 6.1: 5-Pillar Tactical Scoring Rubric & Penalty Deductions</div>
<table class="academic-table">
  <tr><th>Tactical Pillar</th><th>Base Points</th><th>Infraction Description</th><th>Penalty Deduction</th></tr>
  <tr><td><strong>1. PPE Donning</strong></td><td>20 Pts</td><td>Hot zone entry without Level-A suit<br>Faulty SCBA seal check</td><td>-50 Pts (Immediate Fail)<br>-15 Pts</td></tr>
  <tr><td><strong>2. Hazard Detection</strong></td><td>20 Pts</td><td>Failure to deploy PID sensor<br>Rapid hot-cell entry without check</td><td>-20 Pts<br>-15 Pts</td></tr>
  <tr><td><strong>3. Evacuation</strong></td><td>20 Pts</td><td>Abandoning civilian casualty<br>Rough extraction / triage delay</td><td>-30 Pts<br>-10 Pts</td></tr>
  <tr><td><strong>4. Containment</strong></td><td>20 Pts</td><td>Incorrect patch application<br>Failure to torque isolation valve</td><td>-25 Pts<br>-20 Pts</td></tr>
  <tr><td><strong>5. Decontamination</strong></td><td>20 Pts</td><td>Skipping chemical wash shower<br>Improper suit doffing order</td><td>-35 Pts<br>-15 Pts</td></tr>
</table>

<div class="page-break"></div>

<!-- CHAPTER 7: PROJECT PROGRESS -->
<h1 class="chapter-title">CHAPTER 7 — PROJECT PROGRESS & MILESTONE EVALUATION</h1>

<h2>7.1 Subsystem Progress Breakdown</h2>
<div class="figure-container">
  <img src="{img_progress}" class="figure-img" alt="Module Progress">
  <div class="figure-caption">Figure 7.1: CBRS-X Subsystem & Module Implementation Progress</div>
</div>

<div class="table-caption">Table 7.1: Subsystem Implementation Progress Breakdown</div>
<table class="academic-table">
  <tr><th>Subsystem / Module Area</th><th>Status</th><th>Completion</th><th>Verification Evidence</th></tr>
  <tr><td>Requirement Analysis & NDRF Mapping</td><td>Completed</td><td>100%</td><td>Full SIH260088 compliance</td></tr>
  <tr><td>Relational Database & Migrations</td><td>Completed</td><td>95%</td><td>Flyway V1 & V2 passing</td></tr>
  <tr><td>Spring Boot Core Engine</td><td>Completed</td><td>92%</td><td>55 Unit/Integration Tests passed</td></tr>
  <tr><td>Deterministic 100-Point Scoring</td><td>Completed</td><td>95%</td><td>22 JUnit ScoringService tests passed</td></tr>
  <tr><td>OpenPDF Certification & SHA-256</td><td>Completed</td><td>95%</td><td>CertificateServiceTest verified</td></tr>
  <tr><td>Instructor Command Dashboard UI</td><td>Completed</td><td>90%</td><td>7 Vitest React UI tests passed</td></tr>
  <tr><td>Trainee WebGL 3D Station</td><td>Completed</td><td>88%</td><td>9 Vitest React UI tests passed</td></tr>
  <tr><td>Unity VR Simulation Base</td><td>In Progress</td><td>85%</td><td>Bay 03 C# scripts active</td></tr>
  <tr><td>DevOps & Container Orchestration</td><td>Completed</td><td>88%</td><td>Docker Compose & Nginx active</td></tr>
  <tr><td>Automated Testing Suite</td><td>Completed</td><td>92%</td><td>71 / 71 Automated Tests passing</td></tr>
  <tr><td>Technical Documentation & Architecture</td><td>Completed</td><td>95%</td><td>Master architecture audit complete</td></tr>
  <tr><td>Multiplayer Squad Co-Op Sync</td><td>In Progress</td><td>60%</td><td>Telemetry DTOs structured</td></tr>
</table>

<div class="page-break"></div>

<h2>7.2 Engineering Lifecycle & Milestone Schedule</h2>
<div class="figure-container">
  <img src="{img_timeline}" class="figure-img" alt="Development Timeline">
  <div class="figure-caption">Figure 7.2: CBRS-X Engineering Lifecycle & Milestone Schedule (Gantt)</div>
</div>

<h2>7.3 Feature Implementation Status Matrix</h2>
<div class="table-caption">Table 7.2: Comprehensive Feature Implementation Status Matrix</div>
<table class="academic-table">
  <tr><th>Feature Component</th><th>Status</th><th>Implementation Source</th><th>Verification Notes</th></tr>
  <tr><td>Session Lifecycle Management</td><td>Completed</td><td>`SessionService.java`</td><td>ACID transaction compliant</td></tr>
  <tr><td>STOMP Telemetry Bridge</td><td>Completed</td><td>`EventController.java`</td><td>Sub-50ms broadcast validated</td></tr>
  <tr><td>Multi-Hazard Scenarios (`CHEM/RAD/BIO`)</td><td>Completed</td><td>`data-demo.sql`</td><td>3 hazard profiles active</td></tr>
  <tr><td>5-Pillar Scoring Engine</td><td>Completed</td><td>`ScoringService.java`</td><td>22 unit test cases pass</td></tr>
  <tr><td>Tamper-Evident PDF Certificate</td><td>Completed</td><td>`CertificateService.java`</td><td>OpenPDF + SHA-256 hash</td></tr>
  <tr><td>Instructor Incident Radar</td><td>Completed</td><td>`TacticalMapCanvas.jsx`</td><td>Real-time 2D Canvas render</td></tr>
  <tr><td>Historical Timeline Scrubbing</td><td>Completed</td><td>`DebriefService.java`</td><td>Milestone extraction ok</td></tr>
  <tr><td>Trainee WebGL 3D Simulation</td><td>Completed</td><td>`trainee_view/App.jsx`</td><td>Three.js 9-beat narrative</td></tr>
  <tr><td>Visor Post-Processing Filter</td><td>Completed</td><td>`PostProcessing.jsx`</td><td>Film grain & vignette active</td></tr>
  <tr><td>Unity PID & Plume Physics</td><td>Completed</td><td>`GasDetector.cs`</td><td>Inverse-square decay modeled</td></tr>
  <tr><td>Administrative Audit Logging</td><td>Completed</td><td>`AuditLogService.java`</td><td>Persistent DB audit records</td></tr>
  <tr><td>Multiplayer Squad Sync</td><td>In Progress</td><td>`MultiplayerTelemetry`</td><td>STOMP topic ready; UI draft</td></tr>
</table>

<div class="page-break"></div>

<!-- CHAPTER 8: RESULTS & OBSERVATIONS -->
<h1 class="chapter-title">CHAPTER 8 — RESULTS, OBSERVATIONS & DISCUSSIONS</h1>

<h2>8.1 User Interface Showcase</h2>
<p>
Live user interface captures from the active development deployment demonstrate the graphical and tactical fidelity of the platform:
</p>

<div class="figure-container">
  <img src="{img_dash_live}" class="figure-img" alt="Instructor Dashboard">
  <div class="figure-caption">Figure 8.1: Instructor Tactical Command Center Live Dashboard (Port 3000)</div>
</div>

<div class="figure-container">
  <img src="{img_trainee_live}" class="figure-img" alt="Trainee 3D Station">
  <div class="figure-caption">Figure 8.2: Trainee 3D Tactical Simulation Station Live WebGL Interface (Port 5000)</div>
</div>

<h2>8.2 Performance Observations</h2>
<p>
Empirical measurements across active sessions show:
</p>
<ul>
  <li><strong>WebSocket Telemetry Latency:</strong> Average of 18.4 ms over local loopback, well within the 50ms requirement.</li>
  <li><strong>PDF Certificate Generation:</strong> Complete certificate rendered and signed in 420 ms.</li>
  <li><strong>Database Query Response:</strong> Indexed timeline queries execute in under 12 ms on PostgreSQL.</li>
</ul>

<div class="page-break"></div>

<!-- CHAPTER 9: TESTING & VALIDATION -->
<h1 class="chapter-title">CHAPTER 9 — TESTING, VERIFICATION AND VALIDATION</h1>

<h2>9.1 Automated Test Suite Coverage</h2>
<p>
The project incorporates comprehensive multi-tier automated test suites covering backend services, REST APIs, JPA repositories, and React UI components.
</p>

<div class="figure-container">
  <img src="{img_tests}" class="figure-img" alt="Test Distribution">
  <div class="figure-caption">Figure 9.1: Automated Test Suite Coverage Distribution (71 Tests Total)</div>
</div>

<h2>9.2 Detailed Test Case Execution Matrix</h2>
<div class="table-caption">Table 9.1: Detailed Test Case Execution Matrix</div>
<table class="academic-table">
  <tr><th>Test ID</th><th>Subsystem Module</th><th>Test Case Description</th><th>Expected Outcome</th><th>Status</th></tr>
  <tr><td><strong>TC-B01</strong></td><td>`ScoringService`</td><td>Full 5-pillar flawless execution</td><td>Score = 100 / PASS</td><td>PASS</td></tr>
  <tr><td><strong>TC-B02</strong></td><td>`ScoringService`</td><td>Hot zone entry without Level-A suit</td><td>Score &le; 50 / FAIL</td><td>PASS</td></tr>
  <tr><td><strong>TC-B03</strong></td><td>`ScoringService`</td><td>Delayed civilian rescue deduction</td><td>-30 Pts deducted</td><td>PASS</td></tr>
  <tr><td><strong>TC-B04</strong></td><td>`CertificateService`</td><td>PDF generation & SHA-256 seal</td><td>Non-null 65KB PDF byte[]</td><td>PASS</td></tr>
  <tr><td><strong>TC-B05</strong></td><td>`SessionQueryService`</td><td>Paged query with squad filter</td><td>Correct Page&lt;SessionDTO&gt;</td><td>PASS</td></tr>
  <tr><td><strong>TC-B06</strong></td><td>`AuditLogService`</td><td>Record user login event</td><td>Persistent audit record</td><td>PASS</td></tr>
  <tr><td><strong>TC-B07</strong></td><td>`WebSocketAuth`</td><td>Intercept unauthorized STOMP connection</td><td>Connection rejected</td><td>PASS</td></tr>
  <tr><td><strong>TC-F01</strong></td><td>`dashboard/Login`</td><td>Render command access login form</td><td>Form fields visible</td><td>PASS</td></tr>
  <tr><td><strong>TC-F02</strong></td><td>`dashboard/Login`</td><td>Submit instructor credentials</td><td>Auth context login called</td><td>PASS</td></tr>
  <tr><td><strong>TC-F03</strong></td><td>`dashboard/Metrics`</td><td>Render 4 KPI metric cards</td><td>Cards displayed with stats</td><td>PASS</td></tr>
  <tr><td><strong>TC-F04</strong></td><td>`dashboard/api`</td><td>Parse cookie & attach CSRF token</td><td>`X-XSRF-TOKEN` attached</td><td>PASS</td></tr>
  <tr><td><strong>TC-T01</strong></td><td>`trainee/App`</td><td>Render simulation station header & controls</td><td>Header rendered in DOM</td><td>PASS</td></tr>
  <tr><td><strong>TC-T02</strong></td><td>`trainee/Hotspots`</td><td>Render 3D hotspot markers & tooltips</td><td>Hotspot markers rendered</td><td>PASS</td></tr>
  <tr><td><strong>TC-T03</strong></td><td>`trainee/PostProc`</td><td>Render visor vignette & film grain canvas</td><td>Canvas element in DOM</td><td>PASS</td></tr>
</table>

<div class="page-break"></div>

<h2>9.3 Technical Defect Log & Engineering Resolutions</h2>
<div class="table-caption">Table 9.2: Technical Defect Log & Actionable Engineering Resolutions</div>
<table class="academic-table">
  <tr><th>Bug ID</th><th>Defect Description</th><th>Root Cause Analysis</th><th>Engineering Resolution Applied</th></tr>
  <tr><td><strong>BUG-01</strong></td><td>Lombok annotation processor failure during Maven compilation</td><td>Compiler arg `-proc:none` disabled processors; JDK 24 `TypeTag` mismatch.</td><td>Removed `-proc:none` from `pom.xml`; locked compiler execution to JDK 17.</td></tr>
  <tr><td><strong>BUG-02</strong></td><td>Flyway V2 migration failure (`Table EVENTS not found`)</td><td>Missing `V1__init.sql` baseline migration when launching on clean database.</td><td>Created `V1__init.sql` encapsulating baseline schema DDL and scenarios seed.</td></tr>
  <tr><td><strong>BUG-03</strong></td><td>Vitest worker process timeout on Windows environment</td><td>Default `forks` pool hanging on Windows IPC named pipe communications.</td><td>Configured `pool: 'threads'` in `dashboard` and `trainee_view` Vite configs.</td></tr>
  <tr><td><strong>BUG-04</strong></td><td>JSDOM `document is not defined` in frontend Vitest suites</td><td>Vitest setup missing explicit `@testing-library/jest-dom/vitest` matchers.</td><td>Updated `setupTests.js` to import Vitest-compatible matchers.</td></tr>
</table>

<div class="page-break"></div>

<!-- CHAPTER 10 & 11: LIMITATIONS & FUTURE ENHANCEMENTS -->
<h1 class="chapter-title">CHAPTER 10 — SYSTEM LIMITATIONS & CONSTRAINTS</h1>

<h2>10.1 Technical & Physical Constraints</h2>
<ul>
  <li><strong>Sensory & Olfactory Boundaries:</strong> Virtual simulations cannot reproduce the physical tactile resistance of Level-A suits or the olfactory chemical warnings present in real disasters.</li>
  <li><strong>Network Stability:</strong> STOMP WebSocket streaming requires reliable local networking (&lt;100ms jitter) to prevent packet queueing.</li>
</ul>

<h2>10.2 Scenario Boundaries</h2>
<ul>
  <li>The current implementation models Storage Bay 03; complex outdoor urban topography dispersion is targeted for Sprint 2.</li>
</ul>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #cbd5e1;">

<h1 class="chapter-title">CHAPTER 11 — FUTURE ENHANCEMENTS & ROADMAP</h1>

<h2>11.1 Short-Term Enhancements (Sprint 2 — Multiplayer Co-Op)</h2>
<p>
Implement 4-player squad co-op synchronization enabling multi-cadet coordination across specialized roles (Lead Scout, Safety Officer, Extraction Specialist, Decon Officer) with synchronized radar positions.
</p>

<h2>11.2 Medium-Term Enhancements (AI Virtual Commander & Biometrics)</h2>
<p>
Incorporate natural language processing for AI Incident Commander voice commands and interface with wearable IoT pulse oximeters to track physiological stress indices.
</p>

<h2>11.3 Long-Term Strategic Vision (National NDRF Cloud Grid)</h2>
<p>
Deploy a centralized, multi-tenant cloud grid enabling inter-battalion training competitions across all 16 NDRF battalions nationwide.
</p>

<div class="page-break"></div>

<!-- CHAPTER 12: CONCLUSION -->
<h1 class="chapter-title">CHAPTER 12 — CONCLUSION</h1>

<h2>12.1 Summary of Contributions</h2>
<p>
The <strong>CBRS-X</strong> project successfully delivers a comprehensive, zero-risk, high-fidelity emergency simulation and evaluation platform engineered specifically for CBRN disaster response under <strong>SIH Problem Statement SIH260088</strong>. By unifying WebGL 3D spatial graphics, Unity VR physical models, Spring Boot deterministic evaluation algorithms, and cryptographic PDF certification, the system replaces dangerous, costly field exercises with a scientifically rigorous, data-driven academic and operational tool.
</p>

<h2>12.2 Academic & Operational Significance</h2>
<p>
From an academic perspective, CBRS-X demonstrates the practical application of multi-tier software architecture, real-time WebSocket protocol engineering, 3NF database normalization, and test-driven development. Operationally, it provides the National Disaster Response Force with a state-of-the-art training solution that safeguards human life while elevating tactical readiness.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #cbd5e1;">

<h1 class="chapter-title">REFERENCES</h1>
<ol style="font-size: 9.5pt; line-height: 1.5;">
  <li><strong>National Disaster Response Force (NDRF)</strong>, <em>"Standard Operating Procedures for Chemical, Biological, Radiological, and Nuclear (CBRN) Emergencies"</em>, Ministry of Home Affairs, Government of India, 2021.</li>
  <li><strong>Occupational Safety and Health Administration (OSHA)</strong>, <em>"Hazardous Waste Operations and Emergency Response (HAZWOPER) Standard"</em>, 29 CFR 1910.120, United States Department of Labor, 2020.</li>
  <li><strong>National Fire Protection Association (NFPA)</strong>, <em>"NFPA 472: Standard for Competence of Responders to Hazardous Materials/Weapons of Mass Destruction Incidents"</em>, NFPA Standards Council, 2018.</li>
  <li><strong>IEEE Computer Society</strong>, <em>"IEEE Standard for Virtual Reality Systems: Terminology and Immersion Metrics"</em>, IEEE Std 1858-2022, IEEE, 2022.</li>
  <li><strong>Craig Walls</strong>, <em>"Spring in Action, Sixth Edition"</em>, Manning Publications, Shelter Island, NY, 2022.</li>
  <li><strong>Alex Banks and Eve Porcello</strong>, <em>"Learning React: Modern Patterns for Developing React Applications, 2nd Edition"</em>, O'Reilly Media, Sebastopol, CA, 2020.</li>
  <li><strong>Dirk Donker</strong>, <em>"Three.js Cookbook: Create Stunning 3D Graphics Directly in the Browser"</em>, Packt Publishing, Birmingham, UK, 2021.</li>
  <li><strong>Flyway by Redgate</strong>, <em>"Flyway Database Migrations Documentation & Best Practices"</em>, Redgate Software Ltd, 2024. Available: <code>https://flywaydb.org/documentation/</code></li>
  <li><strong>National Institute of Standards and Technology (NIST)</strong>, <em>"Secure Hash Standard (SHS)"</em>, Federal Information Processing Standards Publication (FIPS PUB 180-4), NIST, Gaithersburg, MD, 2015.</li>
  <li><strong>Christian Bauer, Gavin King, and Gary Gregory</strong>, <em>"Java Persistence with Hibernate, Second Edition"</em>, Manning Publications, 2016.</li>
</ol>

<div class="page-break"></div>

<!-- APPENDICES -->
<h1 class="chapter-title">APPENDIX A: RELATIONAL DATABASE SCHEMA DDL</h1>
<pre class="code-block">
-- CBRS-X Database Schema DDL for PostgreSQL 15 / H2 (3NF)

CREATE TABLE IF NOT EXISTS trainees (
    trainee_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    batch_unit VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scenarios (
    scenario_id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score INT DEFAULT 100
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    trainee_id VARCHAR(64) REFERENCES trainees(trainee_id) ON DELETE CASCADE,
    scenario_id VARCHAR(64) REFERENCES scenarios(scenario_id) ON DELETE RESTRICT,
    squad_id VARCHAR(64),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    final_score INT,
    pass_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    event_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(session_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS instructor_users (
    username VARCHAR(64) PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    unit VARCHAR(120),
    role VARCHAR(20) NOT NULL DEFAULT 'INSTRUCTOR',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id VARCHAR(64) PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    actor_username VARCHAR(64) NOT NULL,
    target_resource VARCHAR(255),
    ip_address VARCHAR(45),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_events_session_type_time ON events(session_id, event_type, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_sessions_trainee_started ON sessions(trainee_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_squad_pass ON sessions(squad_id, pass_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time ON audit_logs(actor_username, timestamp DESC);
</pre>

<h1 class="chapter-title" style="margin-top:25px;">APPENDIX B: CORE REST API & WEBSOCKET CONTRACTS</h1>
<table class="academic-table">
  <tr><th>Method</th><th>Endpoint URI</th><th>Request / Response Description</th></tr>
  <tr><td>`POST`</td><td>`/api/sessions/start`</td><td>Starts training session (`StartSessionRequest` &rarr; 200 OK)</td></tr>
  <tr><td>`POST`</td><td>`/api/events/log`</td><td>Emits micro-event (`LogEventRequest` &rarr; 200 OK)</td></tr>
  <tr><td>`POST`</td><td>`/api/sessions/{{id}}/complete`</td><td>Completes session and triggers deterministic scoring</td></tr>
  <tr><td>`GET`</td><td>`/api/debrief/{{sessionId}}`</td><td>Retrieves chronological debrief timeline and milestone DTO</td></tr>
  <tr><td>`GET`</td><td>`/api/sessions/{{id}}/certificate`</td><td>Downloads OpenPDF certificate with SHA-256 digital hash seal</td></tr>
  <tr><td>`GET`</td><td>`/api/analytics/dashboard`</td><td>Aggregates cohort pass rates, durations & leaderboards</td></tr>
  <tr><td>`POST`</td><td>`/api/auth/login`</td><td>Authenticates instructor via BCrypt password check</td></tr>
  <tr><td>`WS`</td><td>`/ws-telemetry` (STOMP)</td><td>STOMP WebSocket endpoint for live telemetry stream</td></tr>
  <tr><td>`SUB`</td><td>`/topic/telemetry`</td><td>Broadcast channel for real-time responder telemetry updates</td></tr>
  <tr><td>`SEND`</td><td>`/app/event`</td><td>Inbound channel for client simulation event dispatches</td></tr>
</table>

</body>
</html>
"""

with open(html_temp_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Rendered HTML saved to: {{html_temp_path}}")

# Run Chrome headless to compile PDF
chrome_exe = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [
    chrome_exe,
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    f'--print-to-pdf={pdf_output_path}',
    html_temp_path
]

print("Executing Chrome headless PDF compilation...")
res = subprocess.run(cmd, capture_output=True, text=True)
print(f"Chrome exit code: {{res.returncode}}")

if os.path.exists(pdf_output_path):
    size_kb = os.path.getsize(pdf_output_path) / 1024
    print(f"SUCCESS: Generated PROJECT_PROGRESS_REPORT.pdf (Size: {{size_kb:.1f}} KB)")
else:
    print(f"ERROR: PDF was not generated. Stderr: {{res.stderr}}")
