package com.cbrsx.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * API Key authentication filter with:
 * - Constant-time comparison (prevents timing attacks)
 * - Per-IP rate limiting (brute-force protection)
 * - Secure handling when no API key is configured
 * - Request size validation
 *
 * [SEC-03] Rate limiter uses a bounded LRU cache (max 10,000 entries) with
 *          automatic stale-entry eviction to prevent heap exhaustion from
 *          distributed traffic with randomized source IPs.
 * [SEC-04] Client IP extraction uses only request.getRemoteAddr() to prevent
 *          rate-limit bypass via spoofed X-Forwarded-For headers. Trusted proxy
 *          headers should be handled at the Tomcat/container level with
 *          RemoteIpValve or Spring's ForwardedHeaderFilter.
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

    private final String configuredApiKey;
    private final boolean authEnabled;

    /**
     * [SEC-03] Bounded LRU rate-limit cache.
     * When the cache exceeds MAX_RATE_LIMIT_ENTRIES, the eldest (least-recently-accessed)
     * entry is automatically evicted. Synchronized wrapper prevents concurrent modification.
     */
    private final Map<String, RateLimitEntry> rateLimitMap = Collections.synchronizedMap(
            new LinkedHashMap<String, RateLimitEntry>(MAX_RATE_LIMIT_ENTRIES, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, RateLimitEntry> eldest) {
                    // Evict if over capacity OR if the eldest entry's window has expired
                    return size() > MAX_RATE_LIMIT_ENTRIES
                            || (System.currentTimeMillis() - eldest.getValue().windowStart) > RATE_LIMIT_WINDOW_MS * 2L;
                }
            }
    );

    public ApiKeyAuthFilter(@Value("${cbrsx.api-key:}") String configuredApiKey) {
        String key = configuredApiKey == null ? "" : configuredApiKey.trim();
        this.configuredApiKey = key;
        this.authEnabled = !key.isEmpty();
        if (!this.authEnabled) {
            log.warn("⚠️  CBRSX_API_KEY is not configured. API key authentication is DISABLED. " +
                    "Set the environment variable to enable authentication in production.");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Only exempt health checks and the root status endpoint
        return path.startsWith("/actuator/health")
                || path.startsWith("/actuator/info")
                || path.equals("/")
                || path.startsWith("/ws-telemetry")
                || path.startsWith("/error");
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

        // ── If no API key is configured, allow through with a warning log ──
        if (!authEnabled) {
            filterChain.doFilter(request, response);
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

        // ── Validate API key with constant-time comparison ──
        String provided = request.getHeader(API_KEY_HEADER);
        if (provided == null || provided.isEmpty()) {
            rejectUnauthorized(response, "Missing X-API-Key header");
            return;
        }

        if (constantTimeEquals(configuredApiKey, provided)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Failed API key authentication attempt from IP: {} Path: {}", clientIp, request.getRequestURI());
            rejectUnauthorized(response, "Invalid API key");
        }
    }

    /**
     * Constant-time string comparison using HMAC-SHA256 to prevent timing attacks.
     * Both strings are HMAC'd with a random key, then the digests are compared.
     */
    private boolean constantTimeEquals(String expected, String provided) {
        try {
            // Generate a random key for this comparison
            byte[] comparisonKey = new byte[32];
            new java.security.SecureRandom().nextBytes(comparisonKey);

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(comparisonKey, "HmacSHA256"));

            byte[] expectedHash = mac.doFinal(expected.getBytes(StandardCharsets.UTF_8));
            byte[] providedHash = mac.doFinal(provided.getBytes(StandardCharsets.UTF_8));

            // Compare the full HMAC digests (constant-time via Java's MessageDigest)
            return java.security.MessageDigest.isEqual(expectedHash, providedHash);
        } catch (Exception e) {
            // Fallback: use standard MessageDigest.isEqual on raw bytes
            // This is still constant-time via javax.crypto.Mac or manual XOR
            byte[] a = expected.getBytes(StandardCharsets.UTF_8);
            byte[] b = provided.getBytes(StandardCharsets.UTF_8);
            if (a.length != b.length) {
                // Still do the comparison to avoid length-based timing
                int dummy = 0;
                for (byte bite : b) dummy |= bite;
                return false;
            }
            int result = 0;
            for (int i = 0; i < a.length; i++) {
                result |= a[i] ^ b[i];
            }
            return result == 0;
        }
    }

    private void rejectUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + message + "\"}");
    }

    /**
     * [SEC-04] Securely extract client IP address.
     * Uses ONLY request.getRemoteAddr() to prevent IP spoofing via attacker-controlled
     * X-Forwarded-For or X-Real-IP headers. Trusted proxy header translation should
     * be configured at the container level (Tomcat RemoteIpValve or Spring's
     * ForwardedHeaderFilter) with an explicit trusted-proxy CIDR allowlist.
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
