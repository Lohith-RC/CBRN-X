package com.cbrsx.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> getApiStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("system", "CBRS-X Spring Boot Backend Engine");
        status.put("version", "1.0.0");
        status.put("status", "ONLINE");
        status.put("dashboard_ui", "http://localhost:3000");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("dashboard_stats", "/api/dashboard/stats");
        endpoints.put("start_session", "POST /api/sessions/start");
        endpoints.put("log_event", "POST /api/events/log");
        endpoints.put("complete_session", "POST /api/sessions/{sessionId}/complete");
        status.put("available_endpoints", endpoints);

        return ResponseEntity.ok(status);
    }
}
