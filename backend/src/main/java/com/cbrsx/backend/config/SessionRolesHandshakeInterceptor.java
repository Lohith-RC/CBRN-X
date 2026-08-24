package com.cbrsx.backend.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Captures the authenticated instructor session during the WebSocket upgrade.
 *
 * Browser clients reach /ws-telemetry same-origin, so the JSESSIONID cookie is
 * attached automatically. This interceptor copies the ROLE_* authorities from
 * the Spring Security HTTP session into the WebSocket handshake attributes,
 * where {@link WebSocketAuthInterceptor} picks them up at STOMP CONNECT time.
 *
 * Machine clients (simulation engine) are unaffected: they keep authenticating
 * with the X-API-Key STOMP header, and this interceptor simply stores nothing
 * for them, leaving the API-key path as the fallback.
 */
public class SessionRolesHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            var httpSession = servletRequest.getServletRequest().getSession(false);
            if (httpSession != null) {
                Object contextObj = httpSession
                        .getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
                if (contextObj instanceof SecurityContext securityContext) {
                    Authentication authentication = securityContext.getAuthentication();
                    if (authentication != null && authentication.isAuthenticated()) {
                        List<String> roles = authentication.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .filter(authority -> authority.startsWith("ROLE_"))
                                .collect(Collectors.toList());
                        if (!roles.isEmpty()) {
                            attributes.put(WebSocketAuthInterceptor.ROLES_SESSION_KEY, roles);
                        }
                    }
                }
            }
        }
        // Never block the handshake: authorization is enforced at STOMP CONNECT.
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}
