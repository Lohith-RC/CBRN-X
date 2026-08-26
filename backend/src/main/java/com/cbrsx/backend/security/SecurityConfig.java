package com.cbrsx.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.cors.CorsConfiguration;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Security configuration:
 * - Interactive dashboard users: username/password login persisted to the
 *   HTTP session (AuthController), CSRF-protected via double-submit cookie
 * - Machine clients (simulation engine): X-API-Key header via ApiKeyAuthFilter,
 *   exempt from CSRF because they never carry ambient cookie credentials
 * - CORS: strict origin allowlist from environment (unified with WebCorsConfig)
 * - Authorization: Granular Role-Based Access Control (RBAC)
 * - Security headers: CSP, HSTS, X-Frame-Options, etc.
 */
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    private final List<String> allowedOrigins;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public SecurityConfig(@Value("${cbrsx.cors.allowed-origins:http://localhost:3000,http://localhost:5000}") String allowedOrigins) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split("\\s*,\\s*"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public org.springframework.web.filter.ForwardedHeaderFilter forwardedHeaderFilter() {
        return new org.springframework.web.filter.ForwardedHeaderFilter();
    }

    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieName("CBRSX-XSRF");
        // 12h, matches typical instructor session lifetime
        repository.setCookieMaxAge(12 * 60 * 60);
        return repository;
    }

    private boolean isApiKeyRequest(HttpServletRequest request) {
        return request.getHeader(ApiKeyAuthFilter.API_KEY_HEADER) != null;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ApiKeyAuthFilter apiKeyAuthFilter) throws Exception {
        CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();

        http
                // CSRF: double-submit cookie for browser sessions; API-key clients bypass
                // because requests authenticated by an explicit header are not cookie-driven
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository())
                        .csrfTokenRequestHandler(csrfRequestHandler)
                        .ignoringRequestMatchers(this::isApiKeyRequest)
                )

                // Session: IF_REQUIRED — interactive logins persist across requests
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .securityContext(security -> security.requireExplicitSave(false))

                // [SEC-06] CORS configuration — unified with WebCorsConfig via shared env property
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(allowedOrigins);
                    config.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
                    config.setAllowedHeaders(List.of("Content-Type", "X-API-Key", "Authorization", "X-XSRF-TOKEN"));
                    config.setExposedHeaders(List.of("Retry-After", "X-CBRSX-Total-Matching", "X-CBRSX-Truncated"));
                    config.setAllowCredentials(true);
                    config.setMaxAge(3600L);
                    return config;
                }))

                // Granular Role-Based Access Control
                .authorizeHttpRequests(auth -> auth
                        // Public status, health checks, and Swagger / OpenAPI documentation
                        .requestMatchers("/", "/error", "/actuator/health").permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        // WebSocket handshake (STOMP frames verified via WebSocketAuthInterceptor)
                        .requestMatchers("/ws-telemetry/**").permitAll()
                        // Interactive login/logout/session endpoints (rate-limited in AuthController)
                        .requestMatchers("/api/auth/login", "/api/auth/csrf", "/api/auth/logout").permitAll()

                        // Simulation device ingestion endpoints
                        .requestMatchers(HttpMethod.POST, "/api/events/**").hasAnyRole("SIMULATION", "ADMIN", "INSTRUCTOR")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/start").hasAnyRole("SIMULATION", "ADMIN", "INSTRUCTOR")

                        // Instructor operations (dashboard stats, debriefs, session completions)
                        .requestMatchers("/api/dashboard/**").hasAnyRole("INSTRUCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/sessions").hasAnyRole("INSTRUCTOR", "ADMIN")
                        // Must precede the catch-all: full-dataset export is instructor-only,
                        // never available to plain TRAINEE-authenticated callers
                        .requestMatchers(HttpMethod.GET, "/api/sessions/export").hasAnyRole("INSTRUCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/complete").hasAnyRole("INSTRUCTOR", "ADMIN", "SIMULATION")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/void").hasAnyRole("INSTRUCTOR", "ADMIN")
                        .requestMatchers("/api/sessions/*/debrief").hasAnyRole("INSTRUCTOR", "ADMIN")

                        // Trainee & General inquiry endpoints
                        .requestMatchers("/api/scenarios/**").hasAnyRole("TRAINEE", "INSTRUCTOR", "SIMULATION", "ADMIN")
                        .requestMatchers("/api/trainees/**").hasAnyRole("TRAINEE", "INSTRUCTOR", "ADMIN")
                        .requestMatchers("/api/squads/**").hasAnyRole("INSTRUCTOR", "ADMIN", "SIMULATION")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/sessions/*/report").hasAnyRole("TRAINEE", "INSTRUCTOR", "ADMIN")
                        .requestMatchers("/api/sessions/*/events/**").hasAnyRole("TRAINEE", "INSTRUCTOR", "ADMIN")
                        .requestMatchers("/api/sessions/*/events").hasAnyRole("TRAINEE", "INSTRUCTOR", "ADMIN")

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
