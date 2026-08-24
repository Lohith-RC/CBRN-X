package com.cbrsx.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CORS configuration with strict origin validation.
 * Only explicitly listed origins are permitted. No wildcards.
 */
@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    private final Set<String> allowedOrigins;

    public WebCorsConfig(@Value("${cbrsx.cors.allowed-origins}") String allowedOrigins) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split("\\s*,\\s*"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "OPTIONS")
                // Only allow headers actually used by the application
                .allowedHeaders("Content-Type", "X-API-Key", "Authorization", "Accept")
                .exposedHeaders("Retry-After")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
