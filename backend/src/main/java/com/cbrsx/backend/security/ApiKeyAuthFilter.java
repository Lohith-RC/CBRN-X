package com.cbrsx.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * API Key authentication filter with:
 * - Constant-time comparison (prevents timing attacks)
 * - Per-IP rate limiting (brute-force protection)
 * - Role-based access mapping (Master, Instructor, Simulation, Trainee)
 * - Fail-closed enforcement in production environments
 * - Request size validation
 *
 * [SEC-03] Rate limiter uses a bounded LRU cache (max 10,000 entries) with
 *          automatic stale-entry eviction to prevent heap exhaustion from
 *          distributed traffic with randomized source IPs.
 * [SEC-04] Client IP extraction uses only request.getRemoteAddr() to prevent
 *          rate-limit bypass via spoofed X-Forwarded-For headers.
 */
@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiKeyAuthFilter.class);

    public static final String API_KEY_HEADER = "X-API-Key";
    private static final int MAX_REQUEST_SIZE_BYTES = 1024 * 1024; // 1MB limit
    private static final int RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
    private static final int MAX_REQUESTS_PER_WINDOW = 100;

    // [SEC-03] Maximum number of unique IPs tracked simultaneously
    private static final int MAX_RATE_LIMIT_ENTRIES = 10_000;

    private final String masterApiKey;
    private final String instructorApiKey;
    private final String simulationApiKey;
    private final String traineeApiKey;
    private final boolean authEnabled;
    private final boolean failClosed;
    private final boolean prodProfile;

    /**
     * [SEC-03] Bounded LRU rate-limit cache.
     */
    private final Map<String, RateLimitEntry> rateLimitMap = Collections.synchronizedMap(
            new BoundedLruMap(MAX_RATE_LIMIT_ENTRIES)
    );

    private static class BoundedLruMap extends LinkedHashMap<String, RateLimitEntry> {
        BoundedLruMap(int maxEntries) {
            super(maxEntries, 0.75f, true);
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<String, RateLimitEntry> eldest) {
            return size() > MAX_RATE_LIMIT_ENTRIES
                    || (System.currentTimeMillis() - eldest.getValue().windowStart) > RATE_LIMIT_WINDOW_MS * 2L;
        }
    }

    public ApiKeyAuthFilter(
            @Value("${cbrsx.api-key:}") String masterApiKey,
            @Value("${cbrsx.api-keys.instructor:}") String instructorApiKey,
            @Value("${cbrsx.api-keys.simulation:}") String simulationApiKey,
            @Value("${cbrsx.api-keys.trainee:}") String traineeApiKey,
            @Value("${cbrsx.security.fail-closed:false}") boolean failClosed,
            Environment environment) {

        this.masterApiKey = cleanKey(masterApiKey);
        this.instructorApiKey = cleanKey(instructorApiKey);
        this.simulationApiKey = cleanKey(simulationApiKey);
        this.traineeApiKey = cleanKey(traineeApiKey);
        this.failClosed = failClosed;

        boolean anyKeyConfigured = !this.masterApiKey.isEmpty()
                || !this.instructorApiKey.isEmpty()
                || !this.simulationApiKey.isEmpty()
                || !this.traineeApiKey.isEmpty();

        this.authEnabled = anyKeyConfigured;

        // Fail closed implicitly when the prod profile is active, even if the
        // operator forgot CBRSX_FAIL_CLOSED=true. A production deployment must
        // never silently fall back to dev-mode grant-everyone behavior.
        this.prodProfile = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        if ((failClosed || prodProfile) && !anyKeyConfigured) {
            log.error("FATAL: fail-closed security is required (prod profile or CBRSX_FAIL_CLOSED), but no CBRSX API keys are configured!");
            throw new IllegalStateException("FATAL: CBRS-X cannot start in a fail-closed state with no API keys configured. Set CBRSX_API_KEY (and optionally role-scoped keys) in the environment.");
        }

        if (!this.authEnabled) {
            log.warn("CBRSX_API_KEY is not configured. API key authentication is DISABLED in dev mode. " +
                    "Set environment variables and enable fail-closed mode for production.");
        } else {
            log.info("CBRS-X Security Filter active. Roles configured: Master={}, Instructor={}, Simulation={}, Trainee={}",
                    !this.masterApiKey.isEmpty(),
                    !this.instructorApiKey.isEmpty(),
                    !this.simulationApiKey.isEmpty(),
                    !this.traineeApiKey.isEmpty());
        }
    }

    private String cleanKey(String key) {
        return key == null ? "" : key.trim();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Exempt health checks, info, metrics, root status, error, and Swagger documentation
        return path.startsWith("/actuator/health")
                || path.startsWith("/actuator/info")
                || path.startsWith("/actuator/metrics")
                || path.equals("/")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.equals("/swagger-ui.html")
                || path.startsWith("/ws-telemetry")
                || path.startsWith("/error")
                // Interactive login/logout/session endpoints authenticate via credentials,
                // not API keys (rate limiting for logins lives in AuthController)
                || path.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // ── Request size guard ──
        if (request.getContentLength() > MAX_REQUEST_SIZE_BYTES) {
            response.setStatus(HttpStatus.PAYLOAD_TOO_LARGE.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Payload Too Large\",\"message\":\"Request body exceeds 1MB limit\"}");
            return;
        }

        // ── Rate limiting per client IP ──
        String clientIp = getClientIp(request);
        if (isRateLimited(clientIp)) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setHeader("Retry-After", "60");
            response.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Try again later.\"}");
            return;
        }

        // ── Session-authenticated browser request (instructor login) ──
        // SecurityContextHolderFilter has already restored any saved context;
        // if one exists, honor it instead of demanding an API key.
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        // ── If auth is disabled (dev mode only), grant full admin authority ──
        if (!authEnabled) {
            if (prodProfile) {
                // Defense in depth: constructor already refuses to start this
                // state; reject rather than ever granting dev authority in prod.
                rejectUnauthorized(response, "Server authentication is not configured");
                return;
            }
            List<SimpleGrantedAuthority> devAuthorities = List.of(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("ROLE_INSTRUCTOR"),
                    new SimpleGrantedAuthority("ROLE_SIMULATION"),
                    new SimpleGrantedAuthority("ROLE_TRAINEE")
            );
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken("dev-anonymous", null, devAuthorities)
            );
            filterChain.doFilter(request, response);
            return;
        }

        // ── Validate API key with constant-time comparison ──
        String provided = request.getHeader(API_KEY_HEADER);
        if (provided == null || provided.isBlank()) {
            rejectUnauthorized(response, "Missing X-API-Key header");
            return;
        }

        List<String> assignedRoles = authenticateAndGetRoles(provided);
        if (assignedRoles.isEmpty()) {
            log.warn("Failed API key authentication attempt from IP: {} Path: {}", clientIp, request.getRequestURI());
            rejectUnauthorized(response, "Invalid API key");
            return;
        }

        List<SimpleGrantedAuthority> authorities = assignedRoles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("api-client", null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    /**
     * Determines granted roles based on constant-time match against configured keys.
     */
    private List<String> authenticateAndGetRoles(String providedKey) {
        List<String> roles = new ArrayList<>();

        if (!masterApiKey.isEmpty() && constantTimeEquals(masterApiKey, providedKey)) {
            roles.add("ROLE_ADMIN");
            roles.add("ROLE_INSTRUCTOR");
            roles.add("ROLE_SIMULATION");
            roles.add("ROLE_TRAINEE");
            return roles;
        }

        if (!instructorApiKey.isEmpty() && constantTimeEquals(instructorApiKey, providedKey)) {
            roles.add("ROLE_INSTRUCTOR");
            roles.add("ROLE_TRAINEE");
        }

        if (!simulationApiKey.isEmpty() && constantTimeEquals(simulationApiKey, providedKey)) {
            roles.add("ROLE_SIMULATION");
            roles.add("ROLE_TRAINEE");
        }

        if (!traineeApiKey.isEmpty() && constantTimeEquals(traineeApiKey, providedKey)) {
            roles.add("ROLE_TRAINEE");
        }

        return roles;
    }

    /**
     * Constant-time byte comparison via MessageDigest.isEqual (the JDK's
     * branchless comparison; iteration count depends only on the first
     * argument, which is always the server-side secret).
     */
    private boolean constantTimeEquals(String expected, String provided) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8));
    }

    private void rejectUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + message + "\"}");
    }

    /**
     * [SEC-04] Securely extract client IP address.
     */
    private String getClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }

    /**
     * [SEC-03] Bounded rate limiter with automatic stale-entry eviction.
     */
    private boolean isRateLimited(String clientIp) {
        long now = System.currentTimeMillis();
        synchronized (rateLimitMap) {
            RateLimitEntry entry = rateLimitMap.get(clientIp);
            if (entry == null || (now - entry.windowStart) > RATE_LIMIT_WINDOW_MS) {
                rateLimitMap.put(clientIp, new RateLimitEntry(now, new AtomicInteger(1)));
                return false;
            }
            return entry.count.incrementAndGet() > MAX_REQUESTS_PER_WINDOW;
        }
    }

    private static class RateLimitEntry {
        final long windowStart;
        final AtomicInteger count;

        RateLimitEntry(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
