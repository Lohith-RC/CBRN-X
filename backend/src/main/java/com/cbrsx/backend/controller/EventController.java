package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.LogEventRequest;
import com.cbrsx.backend.entity.SessionEvent;
import com.cbrsx.backend.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final SessionService sessionService;

    @PostMapping("/log")
    public ResponseEntity<SessionEvent> logEvent(@Valid @RequestBody LogEventRequest request) {
        SessionEvent event = sessionService.logEvent(request);
        return ResponseEntity.ok(event);
    }
}
