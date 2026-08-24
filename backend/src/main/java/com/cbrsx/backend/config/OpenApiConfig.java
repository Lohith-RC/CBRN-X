package com.cbrsx.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3 & Swagger Documentation Configuration for CBRS-X Platform.
 * Configures the interactive API testing metadata and X-API-Key security scheme.
 */
@Configuration
public class OpenApiConfig {

    private static final String API_KEY_SCHEME_NAME = "X-API-Key";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CBRS-X Tactical Backend API")
                        .version("1.0.0")
                        .description("Virtual Reality Chemical, Biological, Radiological & Nuclear (CBRN) Disaster Response Training Platform. " +
                                "Provides high-frequency simulation telemetry ingestion, automated rule-based evaluation, timeline After-Action Review (AAR), and tamper-evident certificate generation.")
                        .contact(new Contact()
                                .name("CBRS-X Engineering Team")
                                .url("https://github.com/Lohith-RC/CBRN-X"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .addSecurityItem(new SecurityRequirement().addList(API_KEY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(API_KEY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name("X-API-Key")
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.HEADER)
                                        .description("Supply the master CBRS-X API key or role-scoped key (ROLE_INSTRUCTOR, ROLE_SIMULATION, ROLE_TRAINEE).")));
    }
}
