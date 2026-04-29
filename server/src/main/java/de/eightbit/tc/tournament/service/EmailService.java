package de.eightbit.tc.tournament.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Base64;

@Service
public class EmailService {

    private final TemplateEngine templateEngine;
    private final RestClient restClient;

    @Value("${mail.from}")
    private String from;

    @Value("${mailgun.domain}")
    private String domain;

    public EmailService(TemplateEngine templateEngine,
                        @Value("${mailgun.api-key}") String apiKey) {
        this.templateEngine = templateEngine;
        String credentials = Base64.getEncoder().encodeToString(("api:" + apiKey).getBytes());
        this.restClient = RestClient.builder()
                .defaultHeader("Authorization", "Basic " + credentials)
                .build();
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
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("from", from);
            form.add("to", to);
            form.add("subject", subject);
            form.add("html", html);

            restClient.post()
                    .uri("https://api.mailgun.net/v3/{domain}/messages", domain)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email to " + to, e);
        }
    }
}
