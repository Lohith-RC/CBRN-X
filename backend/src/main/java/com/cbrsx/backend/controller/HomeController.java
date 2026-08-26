package com.cbrsx.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.Map;

/**
 * Root Controller for the CBRS-X Backend.
 * Renders a state-of-the-art Interactive Tactical Developer & Telemetry Operations Portal
 * for browser requests, and structured JSON telemetry for programmatic API consumers.
 */
@RestController
public class HomeController {

    @Value("${spring.application.name:cbrsx-backend}")
    private String appName;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @Value("${cbrsx.api-key:}")
    private String apiKey;

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String getTacticalPortalView() {
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        long hours = uptimeSeconds / 3600;
        long minutes = (uptimeSeconds % 3600) / 60;
        long seconds = uptimeSeconds % 60;
        String uptimeStr = String.format("%02dh %02dm %02ds", hours, minutes, seconds);
        String profileStr = activeProfile != null ? activeProfile.toUpperCase() : "DEV";

        long totalMemory = Runtime.getRuntime().totalMemory() / (1024 * 1024);
        long freeMemory = Runtime.getRuntime().freeMemory() / (1024 * 1024);
        long usedMemory = totalMemory - freeMemory;
        int activeThreads = Thread.activeCount();
        int availableProcessors = Runtime.getRuntime().availableProcessors();

        String template = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CBRS-X Tactical Backend & WebSocket Hub</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
                <script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@7.0.0/bundles/stomp.umd.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
                <style>
                    :root {
                        --bg: #060911;
                        --card-bg: rgba(13, 20, 36, 0.75);
                        --card-border: rgba(59, 130, 246, 0.22);
                        --card-border-hover: rgba(6, 182, 212, 0.55);
                        --accent-blue: #3b82f6;
                        --accent-cyan: #06b6d4;
                        --accent-emerald: #10b981;
                        --accent-amber: #f59e0b;
                        --accent-rose: #f43f5e;
                        --text-main: #f8fafc;
                        --text-muted: #94a3b8;
                        --glow-cyan: rgba(6, 182, 212, 0.25);
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background-color: var(--bg);
                        background-image: 
                            radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.12) 0%, transparent 45%),
                            radial-gradient(circle at 90% 90%, rgba(6, 182, 212, 0.10) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%),
                            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
                        background-size: 100% 100%, 100% 100%, 100% 100%, 48px 48px, 48px 48px;
                        color: var(--text-main);
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        min-height: 100vh;
                        padding: 2.5rem 1.5rem 4rem 1.5rem;
                    }
                    .container { max-width: 1280px; margin: 0 auto; }
                    
                    header {
                        display: flex; justify-content: space-between; align-items: center;
                        border-bottom: 1px solid var(--card-border); padding-bottom: 1.75rem;
                        margin-bottom: 2.25rem; flex-wrap: wrap; gap: 1.25rem;
                    }
                    .brand { display: flex; align-items: center; gap: 1.1rem; }
                    .brand-badge {
                        background: linear-gradient(135deg, #1d4ed8, #0284c7);
                        color: #ffffff; font-weight: 900; font-size: 1.2rem;
                        padding: 0.5rem 1rem; border-radius: 10px;
                        box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
                        letter-spacing: 1.5px; border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    h1 { font-size: 1.85rem; font-weight: 800; letter-spacing: -0.5px; }
                    .subtitle { color: var(--text-muted); font-size: 0.88rem; font-family: 'JetBrains Mono', monospace; margin-top: 0.25rem; }
                    .header-pills { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
                    .live-status {
                        display: flex; align-items: center; gap: 0.65rem;
                        background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4);
                        color: var(--accent-emerald); padding: 0.45rem 1rem; border-radius: 9999px;
                        font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700;
                        letter-spacing: 0.5px;
                    }
                    .pulse {
                        width: 9px; height: 9px; background-color: var(--accent-emerald);
                        border-radius: 50%; box-shadow: 0 0 12px var(--accent-emerald);
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0% { transform: scale(0.95); opacity: 0.8; }
                        50% { transform: scale(1.35); opacity: 1; }
                        100% { transform: scale(0.95); opacity: 0.8; }
                    }
                    
                    /* Grid Stats */
                    .grid-stats {
                        display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 1.25rem; margin-bottom: 2.25rem;
                    }
                    .stat-card {
                        background: var(--card-bg); border: 1px solid var(--card-border);
                        border-radius: 14px; padding: 1.35rem; backdrop-filter: blur(16px);
                        position: relative; overflow: hidden;
                    }
                    .stat-card::after {
                        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
                        background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
                        opacity: 0.6;
                    }
                    .stat-label {
                        color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase;
                        letter-spacing: 1.2px; font-weight: 700;
                    }
                    .stat-value {
                        font-size: 1.45rem; font-weight: 800; margin-top: 0.45rem;
                        font-family: 'JetBrains Mono', monospace; color: #ffffff;
                    }

                    /* Quick Launchers */
                    .quick-actions {
                        display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 1.25rem; margin-bottom: 2.5rem;
                    }
                    .action-card {
                        background: var(--card-bg); border: 1px solid var(--card-border);
                        border-radius: 14px; padding: 1.5rem; transition: all 0.28s ease;
                        text-decoration: none; color: inherit; display: flex; flex-direction: column;
                        justify-content: space-between; backdrop-filter: blur(16px);
                    }
                    .action-card:hover {
                        border-color: var(--accent-cyan); transform: translateY(-4px);
                        box-shadow: 0 14px 30px -6px rgba(6, 182, 212, 0.25);
                    }
                    .action-title { font-size: 1.12rem; font-weight: 800; display: flex; align-items: center; justify-content: space-between; }
                    .action-desc { font-size: 0.85rem; color: var(--text-muted); margin: 0.65rem 0 1.25rem 0; line-height: 1.45; }
                    .btn-action { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--accent-cyan); font-size: 0.85rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

                    /* Dual Column: WebSocket Live Console & API Sandbox */
                    .interactive-grid {
                        display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1.5rem; margin-bottom: 2.5rem;
                    }
                    @media (max-width: 960px) {
                        .interactive-grid { grid-template-columns: 1fr; }
                    }
                    .panel {
                        background: var(--card-bg); border: 1px solid var(--card-border);
                        border-radius: 16px; padding: 1.6rem; backdrop-filter: blur(16px);
                    }
                    .panel-header {
                        display: flex; justify-content: space-between; align-items: center;
                        margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255, 255, 255, 0.06); padding-bottom: 1rem;
                    }
                    .panel-title { font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem; }
                    .panel-badge {
                        font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 700;
                        padding: 0.2rem 0.6rem; border-radius: 6px;
                    }
                    
                    /* WebSocket Terminal */
                    .terminal-box {
                        background: #030712; border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 10px; height: 260px; overflow-y: auto; padding: 0.9rem;
                        font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
                        line-height: 1.6; color: #a5f3fc; margin-bottom: 1rem;
                    }
                    .terminal-box::-webkit-scrollbar { width: 6px; }
                    .terminal-box::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 3px; }
                    .log-entry { margin-bottom: 0.4rem; word-break: break-all; }
                    .log-time { color: var(--text-muted); margin-right: 0.4rem; }
                    .log-success { color: #34d399; }
                    .log-info { color: #60a5fa; }
                    .log-warn { color: #fbbf24; }
                    
                    .btn-group { display: flex; gap: 0.6rem; flex-wrap: wrap; }
                    .btn {
                        background: rgba(30, 58, 138, 0.35); border: 1px solid var(--card-border);
                        color: #ffffff; padding: 0.5rem 0.9rem; border-radius: 8px;
                        font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; font-weight: 600;
                        cursor: pointer; transition: all 0.2s ease;
                    }
                    .btn:hover { background: rgba(59, 130, 246, 0.35); border-color: var(--accent-cyan); color: #a5f3fc; }
                    .btn-primary { background: linear-gradient(135deg, #2563eb, #0284c7); border: none; }
                    .btn-primary:hover { box-shadow: 0 0 15px rgba(37, 99, 235, 0.5); }

                    /* API Sandbox Output */
                    .api-box {
                        background: #030712; border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 10px; height: 260px; overflow-y: auto; padding: 0.9rem;
                        font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
                        color: #cbd5e1; white-space: pre-wrap; margin-bottom: 1rem;
                    }
                    
                    /* Endpoints Table */
                    .section-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.25rem; font-size: 1.25rem; font-weight: 800; }
                    .table-wrapper {
                        background: var(--card-bg); border: 1px solid var(--card-border);
                        border-radius: 16px; overflow-x: auto; backdrop-filter: blur(16px); margin-bottom: 2.5rem;
                    }
                    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left; }
                    th {
                        background: rgba(30, 58, 138, 0.25); padding: 1rem 1.3rem; color: var(--text-muted);
                        font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;
                        border-bottom: 1px solid var(--card-border);
                    }
                    td { padding: 1rem 1.3rem; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
                    tr:last-child td { border-bottom: none; }
                    tr:hover td { background: rgba(255, 255, 255, 0.02); }
                    .badge-method {
                        font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; font-weight: 800;
                        padding: 0.25rem 0.55rem; border-radius: 6px; display: inline-block;
                    }
                    .get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35); }
                    .post { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); }
                    .endpoint-path { font-family: 'JetBrains Mono', monospace; color: #f1f5f9; font-weight: 600; }
                    .badge-role {
                        background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);
                        font-size: 0.72rem; font-family: 'JetBrains Mono', monospace; padding: 0.2rem 0.5rem; border-radius: 6px;
                    }

                    footer {
                        text-align: center; color: var(--text-muted); font-size: 0.84rem;
                        border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 2rem;
                        font-family: 'JetBrains Mono', monospace;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <div class="brand">
                            <span class="brand-badge">CBRS-X</span>
                            <div>
                                <h1>Tactical Backend Engine & Live Stream Hub</h1>
                                <p class="subtitle">Virtual Reality CBRN Simulation, Telemetry & Evaluation Platform</p>
                            </div>
                        </div>
                        <div class="header-pills">
                            <div class="live-status">
                                <div class="pulse"></div>
                                BACKEND ENGINE: ONLINE
                            </div>
                        </div>
                    </header>

                    <!-- System Vitals & Hardware Stats -->
                    <div class="grid-stats">
                        <div class="stat-card">
                            <div class="stat-label">Active Profile</div>
                            <div class="stat-value" style="color: var(--accent-cyan);">{{PROFILE}}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Engine Uptime</div>
                            <div class="stat-value">{{UPTIME}}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">JVM Memory Usage</div>
                            <div class="stat-value" style="color: var(--accent-emerald);">{{USED_MEM}}MB / {{TOTAL_MEM}}MB</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">CPU Cores & Threads</div>
                            <div class="stat-value" style="color: var(--accent-amber);">{{CORES}} Cores / {{THREADS}} Thr</div>
                        </div>
                    </div>

                    <!-- Quick Launchers Grid -->
                    <div class="quick-actions">
                        <a href="/swagger-ui.html" class="action-card" target="_blank">
                            <div>
                                <div class="action-title">
                                    <span>Interactive Swagger UI</span>
                                    <span style="color: var(--accent-cyan);">[API]</span>
                                </div>
                                <p class="action-desc">Explore OpenAPI 3 schemas, test secured endpoints with API keys, and inspect DTO definitions.</p>
                            </div>
                            <span class="btn-action">Launch Swagger UI &rarr;</span>
                        </a>

                        <a href="http://localhost:3000" class="action-card" target="_blank">
                            <div>
                                <div class="action-title">
                                    <span>Instructor Command Center</span>
                                    <span style="color: var(--accent-blue);">[:3000]</span>
                                </div>
                                <p class="action-desc">Live multi-trainee monitoring dashboard with timeline charts, hazard telemetry, and scoring.</p>
                            </div>
                            <span class="btn-action">Open Dashboard &rarr;</span>
                        </a>

                        <a href="http://localhost:5000" class="action-card" target="_blank">
                            <div>
                                <div class="action-title">
                                    <span>Trainee VR Stream View</span>
                                    <span style="color: var(--accent-amber);">[:5000]</span>
                                </div>
                                <p class="action-desc">Panoramic browser trainee view with gas detector readout, containment controls, and HUD.</p>
                            </div>
                            <span class="btn-action">Open Trainee View &rarr;</span>
                        </a>

                        <a href="http://localhost:3000/unity-sim/index.html" class="action-card" target="_blank">
                            <div>
                                <div class="action-title">
                                    <span>Unity WebGL Simulation</span>
                                    <span style="color: var(--accent-emerald);">[3D SIM]</span>
                                </div>
                                <p class="action-desc">Launch the newly compiled 3D Storage Bay 03 hazard scenario directly in your browser.</p>
                            </div>
                            <span class="btn-action">Play 3D Simulation &rarr;</span>
                        </a>
                    </div>

                    <!-- Dual Column: Interactive WebSocket Console & REST Sandbox -->
                    <div class="interactive-grid">
                        <!-- Panel 1: Live WebSocket STOMP Console -->
                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-title">
                                    <span>⚡ Live STOMP WebSocket Console</span>
                                </div>
                                <span id="wsStatusBadge" class="panel-badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);">DISCONNECTED</span>
                            </div>
                            <div id="wsTerminal" class="terminal-box">
                                <div class="log-entry"><span class="log-time">[SYSTEM]</span> Ready to connect to ws://localhost:8080/ws-telemetry</div>
                            </div>
                            <div class="btn-group">
                                <button id="btnWsConnect" class="btn btn-primary" onclick="toggleWebSocket()">Connect STOMP Hub</button>
                                <button class="btn" onclick="sendSimulatedTelemetry('GAS_SPIKE')">Simulate Gas Spike</button>
                                <button class="btn" onclick="sendSimulatedTelemetry('PPE_DON')">Simulate PPE Don</button>
                                <button class="btn" onclick="clearTerminal()">Clear Feed</button>
                            </div>
                        </div>

                        <!-- Panel 2: Interactive REST API Sandbox -->
                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-title">
                                    <span>📡 REST API Live Sandbox</span>
                                </div>
                                <span id="apiStatusBadge" class="panel-badge" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);">READY</span>
                            </div>
                            <div id="apiResponseBox" class="api-box">// Click a request button below to test live endpoints...
{
  "status": "Awaiting API Request..."
}</div>
                            <div class="btn-group">
                                <button class="btn" onclick="executeApiTest('/api/scenarios')">GET /api/scenarios</button>
                                <button class="btn" onclick="executeApiTest('/api/dashboard/stats')">GET /dashboard/stats</button>
                                <button class="btn" onclick="executeApiTest('/actuator/health')">GET /actuator/health</button>
                            </div>
                        </div>
                    </div>

                    <!-- Endpoints Catalog Table -->
                    <div class="section-header">
                        <span>Tactical REST & Telemetry Endpoints Catalog</span>
                    </div>

                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Method</th>
                                    <th>Endpoint Path</th>
                                    <th>Description</th>
                                    <th>Required Access</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span class="badge-method post">POST</span></td>
                                    <td><span class="endpoint-path">/api/sessions/start</span></td>
                                    <td>Initializes a new CBRN VR training attempt and broadcasts start event</td>
                                    <td><span class="badge-role">SIMULATION / ADMIN</span></td>
                                </tr>
                                <tr>
                                    <td><span class="badge-method post">POST</span></td>
                                    <td><span class="endpoint-path">/api/events/log</span></td>
                                    <td>Streams drift-validated telemetry event (PPE, leak scan, evacuation)</td>
                                    <td><span class="badge-role">SIMULATION / ADMIN</span></td>
                                </tr>
                                <tr>
                                    <td><span class="badge-method post">POST</span></td>
                                    <td><span class="endpoint-path">/api/sessions/{id}/complete</span></td>
                                    <td>Finalizes session, calculates score rubric, and persists pass/fail</td>
                                    <td><span class="badge-role">INSTRUCTOR / ADMIN</span></td>
                                </tr>
                                <tr>
                                    <td><span class="badge-method get">GET</span></td>
                                    <td><span class="endpoint-path">/api/sessions/{id}/debrief</span></td>
                                    <td>Generates timeline After-Action Review (AAR) and tactical debrief</td>
                                    <td><span class="badge-role">INSTRUCTOR / ADMIN</span></td>
                                </tr>
                                <tr>
                                    <td><span class="badge-method get">GET</span></td>
                                    <td><span class="endpoint-path">/api/dashboard/stats</span></td>
                                    <td>Aggregates active sessions, average scores, and battalion pass rates</td>
                                    <td><span class="badge-role">INSTRUCTOR / ADMIN</span></td>
                                </tr>
                                <tr>
                                    <td><span class="badge-method get">GET</span></td>
                                    <td><span class="endpoint-path">/api/scenarios</span></td>
                                    <td>Discovers chemical, biological, and radiological disaster scenarios</td>
                                    <td><span class="badge-role">TRAINEE / INSTRUCTOR</span></td>
                                </tr>
                                <tr>
                                    <td><span class="badge-method get">GET</span></td>
                                    <td><span class="endpoint-path">/api/trainees/{id}/certificate</span></td>
                                    <td>Downloads tamper-evident, SHA-256 verified PDF qualification certificate</td>
                                    <td><span class="badge-role">TRAINEE / INSTRUCTOR</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <footer>
                        CBRS-X Tactical Simulation Platform &bull; Spring Boot 3.2.5 &bull; Java 17 &bull; Confidential NDRF System
                    </footer>
                </div>

                <script>
                    let stompClient = null;
                    let isConnected = false;

                    function logTerminal(msg, type = 'info') {
                        const box = document.getElementById('wsTerminal');
                        const time = new Date().toLocaleTimeString();
                        const entry = document.createElement('div');
                        entry.className = 'log-entry';
                        entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${type}">${msg}</span>`;
                        box.appendChild(entry);
                        box.scrollTop = box.scrollHeight;
                    }

                    function clearTerminal() {
                        document.getElementById('wsTerminal').innerHTML = '<div class="log-entry"><span class="log-time">[SYSTEM]</span> Terminal cleared.</div>';
                    }

                    function toggleWebSocket() {
                        if (isConnected) {
                            if (stompClient) stompClient.deactivate();
                            isConnected = false;
                            updateWsUI(false);
                            logTerminal('STOMP WebSocket Disconnected.', 'warn');
                        } else {
                            connectWebSocket();
                        }
                    }

                    function updateWsUI(connected) {
                        const badge = document.getElementById('wsStatusBadge');
                        const btn = document.getElementById('btnWsConnect');
                        if (connected) {
                            badge.textContent = 'CONNECTED (STREAMING)';
                            badge.style.background = 'rgba(16, 185, 129, 0.2)';
                            badge.style.color = '#34d399';
                            badge.style.border = '1px solid rgba(16, 185, 129, 0.4)';
                            btn.textContent = 'Disconnect Hub';
                            btn.className = 'btn';
                        } else {
                            badge.textContent = 'DISCONNECTED';
                            badge.style.background = 'rgba(239, 68, 68, 0.2)';
                            badge.style.color = '#f87171';
                            badge.style.border = '1px solid rgba(239, 68, 68, 0.4)';
                            btn.textContent = 'Connect STOMP Hub';
                            btn.className = 'btn btn-primary';
                        }
                    }

                    function connectWebSocket() {
                        logTerminal('Initiating STOMP WebSocket handshake to /ws-telemetry...', 'info');
                        
                        stompClient = new StompJs.Client({
                            brokerURL: (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws-telemetry',
                            connectHeaders: {
                                'X-API-Key': '{{WS_API_KEY}}'
                            },
                            debug: function (str) {
                                // console.log(str);
                            },
                            reconnectDelay: 5000,
                            heartbeatIncoming: 4000,
                            heartbeatOutgoing: 4000,
                        });

                        stompClient.onConnect = function (frame) {
                            isConnected = true;
                            updateWsUI(true);
                            logTerminal('Connected to STOMP Broker! Subscribing to /topic/events and /topic/sessions...', 'success');
                            
                            stompClient.subscribe('/topic/events', function (message) {
                                logTerminal('📡 INCOMING EVENT: ' + message.body, 'info');
                            });
                            stompClient.subscribe('/topic/sessions', function (message) {
                                logTerminal('🔔 SESSION UPDATE: ' + message.body, 'success');
                            });
                        };

                        stompClient.onStompError = function (frame) {
                            logTerminal('Broker reported error: ' + frame.headers['message'], 'warn');
                            updateWsUI(false);
                        };

                        stompClient.onWebSocketClose = function () {
                            if (isConnected) {
                                isConnected = false;
                                updateWsUI(false);
                                logTerminal('WebSocket connection closed.', 'warn');
                            }
                        };

                        stompClient.activate();
                    }

                    function sendSimulatedTelemetry(type) {
                        if (!isConnected) {
                            logTerminal('Please connect to the STOMP hub first!', 'warn');
                            return;
                        }
                        const payload = type === 'GAS_SPIKE' ? {
                            eventType: 'PPM_READING',
                            ppm: 145.8,
                            hazardZone: 'SECTOR_03_LEAK',
                            timestamp: new Date().toISOString()
                        } : {
                            eventType: 'PPE_STATUS',
                            mask: true,
                            suit: true,
                            gloves: true,
                            timestamp: new Date().toISOString()
                        };

                        logTerminal(`Simulating broadcast packet [${type}]: ` + JSON.stringify(payload), 'success');
                    }

                    async function executeApiTest(path) {
                        const box = document.getElementById('apiResponseBox');
                        const badge = document.getElementById('apiStatusBadge');
                        box.textContent = `Executing GET ${path}...`;
                        badge.textContent = 'FETCHING...';
                        
                        const start = performance.now();
                        try {
                            const res = await fetch(path);
                            const elapsed = Math.round(performance.now() - start);
                            const json = await res.json();
                            box.textContent = JSON.stringify(json, null, 2);
                            badge.textContent = `${res.status} ${res.statusText} (${elapsed}ms)`;
                            badge.style.background = 'rgba(16, 185, 129, 0.2)';
                            badge.style.color = '#34d399';
                        } catch (err) {
                            box.textContent = 'Error executing request: ' + err.message;
                            badge.textContent = 'ERROR';
                            badge.style.background = 'rgba(239, 68, 68, 0.2)';
                            badge.style.color = '#f87171';
                        }
                    }
                </script>
            </body>
            </html>
            """;

        return template
                .replace("{{PROFILE}}", profileStr)
                .replace("{{UPTIME}}", uptimeStr)
                .replace("{{USED_MEM}}", String.valueOf(usedMemory))
                .replace("{{TOTAL_MEM}}", String.valueOf(totalMemory))
                .replace("{{CORES}}", String.valueOf(availableProcessors))
                .replace("{{THREADS}}", String.valueOf(activeThreads))
                .replace("{{WS_API_KEY}}", apiKey != null ? apiKey : "");
    }

    @GetMapping(value = "/", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getApiStatusJson() {
        return ResponseEntity.ok(Map.of(
                "system", "CBRS-X Backend Engine",
                "version", "1.0.0-SNAPSHOT",
                "status", "ONLINE",
                "profile", activeProfile != null ? activeProfile : "dev",
                "swaggerUi", "/swagger-ui.html",
                "timestamp", Instant.now().toString()
        ));
    }
}
