package de.eightbit.tc.tournament;

import de.eightbit.tc.tournament.model.Role;
import de.eightbit.tc.tournament.model.User;
import de.eightbit.tc.tournament.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            return;
        }
        if (!userService.getAllAdmins().isEmpty()) {
            return;
        }

        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setFirstName("Admin");
        admin.setLastName("Admin");
        admin.setGender("d");
        admin.setMobile("-");
        admin.setActive(true);
        admin.getRoles().add(Role.ADMIN);
        admin.getRoles().add(Role.PLAYER);

        userService.createUser(admin);
        log.warn("Initial admin user created: {}", adminEmail);
        log.warn("Remove APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD env vars after first login.");
    }
}
