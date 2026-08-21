package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.LogEventRequest;
import com.cbrsx.backend.entity.SessionEvent;
import com.cbrsx.backend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventController {

    private final SessionService sessionService;

    @PostMapping("/log")
    public ResponseEntity<SessionEvent> logEvent(@RequestBody LogEventRequest request) {
        SessionEvent event = sessionService.logEvent(request);
        return ResponseEntity.ok(event);
    }
}
