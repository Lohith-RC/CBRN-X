package com.cbrsx.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> getApiStatus() {
        return ResponseEntity.ok(Map.of(
                "system", "CBRS-X Backend Engine",
                "version", "1.0.0",
                "status", "ONLINE"
        ));
    }
}
