package de.eightbit.tc.tournament.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final RestClient restClient;
    private final TemplateEngine templateEngine;

    @Value("${mail.from}")
    private String from;

    public EmailService(
            @Value("${brevo.api-key}") String apiKey,
            TemplateEngine templateEngine) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.brevo.com/v3")
                .defaultHeader("api-key", apiKey)
                .build();
        this.templateEngine = templateEngine;
    }

    public void sendResetEmail(String to, String resetLink) {
        Context context = new Context();
        context.setVariable("resetLink", resetLink);
        String html = templateEngine.process("reset-email", context);
        send(to, "Passwort zurücksetzen – TC69", html);
    }

    public void sendConfirmationEmail(String to, String firstName, String confirmLink) {
        Context context = new Context();
        context.setVariable("firstName", firstName);
        context.setVariable("confirmLink", confirmLink);
        String html = templateEngine.process("confirmation-email", context);
        send(to, "E-Mail bestätigen – TC69", html);
    }

    public void sendAdminNotificationEmail(String to, String fullName, String email) {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        context.setVariable("email", email);
        String html = templateEngine.process("admin-notification-email", context);
        send(to, "Neue Registrierung – TC69", html);
    }

    private void send(String to, String subject, String html) {
        Map<String, Object> body = Map.of(
                "sender", Map.of("name", "TC69", "email", from),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "htmlContent", html
        );
        restClient.post()
                .uri("/smtp/email")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }
}
