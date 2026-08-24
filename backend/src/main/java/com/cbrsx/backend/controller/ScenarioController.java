package com.cbrsx.backend.controller;

import com.cbrsx.backend.entity.Scenario;
import com.cbrsx.backend.repository.ScenarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for discovering available CBRN incident scenarios.
 */
@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

    private final ScenarioRepository scenarioRepository;

    @GetMapping
    public ResponseEntity<List<Scenario>> listScenarios() {
        List<Scenario> scenarios = scenarioRepository.findAll();
        return ResponseEntity.ok(scenarios);
    }
}
