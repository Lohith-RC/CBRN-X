package com.cbrsx.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.access.AccessDeniedException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit tests for STOMP-level authentication paths of WebSocketAuthInterceptor:
 * dev-mode grant, prod fail-closed, API-key machine clients, and the
 * HTTP-session pre-authenticated browser path.
 */
class WebSocketAuthInterceptorTest {

    private static final String MASTER_KEY = "master-secret";
    private static final String TRAINEE_KEY = "trainee-secret";

    private WebSocketAuthInterceptor enabledInterceptor() {
        return new WebSocketAuthInterceptor(MASTER_KEY, "", "", TRAINEE_KEY,
                new MockEnvironment());
    }

    private WebSocketAuthInterceptor disabledDevInterceptor() {
        return new WebSocketAuthInterceptor("", "", "", "", new MockEnvironment());
    }

    private WebSocketAuthInterceptor disabledProdInterceptor() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        return new WebSocketAuthInterceptor("", "", "", "", env);
    }

    private Message<byte[]> connectMessage(Map<String, Object> sessionAttributes, String apiKey) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        if (sessionAttributes != null) {
            accessor.setSessionAttributes(sessionAttributes);
        }
        if (apiKey != null) {
            accessor.setNativeHeader(WebSocketAuthInterceptor.API_KEY_HEADER, apiKey);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<byte[]> subscribeMessage(Map<String, Object> sessionAttributes, String destination) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination(destination);
        if (sessionAttributes != null) {
            accessor.setSessionAttributes(sessionAttributes);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    void devModeWithoutKeysGrantsAllRoles() {
        WebSocketAuthInterceptor interceptor = disabledDevInterceptor();
        Map<String, Object> attrs = new HashMap<>();
        interceptor.preSend(connectMessage(attrs, null), null);
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) attrs.get(WebSocketAuthInterceptor.ROLES_SESSION_KEY);
        assertThat(roles).contains("ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_SIMULATION", "ROLE_TRAINEE");
    }

    @Test
    void prodProfileWithoutKeysRejectsConnect() {
        WebSocketAuthInterceptor interceptor = disabledProdInterceptor();
        Map<String, Object> attrs = new HashMap<>();
        assertThrows(AccessDeniedException.class,
                () -> interceptor.preSend(connectMessage(attrs, null), null));
    }

    @Test
    void missingApiKeyRejectedWhenAuthEnabled() {
        WebSocketAuthInterceptor interceptor = enabledInterceptor();
        Map<String, Object> attrs = new HashMap<>();
        assertThrows(AccessDeniedException.class,
                () -> interceptor.preSend(connectMessage(attrs, null), null));
    }

    @Test
    void invalidApiKeyRejectedWhenAuthEnabled() {
        WebSocketAuthInterceptor interceptor = enabledInterceptor();
        Map<String, Object> attrs = new HashMap<>();
        assertThrows(AccessDeniedException.class,
                () -> interceptor.preSend(connectMessage(attrs, "wrong-key"), null));
    }

    @Test
    void masterKeyGrantsAdminRolesAndEnablesBroadcastSubscription() {
        WebSocketAuthInterceptor interceptor = enabledInterceptor();
        Map<String, Object> attrs = new HashMap<>();
        interceptor.preSend(connectMessage(attrs, MASTER_KEY), null);
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) attrs.get(WebSocketAuthInterceptor.ROLES_SESSION_KEY);
        assertThat(roles).contains("ROLE_ADMIN", "ROLE_INSTRUCTOR");

        assertDoesNotThrow(() ->
                interceptor.preSend(subscribeMessage(attrs, "/topic/events"), null));
    }

    @Test
    void sessionPreAuthenticatedRolesBypassApiKeyRequirement() {
        WebSocketAuthInterceptor interceptor = enabledInterceptor();
        Map<String, Object> attrs = new HashMap<>();
        attrs.put(WebSocketAuthInterceptor.ROLES_SESSION_KEY, List.of("ROLE_INSTRUCTOR"));
        assertDoesNotThrow(() ->
                interceptor.preSend(connectMessage(attrs, null), null));
    }

    @Test
    void traineeRoleCannotSubscribeToBroadcastTopics() {
        WebSocketAuthInterceptor interceptor = enabledInterceptor();
        Map<String, Object> attrs = new HashMap<>();
        attrs.put(WebSocketAuthInterceptor.ROLES_SESSION_KEY, List.of("ROLE_TRAINEE"));
        assertThrows(AccessDeniedException.class,
                () -> interceptor.preSend(subscribeMessage(attrs, "/topic/sessions"), null));
    }
}
