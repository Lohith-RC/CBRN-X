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

/**
 * [SEC-01 FIX] STOMP-level authentication interceptor.
 * Validates the API key during the WebSocket STOMP CONNECT handshake,
 * preventing unauthenticated clients from subscribing to telemetry topics.
 *
 * Clients must send the API key as a STOMP native header:
 *   CONNECT
 *   X-API-Key: <api-key-value>
 *   ...
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);
    private static final String API_KEY_HEADER = "X-API-Key";

    private final String configuredApiKey;
    private final boolean authEnabled;

    public WebSocketAuthInterceptor(@Value("${cbrsx.api-key:}") String configuredApiKey) {
        String key = configuredApiKey == null ? "" : configuredApiKey.trim();
        this.configuredApiKey = key;
        this.authEnabled = !key.isEmpty();
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            if (authEnabled) {
                String providedKey = accessor.getFirstNativeHeader(API_KEY_HEADER);
                if (providedKey == null || providedKey.isBlank()) {
                    log.warn("WebSocket CONNECT rejected: missing {} header from session {}",
                            API_KEY_HEADER, accessor.getSessionId());
                    throw new AccessDeniedException("Unauthorized: Missing X-API-Key in STOMP CONNECT frame");
                }
                if (!configuredApiKey.equals(providedKey)) {
                    log.warn("WebSocket CONNECT rejected: invalid API key from session {}",
                            accessor.getSessionId());
                    throw new AccessDeniedException("Unauthorized: Invalid API key in STOMP CONNECT frame");
                }
                log.debug("WebSocket CONNECT authenticated for session {}", accessor.getSessionId());
            }
        }
        return message;
    }
}
