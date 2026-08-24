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
 * Renders an interactive Tactical Developer & Operations Portal for browser requests,
 * and structured JSON telemetry for programmatic API consumers.
 */
@RestController
public class HomeController {

    @Value("${spring.application.name:cbrsx-backend}")
    private String appName;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String getTacticalPortalView() {
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        long hours = uptimeSeconds / 3600;
        long minutes = (uptimeSeconds % 3600) / 60;
        long seconds = uptimeSeconds % 60;
        String uptimeStr = String.format("%02dh %02dm %02ds", hours, minutes, seconds);
        String profileStr = activeProfile != null ? activeProfile.toUpperCase() : "DEV";

        String template = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CBRS-X Tactical Backend Engine</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg: #090d16;
                        --card-bg: rgba(16, 24, 40, 0.75);
                        --card-border: rgba(30, 58, 138, 0.35);
                        --accent-blue: #3b82f6;
                        --accent-cyan: #06b6d4;
                        --accent-emerald: #10b981;
                        --accent-amber: #f59e0b;
                        --text-main: #f1f5f9;
                        --text-muted: #94a3b8;
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background-color: var(--bg);
                        background-image: 
                            radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                            radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.06) 0%, transparent 40%),
                            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
                        background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
                        color: var(--text-main);
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        min-height: 100vh;
                        padding: 2.5rem 1.5rem;
                    }
                    .container { max-width: 1200px; margin: 0 auto; }
                    header {
                        display: flex; justify-content: space-between; align-items: center;
                        border-bottom: 1px solid var(--card-border); padding-bottom: 1.5rem;
                        margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
                    }
                    .brand { display: flex; align-items: center; gap: 0.85rem; }
                    .brand-badge {
                        background: linear-gradient(135deg, #1e40af, #0284c7);
                        color: #ffffff; font-weight: 800; font-size: 1.1rem;
                        padding: 0.4rem 0.85rem; border-radius: 8px;
                        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
                        letter-spacing: 1px;
                    }
                    h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.5px; }
                    .subtitle { color: var(--text-muted); font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; margin-top: 0.2rem; }
                    .live-status {
                        display: flex; align-items: center; gap: 0.6rem;
                        background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
                        color: var(--accent-emerald); padding: 0.4rem 0.9rem; border-radius: 9999px;
                        font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 600;
                    }
                    .pulse {
                        width: 8px; height: 8px; background-color: var(--accent-emerald);
                        border-radius: 50%; box-shadow: 0 0 10px var(--accent-emerald);
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0% { transform: scale(0.95); opacity: 0.8; }
                        50% { transform: scale(1.3); opacity: 1; }
                        100% { transform: scale(0.95); opacity: 0.8; }
                    }
                    .grid-stats {
                        display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                        gap: 1.25rem; margin-bottom: 2rem;
                    }
                    .stat-card {
                        background: var(--card-bg); border: 1px solid var(--card-border);
                        border-radius: 12px; padding: 1.25rem; backdrop-filter: blur(12px);
                    }
                    .stat-label {
                        color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;
                        letter-spacing: 1px; font-weight: 600;
                    }
                    .stat-value {
                        font-size: 1.35rem; font-weight: 700; margin-top: 0.4rem;
                        font-family: 'JetBrains Mono', monospace; color: #ffffff;
                    }
                    .quick-actions {
                        display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 1.25rem; margin-bottom: 2.5rem;
                    }
                    .action-card {
                        background: var(--card-bg); border: 1px solid var(--card-border);
                        border-radius: 14px; padding: 1.5rem; transition: all 0.25s ease;
                        text-decoration: none; color: inherit; display: flex; flex-direction: column;
                        justify-content: space-between; backdrop-filter: blur(12px);
                    }
                    .action-card:hover {
                        border-color: var(--accent-cyan); transform: translateY(-3px);
                        box-shadow: 0 10px 25px -5px rgba(6, 182, 212, 0.15);
                    }
                    .action-title { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; justify-content: space-between; }
                    .action-desc { font-size: 0.85rem; color: var(--text-muted); margin: 0.6rem 0 1.2rem 0; line-height: 1.4; }
                    .btn-action { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--accent-cyan); font-size: 0.85rem; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
                    .section-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.2rem; font-size: 1.2rem; font-weight: 700; }
                    .table-wrapper {
                        background: var(--card-bg); border: 1px solid var(--card-border);
                        border-radius: 14px; overflow-x: auto; backdrop-filter: blur(12px); margin-bottom: 2rem;
                    }
                    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left; }
                    th {
                        background: rgba(30, 58, 138, 0.2); padding: 0.9rem 1.2rem; color: var(--text-muted);
                        font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;
                        border-bottom: 1px solid var(--card-border);
                    }
                    td { padding: 0.9rem 1.2rem; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
                    tr:last-child td { border-bottom: none; }
                    .badge-method {
                        font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 700;
                        padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block;
                    }
                    .get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
                    .post { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
                    .endpoint-path { font-family: 'JetBrains Mono', monospace; color: #e2e8f0; font-weight: 600; }
                    .badge-role {
                        background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);
                        font-size: 0.72rem; font-family: 'JetBrains Mono', monospace; padding: 0.15rem 0.45rem; border-radius: 4px;
                    }
                    footer { text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 3rem; font-family: 'JetBrains Mono', monospace; }
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <div class="brand">
                            <span class="brand-badge">CBRS-X</span>
                            <div>
                                <h1>Tactical Backend Engine</h1>
                                <p class="subtitle">VR CBRN Simulation & Training Telemetry Platform</p>
                            </div>
                        </div>
                        <div class="live-status">
                            <div class="pulse"></div>
                            ENGINE STATUS: ONLINE
                        </div>
                    </header>

                    <div class="grid-stats">
                        <div class="stat-card">
                            <div class="stat-label">Active Profile</div>
                            <div class="stat-value" style="color: var(--accent-cyan);">{{PROFILE}}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">System Uptime</div>
                            <div class="stat-value">{{UPTIME}}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Security & RBAC</div>
                            <div class="stat-value" style="color: var(--accent-emerald);">ENFORCED</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">STOMP Telemetry</div>
                            <div class="stat-value" style="color: var(--accent-blue);">/ws-telemetry</div>
                        </div>
                    </div>

                    <div class="quick-actions">
                        <a href="/swagger-ui.html" class="action-card" target="_blank">
                            <div>
                                <div class="action-title">
                                    <span>Interactive Swagger UI</span>
                                    <span style="color: var(--accent-cyan);">[API]</span>
                                </div>
                                <p class="action-desc">Visual API console to test REST endpoints, inspect request schemas, and simulate incident payloads.</p>
                            </div>
                            <span class="btn-action">Launch Swagger UI &rarr;</span>
                        </a>

                        <a href="/actuator/health" class="action-card" target="_blank">
                            <div>
                                <div class="action-title">
                                    <span>System Health & Probes</span>
                                    <span style="color: var(--accent-emerald);">[HEALTH]</span>
                                </div>
                                <p class="action-desc">Inspect real-time container health probes, database connection pool, and disk readiness.</p>
                            </div>
                            <span class="btn-action">Inspect Actuator &rarr;</span>
                        </a>

                        <a href="http://localhost:5000" class="action-card" target="_blank">
                            <div>
                                <div class="action-title">
                                    <span>Trainee VR Stream View</span>
                                    <span style="color: var(--accent-amber);">[VR]</span>
                                </div>
                                <p class="action-desc">Access the real-time panoramic Trainee VR interactive screen on Gateway Port 5000.</p>
                            </div>
                            <span class="btn-action">Open Trainee View &rarr;</span>
                        </a>
                    </div>

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
            </body>
            </html>
            """;

        return template
                .replace("{{PROFILE}}", profileStr)
                .replace("{{UPTIME}}", uptimeStr);
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
