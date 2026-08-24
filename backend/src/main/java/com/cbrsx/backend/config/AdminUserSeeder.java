package com.cbrsx.backend.config;

import com.cbrsx.backend.entity.InstructorUser;
import com.cbrsx.backend.repository.InstructorUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the first ADMIN account on startup when instructor_users is empty.
 * Credentials come from CBRSX_ADMIN_USERNAME / CBRSX_ADMIN_PASSWORD.
 * A default dev password is used only when none is configured; a loud
 * warning is logged so operators cannot miss it.
 */
@Component
public class AdminUserSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserSeeder.class);

    public static final String DEFAULT_DEV_PASSWORD = "ndrf-admin-123";

    private final InstructorUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPassword;

    public AdminUserSeeder(InstructorUserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           @Value("${cbrsx.admin.username:admin}") String adminUsername,
                           @Value("${cbrsx.admin.password:" + DEFAULT_DEV_PASSWORD + "}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername == null ? "admin" : adminUsername.trim();
        this.adminPassword = adminPassword == null ? "" : adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }

        InstructorUser admin = new InstructorUser();
        admin.setUsername(adminUsername);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setDisplayName("Command Administrator");
        admin.setUnit("NDRF Command");
        admin.setRole(InstructorUser.ROLE_ADMIN);
        admin.setEnabled(true);
        userRepository.save(admin);

        if (DEFAULT_DEV_PASSWORD.equals(adminPassword)) {
            log.warn("===================================================================");
            log.warn("DEFAULT ADMIN PASSWORD IN USE: username='{}' password='{}'", adminUsername, DEFAULT_DEV_PASSWORD);
            log.warn("Set CBRSX_ADMIN_PASSWORD and change this account before production use.");
            log.warn("===================================================================");
        } else {
            log.info("Seeded initial administrator account '{}'", adminUsername);
        }
    }
}
