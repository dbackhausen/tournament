package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.model.ParticipationRequest;
import de.eightbit.tc.tournament.model.Registration;
import de.eightbit.tc.tournament.model.Tournament;
import de.eightbit.tc.tournament.model.TournamentType;
import de.eightbit.tc.tournament.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EmailService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ofPattern("EEEE, dd.MM.yyyy", Locale.GERMAN);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

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

    public void sendRegistrationEmail(Registration registration, boolean isUpdate) {
        User user = registration.getUser();
        Tournament tournament = registration.getTournament();

        List<String> selectedTypes = registration.getSelectedTypes().stream()
                .map(EmailService::typeLabel)
                .collect(Collectors.toList());

        List<String> selectedDays = registration.getParticipationRequests().stream()
                .sorted(Comparator.comparing(ParticipationRequest::getDate).thenComparing(ParticipationRequest::getTime))
                .map(req -> req.getDate().format(DAY_FORMATTER) + " um " + req.getTime().format(TIME_FORMATTER) + " Uhr")
                .collect(Collectors.toList());

        Context context = new Context();
        context.setVariable("isUpdate", isUpdate);
        context.setVariable("firstName", user.getFirstName());
        context.setVariable("tournamentName", tournament.getName());
        context.setVariable("startDate", tournament.getStartDate().format(DATE_FORMATTER));
        context.setVariable("endDate", tournament.getEndDate().format(DATE_FORMATTER));
        context.setVariable("entryFee", tournament.getEntryFee());
        context.setVariable("deadline", tournament.getDeadline() != null
                ? tournament.getDeadline().format(DATETIME_FORMATTER) : null);
        context.setVariable("selectedTypes", selectedTypes);
        context.setVariable("selectedDays", selectedDays);
        context.setVariable("notes", registration.getNotes());

        String html = templateEngine.process("registration-email", context);
        String subject = (isUpdate ? "Änderung deiner Anmeldung – " : "Anmeldebestätigung – ") + tournament.getName();
        send(user.getEmail(), subject, html);
    }

    public void sendWithdrawalEmail(Registration registration) {
        User user = registration.getUser();
        Tournament tournament = registration.getTournament();

        Context context = new Context();
        context.setVariable("firstName", user.getFirstName());
        context.setVariable("tournamentName", tournament.getName());
        context.setVariable("startDate", tournament.getStartDate().format(DATE_FORMATTER));
        context.setVariable("endDate", tournament.getEndDate().format(DATE_FORMATTER));

        String html = templateEngine.process("registration-withdrawal-email", context);
        send(user.getEmail(), "Abmeldung bestätigt – " + tournament.getName(), html);
    }

    private static String typeLabel(TournamentType type) {
        return switch (type) {
            case SINGLE -> "Einzel";
            case DOUBLE -> "Doppel";
            case MIXED -> "Mixed";
        };
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
