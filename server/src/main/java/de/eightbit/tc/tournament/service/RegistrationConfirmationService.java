package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.model.User;
import de.eightbit.tc.tournament.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class RegistrationConfirmationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public void sendConfirmationEmail(User user) {
        String token = UUID.randomUUID().toString();
        user.setConfirmationToken(token);
        user.setConfirmationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);
        String confirmLink = frontendUrl + "/confirm?token=" + token;
        emailService.sendConfirmationEmail(user.getEmail(), user.getFirstName(), confirmLink);
    }

    @Transactional
    public void confirmRegistration(String token) {
        User user = userRepository.findByConfirmationToken(token)
                .orElseThrow(() -> new RuntimeException("Ungültiger oder abgelaufener Link"));

        if (user.isActive()) {
            return; // idempotent
        }

        if (user.getConfirmationTokenExpiry() == null
                || LocalDateTime.now().isAfter(user.getConfirmationTokenExpiry())) {
            throw new RuntimeException("Bestätigungslink abgelaufen. Bitte registriere dich erneut.");
        }

        user.setActive(true);
        user.setConfirmationToken(null);
        user.setConfirmationTokenExpiry(null);
        userRepository.save(user);

        String fullName = user.getFirstName() + " " + user.getLastName();
        userService.getAllAdmins().forEach(admin ->
                emailService.sendAdminNotificationEmail(admin.getEmail(), fullName, user.getEmail())
        );
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void deleteExpiredUnconfirmedUsers() {
        userRepository.deleteExpiredUnconfirmedUsers(LocalDateTime.now());
    }
}
