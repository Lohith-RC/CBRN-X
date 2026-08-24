package com.cbrsx.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * [SEC-01 & SEC-05 FIX] STOMP-level authentication and subscription authorization interceptor.
 *
 * Two authentication paths are accepted on CONNECT:
 *   1. Browser clients: the HTTP session (JSESSIONID cookie) was already
 *      authenticated by Spring Security; {@link SessionRolesHandshakeInterceptor}
 *      copied the ROLE_* authorities into the handshake attributes.
 *   2. Machine clients (simulation engine): the CONNECT frame carries a native
 *      X-API-Key header which is validated here.
 *
 * Topic subscription authorization is enforced on SUBSCRIBE commands.
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);
    public static final String API_KEY_HEADER = "X-API-Key";
    public static final String ROLES_SESSION_KEY = "CBRSX_USER_ROLES";

    private final String masterApiKey;
    private final String instructorApiKey;
    private final String simulationApiKey;
    private final String traineeApiKey;
    private final boolean authEnabled;

    public WebSocketAuthInterceptor(
            @Value("${cbrsx.api-key:}") String masterApiKey,
            @Value("${cbrsx.api-keys.instructor:}") String instructorApiKey,
            @Value("${cbrsx.api-keys.simulation:}") String simulationApiKey,
            @Value("${cbrsx.api-keys.trainee:}") String traineeApiKey) {

        this.masterApiKey = cleanKey(masterApiKey);
        this.instructorApiKey = cleanKey(instructorApiKey);
        this.simulationApiKey = cleanKey(simulationApiKey);
        this.traineeApiKey = cleanKey(traineeApiKey);

        this.authEnabled = !this.masterApiKey.isEmpty()
                || !this.instructorApiKey.isEmpty()
                || !this.simulationApiKey.isEmpty()
                || !this.traineeApiKey.isEmpty();
    }

    private String cleanKey(String key) {
        return key == null ? "" : key.trim();
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        // 1. Handle STOMP CONNECT authentication
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            handleConnect(accessor);
        }
        // 2. Handle STOMP SUBSCRIBE authorization
        else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            handleSubscribe(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();

        if (!authEnabled) {
            // In dev mode with no keys configured, grant all roles
            if (sessionAttributes != null) {
                sessionAttributes.put(ROLES_SESSION_KEY, List.of("ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_SIMULATION", "ROLE_TRAINEE"));
            }
            return;
        }

        // Path 1: browser clients already authenticated via HTTP session cookie
        // (roles captured by SessionRolesHandshakeInterceptor during the upgrade).
        if (sessionAttributes != null && sessionAttributes.get(ROLES_SESSION_KEY) instanceof List<?> preAuthRoles
                && !preAuthRoles.isEmpty()) {
            log.debug("WebSocket CONNECT authenticated via session for session {} with roles: {}",
                    accessor.getSessionId(), preAuthRoles);
            return;
        }

        // Path 2: machine clients authenticate with the X-API-Key native header.
        String providedKey = accessor.getFirstNativeHeader(API_KEY_HEADER);
        if (providedKey == null || providedKey.isBlank()) {
            log.warn("WebSocket CONNECT rejected: missing {} header from session {}",
                    API_KEY_HEADER, accessor.getSessionId());
            throw new AccessDeniedException("Unauthorized: Missing X-API-Key in STOMP CONNECT frame");
        }

        List<String> roles = authenticateAndGetRoles(providedKey);
        if (roles.isEmpty()) {
            log.warn("WebSocket CONNECT rejected: invalid API key from session {}", accessor.getSessionId());
            throw new AccessDeniedException("Unauthorized: Invalid API key in STOMP CONNECT frame");
        }

        if (sessionAttributes != null) {
            sessionAttributes.put(ROLES_SESSION_KEY, roles);
        }
        log.debug("WebSocket CONNECT authenticated for session {} with roles: {}", accessor.getSessionId(), roles);
    }

    @SuppressWarnings("unchecked")
    private void handleSubscribe(StompHeaderAccessor accessor) {
        if (!authEnabled) {
            return;
        }

        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        List<String> roles = sessionAttributes != null
                ? (List<String>) sessionAttributes.getOrDefault(ROLES_SESSION_KEY, Collections.emptyList())
                : Collections.emptyList();

        // Broadcast topics (global event and session streams) require INSTRUCTOR or ADMIN roles
        if (destination.equals("/topic/events") || destination.equals("/topic/sessions")) {
            if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_INSTRUCTOR")) {
                log.warn("WebSocket SUBSCRIBE to {} denied for session {} without instructor privileges",
                        destination, accessor.getSessionId());
                throw new AccessDeniedException("Access Denied: Instructor or Admin role required to subscribe to " + destination);
            }
        }
        // Specific session streams (/topic/sessions/{sessionId}) are accessible to Trainees, Instructors, Admins
        else if (destination.startsWith("/topic/sessions/")) {
            if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_INSTRUCTOR") && !roles.contains("ROLE_TRAINEE")) {
                log.warn("WebSocket SUBSCRIBE to {} denied for session {}", destination, accessor.getSessionId());
                throw new AccessDeniedException("Access Denied: Insufficient permissions to subscribe to " + destination);
            }
        }
    }

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

    private boolean constantTimeEquals(String expected, String provided) {
        try {
            byte[] comparisonKey = new byte[32];
            new java.security.SecureRandom().nextBytes(comparisonKey);

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(comparisonKey, "HmacSHA256"));

            byte[] expectedHash = mac.doFinal(expected.getBytes(StandardCharsets.UTF_8));
            byte[] providedHash = mac.doFinal(provided.getBytes(StandardCharsets.UTF_8));

            return java.security.MessageDigest.isEqual(expectedHash, providedHash);
        } catch (Exception e) {
            byte[] a = expected.getBytes(StandardCharsets.UTF_8);
            byte[] b = provided.getBytes(StandardCharsets.UTF_8);
            if (a.length != b.length) return false;
            int result = 0;
            for (int i = 0; i < a.length; i++) {
                result |= a[i] ^ b[i];
            }
            return result == 0;
        }
    }
}
