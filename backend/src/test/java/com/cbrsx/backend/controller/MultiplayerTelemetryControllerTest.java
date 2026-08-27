package com.cbrsx.backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MultiplayerTelemetryControllerTest {

    private final MultiplayerTelemetryController controller = new MultiplayerTelemetryController();

    @Test
    @DisplayName("syncResponderPosition: Correctly normalizes telemetry payloads")
    void syncResponderPosition_NormalizesFields() {
        Map<String, Object> input = Map.of(
                "teamId", "bravo",
                "responderName", "Chandana M N",
                "x", 12.5,
                "y", 1.8,
                "z", -5.2,
                "scbaPsi", 2100
        );

        Map<String, Object> output = controller.syncResponderPosition(input);

        assertNotNull(output);
        assertEquals("bravo", output.get("teamId"));
        assertEquals("Chandana M N", output.get("responderName"));
        assertEquals(12.5, output.get("x"));
        assertEquals(1.8, output.get("y"));
        assertEquals(-5.2, output.get("z"));
        assertEquals(2100, output.get("scbaPsi"));
        assertNotNull(output.get("timestamp"));
    }
}
