package com.cbrsx.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Security configuration:
 * - CSRF disabled (stateless REST API, no cookies/sessions)
 * - Session management: STATELESS
 * - CORS: strict origin allowlist from environment (unified with WebCorsConfig)
 * - Authentication: handled by ApiKeyAuthFilter at filter level
 * - Authorization: Granular Role-Based Access Control (RBAC)
 * - Security headers: CSP, HSTS, X-Frame-Options, etc.
 *
 * [SEC-06] CORS origins are now read from ${cbrsx.cors.allowed-origins} instead
 *          of being hardcoded, ensuring consistency with WebCorsConfig and
 *          correct behavior across all deployment environments.
 */
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    private final List<String> allowedOrigins;

    public SecurityConfig(@Value("${cbrsx.cors.allowed-origins:http://localhost:3000,http://localhost:5000}") String allowedOrigins) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split("\\s*,\\s*"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ApiKeyAuthFilter apiKeyAuthFilter) throws Exception {
        http
                // CSRF: Disabled for stateless REST API
                .csrf(csrf -> csrf.disable())

                // Session: Stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // [SEC-06] CORS configuration — unified with WebCorsConfig via shared env property
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(allowedOrigins);
                    config.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
                    config.setAllowedHeaders(List.of("Content-Type", "X-API-Key", "Authorization"));
                    config.setExposedHeaders(List.of("Retry-After"));
                    config.setAllowCredentials(false);
                    config.setMaxAge(3600L);
                    return config;
                }))

                // Granular Role-Based Access Control
                .authorizeHttpRequests(auth -> auth
                        // Public status, health checks, and Swagger / OpenAPI documentation
                        .requestMatchers("/", "/error", "/actuator/health", "/actuator/info", "/actuator/metrics/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        // WebSocket handshake (STOMP frames verified via WebSocketAuthInterceptor)
                        .requestMatchers("/ws-telemetry/**").permitAll()

                        // Simulation device ingestion endpoints
                        .requestMatchers(HttpMethod.POST, "/api/events/**").hasAnyRole("SIMULATION", "ADMIN", "INSTRUCTOR")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/start").hasAnyRole("SIMULATION", "ADMIN", "INSTRUCTOR")

                        // Instructor operations (dashboard stats, debriefs, session completions)
                        .requestMatchers("/api/dashboard/**").hasAnyRole("INSTRUCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/complete").hasAnyRole("INSTRUCTOR", "ADMIN", "SIMULATION")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/void").hasAnyRole("INSTRUCTOR", "ADMIN")
                        .requestMatchers("/api/sessions/*/debrief").hasAnyRole("INSTRUCTOR", "ADMIN")

                        // Trainee & General inquiry endpoints
                        .requestMatchers("/api/scenarios/**").hasAnyRole("TRAINEE", "INSTRUCTOR", "SIMULATION", "ADMIN")
                        .requestMatchers("/api/sessions/*/report").hasAnyRole("TRAINEE", "INSTRUCTOR", "ADMIN")

                        // Catch-all API security
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().authenticated()
                )

                // Security Headers
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; frame-ancestors 'none'; form-action 'self'")
                        )
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                        )
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)
                        )
                        .contentTypeOptions(contentType -> {})
                )

                // API Key filter runs before Spring Security's filters
                .addFilterBefore(apiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
