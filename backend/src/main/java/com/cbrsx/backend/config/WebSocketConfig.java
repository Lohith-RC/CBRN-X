package com.cbrsx.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

/**
 * WebSocket and STOMP message broker configuration.
 * Enables real-time telemetry broadcast to the Instructor Dashboard.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final String[] allowedOrigins;

    public WebSocketConfig(@Value("${cbrsx.cors.allowed-origins:http://localhost:80,http://localhost:3000,http://localhost:5000}") String allowedOrigins) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split("\\s*,\\s*"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-memory message broker with destination prefixes for client subscriptions
        config.enableSimpleBroker("/topic");
        // Prefix for messages destined for @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Pure WebSocket endpoint for direct STOMP clients
        registry.addEndpoint("/ws-telemetry")
                .setAllowedOrigins(allowedOrigins);

        // Fallback SockJS endpoint for legacy browser environments
        registry.addEndpoint("/ws-telemetry")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS();
    }
}
