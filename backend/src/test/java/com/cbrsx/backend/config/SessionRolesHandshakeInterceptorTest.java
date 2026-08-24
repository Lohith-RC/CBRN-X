package com.cbrsx.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the handshake interceptor that copies ROLE_* authorities from
 * the authenticated HTTP session into WebSocket handshake attributes.
 */
class SessionRolesHandshakeInterceptorTest {

    private final SessionRolesHandshakeInterceptor interceptor = new SessionRolesHandshakeInterceptor();

    private MockHttpServletRequest requestWithSessionAuthentication(
            UsernamePasswordAuthenticationToken authentication) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession();
        if (authentication != null) {
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    new SecurityContextImpl(authentication));
        }
        request.setSession(session);
        return request;
    }

    @Test
    void copiesRoleAuthoritiesFromSessionSecurityContext() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin", null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_INSTRUCTOR")));
        MockHttpServletRequest request = requestWithSessionAuthentication(auth);

        Map<String, Object> attributes = new HashMap<>();
        boolean proceed = interceptor.beforeHandshake(
                new ServletServerHttpRequest(request),
                new ServletServerHttpResponse(new org.springframework.mock.web.MockHttpServletResponse()),
                null, attributes);

        assertThat(proceed).isTrue();
        assertThat((List<String>) attributes.get(WebSocketAuthInterceptor.ROLES_SESSION_KEY))
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_INSTRUCTOR");
    }

    @Test
    void neverBlocksHandshakeWhenNoSessionPresent() {
        MockHttpServletRequest request = new MockHttpServletRequest(); // no session
        Map<String, Object> attributes = new HashMap<>();
        boolean proceed = interceptor.beforeHandshake(
                new ServletServerHttpRequest(request),
                new ServletServerHttpResponse(new org.springframework.mock.web.MockHttpServletResponse()),
                null, attributes);
        assertThat(proceed).isTrue();
        assertThat(attributes).doesNotContainKey(WebSocketAuthInterceptor.ROLES_SESSION_KEY);
    }

    @Test
    void ignoresNonRoleAuthorities() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin", null,
                List.of(new SimpleGrantedAuthority("SCOPE_read"), new SimpleGrantedAuthority("ROLE_INSTRUCTOR")));
        MockHttpServletRequest request = requestWithSessionAuthentication(auth);

        Map<String, Object> attributes = new HashMap<>();
        interceptor.beforeHandshake(
                new ServletServerHttpRequest(request),
                new ServletServerHttpResponse(new org.springframework.mock.web.MockHttpServletResponse()),
                null, attributes);

        assertThat((List<String>) attributes.get(WebSocketAuthInterceptor.ROLES_SESSION_KEY))
                .containsExactly("ROLE_INSTRUCTOR");
    }
}
