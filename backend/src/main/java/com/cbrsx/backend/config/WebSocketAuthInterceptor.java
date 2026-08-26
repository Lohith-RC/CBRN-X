package com.cbrsx.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
            @Value("${cbrsx.api-keys.trainee:}") String traineeApiKey,
            Environment environment) {

        this.masterApiKey = cleanKey(masterApiKey);
        this.instructorApiKey = cleanKey(instructorApiKey);
        this.simulationApiKey = cleanKey(simulationApiKey);
        this.traineeApiKey = cleanKey(traineeApiKey);

        this.authEnabled = !this.masterApiKey.isEmpty()
                || !this.instructorApiKey.isEmpty()
                || !this.simulationApiKey.isEmpty()
                || !this.traineeApiKey.isEmpty();

        // Fail closed: a production deployment without any configured key must
        // never fall back to the permissive dev-mode grant of all roles.
        this.prodProfile = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        if (!authEnabled && prodProfile) {
            log.error("FATAL: prod profile is active but no CBRSX WebSocket API keys are configured. " +
                    "All STOMP CONNECT frames will be rejected until keys are provided.");
        } else if (!authEnabled) {
            log.warn("No WebSocket API keys configured - dev mode grants all STOMP roles. " +
                    "Never run production deployments in this state.");
        }
    }

    private final boolean prodProfile;

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
        // 3. [SEC-07] Handle STOMP SEND (client → server app destinations)
        else if (StompCommand.SEND.equals(accessor.getCommand())) {
            handleSend(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();

        if (!authEnabled) {
            if (prodProfile) {
                // Fail closed: no keys configured in production means nobody
                // authenticates — reject instead of granting all roles.
                log.warn("WebSocket CONNECT rejected: prod profile with no API keys configured (session {})",
                        accessor.getSessionId());
                throw new AccessDeniedException("Unauthorized: server-side authentication is not configured");
            }
            // Dev mode with no keys configured grants all roles
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
    private List<String> rolesFor(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        return sessionAttributes != null
                ? (List<String>) sessionAttributes.getOrDefault(ROLES_SESSION_KEY, Collections.emptyList())
                : Collections.emptyList();
    }

    /**
     * [SEC-07] Publishing to co-op telemetry application destinations is
     * restricted to elevated roles (SIMULATION/ADMIN/INSTRUCTOR). Without this,
     * any trainee-level client could inject forged responder positions into the
     * instructor tactical picture.
     */
    private void handleSend(StompHeaderAccessor accessor) {
        if (!authEnabled) {
            return;
        }
        String destination = accessor.getDestination();
        if (destination != null && destination.startsWith("/app/coop/")) {
            List<String> roles = rolesFor(accessor);
            if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_INSTRUCTOR")
                    && !roles.contains("ROLE_SIMULATION")) {
                log.warn("WebSocket SEND to {} denied for session {} without simulation privileges",
                        destination, accessor.getSessionId());
                throw new AccessDeniedException(
                        "Access Denied: Simulation, Instructor or Admin role required to publish to " + destination);
            }
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        if (!authEnabled) {
            return;
        }

        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        List<String> roles = rolesFor(accessor);

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
        // [SEC-07] Co-op position streams expose live responder locations and
        // are restricted to instructor consoles and command staff only.
        else if (destination.startsWith("/topic/coop/")) {
            if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_INSTRUCTOR")) {
                log.warn("WebSocket SUBSCRIBE to {} denied for session {} without instructor privileges",
                        destination, accessor.getSessionId());
                throw new AccessDeniedException(
                        "Access Denied: Instructor or Admin role required to subscribe to " + destination);
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

    /**
     * Constant-time byte comparison via MessageDigest.isEqual (length is not
     * leaked as a distinguishable branch; iteration count depends only on the
     * first argument, which is the server-side secret).
     */
    private boolean constantTimeEquals(String expected, String provided) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8));
    }
}
