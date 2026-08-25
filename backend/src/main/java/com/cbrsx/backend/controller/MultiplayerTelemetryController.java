package com.cbrsx.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * Controller for real-time multiplayer co-op responder telemetry sync.
 * Handles STOMP messages over WebSocket for multi-responder position and status sync.
 */
@Controller
public class MultiplayerTelemetryController {

    private static final Logger log = LoggerFactory.getLogger(MultiplayerTelemetryController.class);

    /**
     * Receives position telemetry from active responder sessions and broadcasts
     * to all connected instructors and command consoles on /topic/coop/positions.
     */
    @MessageMapping("/coop/position")
    @SendTo("/topic/coop/positions")
    public Map<String, Object> syncResponderPosition(Map<String, Object> positionPayload) {
        log.debug("Co-Op Telemetry sync received for responder: {}", positionPayload.get("teamId"));
        return Map.of(
            "teamId", positionPayload.getOrDefault("teamId", "alpha"),
            "responderName", positionPayload.getOrDefault("responderName", "Inspector Lohith R C"),
            "x", positionPayload.getOrDefault("x", 0.0),
            "y", positionPayload.getOrDefault("y", 1.7),
            "z", positionPayload.getOrDefault("z", 0.0),
            "scbaPsi", positionPayload.getOrDefault("scbaPsi", 2450),
            "timestamp", System.currentTimeMillis()
        );
    }
}
