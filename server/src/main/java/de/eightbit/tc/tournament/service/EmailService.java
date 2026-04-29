package de.eightbit.tc.tournament.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${mail.from}")
    private String from;

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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email to " + to, e);
        }
    }
}
