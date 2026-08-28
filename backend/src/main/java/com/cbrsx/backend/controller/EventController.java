package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.LogEventRequest;
import com.cbrsx.backend.dto.LogEventResponse;
import com.cbrsx.backend.entity.SessionEvent;
import com.cbrsx.backend.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final SessionService sessionService;

    public EventController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/log")
    public ResponseEntity<LogEventResponse> logEvent(@Valid @RequestBody LogEventRequest request) {
        SessionEvent event = sessionService.logEvent(request);
        LogEventResponse response = LogEventResponse.builder()
                .eventId(event.getEventId())
                .sessionId(event.getSessionId())
                .eventType(event.getEventType())
                .timestamp(event.getTimestamp())
                .status("LOGGED")
                .build();
        return ResponseEntity.ok(response);
    }
}

