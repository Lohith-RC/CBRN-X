package com.cbrsx.backend.controller;

import com.cbrsx.backend.entity.InstructorUser;
import com.cbrsx.backend.repository.InstructorUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Interactive session authentication for the instructor dashboard.
 *
 * Login verifies BCrypt credentials against instructor_users, populates the
 * SecurityContext and persists it to the HTTP session (requireExplicitSave=false).
 * All subsequent browser requests authenticate via the JSESSIONID cookie.
 * Machine clients (simulation engine) continue to use X-API-Key headers.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private static final int MAX_FAILED_ATTEMPTS_PER_WINDOW = 10;
    private static final long FAILED_ATTEMPT_WINDOW_MS = Duration.ofMinutes(5).toMillis();
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final InstructorUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CookieCsrfTokenRepository csrfTokenRepository;
    private final HttpSessionSecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    // Bounded per-IP failed login tracker (mirrors ApiKeyAuthFilter rate-limit pattern)
    private final Map<String, FailedAttemptEntry> failedAttempts = new LinkedHashMap<>(256, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, FailedAttemptEntry> eldest) {
            return size() > MAX_TRACKED_CLIENTS
                    || (Instant.now().toEpochMilli() - eldest.getValue().windowStart) > FAILED_ATTEMPT_WINDOW_MS * 2L;
        }
    };

    public AuthController(InstructorUserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          CookieCsrfTokenRepository csrfTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.csrfTokenRepository = csrfTokenRepository;
    }

    public record LoginRequest(String username, String password) {}

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request,
                                                     HttpServletRequest httpRequest,
                                                     HttpServletResponse httpResponse) {
        String clientIp = httpRequest.getRemoteAddr();
        if (isLoginLocked(clientIp)) {
            log.warn("Too many failed logins from IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too Many Requests",
                            "message", "Account temporarily locked due to repeated failures"));
        }

        String username = request.username() == null ? "" : request.username().trim();
        String password = request.password() == null ? "" : request.password();

        InstructorUser user = userRepository.findById(username).orElse(null);
        boolean valid = user != null && user.isEnabled()
                && passwordEncoder.matches(password, user.getPasswordHash());

        if (!valid) {
            recordFailedAttempt(clientIp);
            log.warn("Failed login attempt for user '{}' from IP: {}", username, clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized", "message", "Invalid username or password"));
        }

        failedAttempts.remove(clientIp);

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
        if (InstructorUser.ROLE_INSTRUCTOR.equals(user.getRole())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_TRAINEE"));
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user.getUsername(), null, authorities);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        log.info("Instructor '{}' logged in from IP: {} (role: {})", user.getUsername(), clientIp, user.getRole());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("username", user.getUsername());
        body.put("displayName", user.getDisplayName());
        body.put("role", user.getRole());
        body.put("unit", user.getUnit());
        return ResponseEntity.ok(body);
    }

    /**
     * Issues a fresh CSRF cookie+token pair. The SPA calls this before any
     * mutating request so the token can be echoed in the X-XSRF-TOKEN header.
     */
    @GetMapping("/csrf")
    public Map<String, String> csrf(HttpServletRequest request, HttpServletResponse response) {
        CsrfToken token = csrfTokenRepository.generateToken(request);
        csrfTokenRepository.saveToken(token, request, response);
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepository.findById(authentication.getName())
                .<ResponseEntity<Map<String, Object>>>map(user -> {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("username", user.getUsername());
                    body.put("displayName", user.getDisplayName());
                    body.put("role", user.getRole());
                    body.put("unit", user.getUnit());
                    return ResponseEntity.ok(body);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    private boolean isLoginLocked(String clientIp) {
        synchronized (failedAttempts) {
            FailedAttemptEntry entry = failedAttempts.get(clientIp);
            if (entry == null) {
                return false;
            }
            long now = Instant.now().toEpochMilli();
            if ((now - entry.windowStart) > FAILED_ATTEMPT_WINDOW_MS) {
                failedAttempts.remove(clientIp);
                return false;
            }
            return entry.count.get() >= MAX_FAILED_ATTEMPTS_PER_WINDOW;
        }
    }

    private void recordFailedAttempt(String clientIp) {
        synchronized (failedAttempts) {
            long now = Instant.now().toEpochMilli();
            FailedAttemptEntry entry = failedAttempts.get(clientIp);
            if (entry == null || (now - entry.windowStart) > FAILED_ATTEMPT_WINDOW_MS) {
                failedAttempts.put(clientIp, new FailedAttemptEntry(now, new AtomicInteger(1)));
            } else {
                entry.count.incrementAndGet();
            }
        }
    }

    private static class FailedAttemptEntry {
        final long windowStart;
        final AtomicInteger count;

        FailedAttemptEntry(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
