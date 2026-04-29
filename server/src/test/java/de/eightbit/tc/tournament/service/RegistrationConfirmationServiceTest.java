package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.model.User;
import de.eightbit.tc.tournament.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationConfirmationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private EmailService emailService;
    @Mock private UserService userService;
    @InjectMocks private RegistrationConfirmationService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:4200");
    }

    @Test
    void sendConfirmationEmail_savesTokenAndSendsEmail() {
        User user = new User();
        user.setEmail("player@tc69.de");
        user.setFirstName("Max");

        service.sendConfirmationEmail(user);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getConfirmationToken()).isNotNull().isNotEmpty();
        assertThat(saved.getConfirmationTokenExpiry()).isAfter(LocalDateTime.now());
        verify(emailService).sendConfirmationEmail(
                eq("player@tc69.de"),
                eq("Max"),
                contains(saved.getConfirmationToken())
        );
    }

    @Test
    void confirmRegistration_validToken_activatesUserAndNotifiesAdmins() {
        User user = new User();
        user.setEmail("player@tc69.de");
        user.setFirstName("Max");
        user.setLastName("Mustermann");
        user.setConfirmationToken("valid-token");
        user.setConfirmationTokenExpiry(LocalDateTime.now().plusHours(12));
        user.setActive(false);

        User admin = new User();
        admin.setEmail("admin@tc69.de");

        when(userRepository.findByConfirmationToken("valid-token")).thenReturn(Optional.of(user));
        when(userService.getAllAdmins()).thenReturn(List.of(admin));

        service.confirmRegistration("valid-token");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getConfirmationToken()).isNull();
        assertThat(saved.getConfirmationTokenExpiry()).isNull();
        verify(emailService).sendAdminNotificationEmail(
                eq("admin@tc69.de"),
                eq("Max Mustermann"),
                eq("player@tc69.de")
        );
    }

    @Test
    void confirmRegistration_alreadyActive_returnsWithoutSaving() {
        User user = new User();
        user.setActive(true);
        user.setConfirmationToken("token");
        user.setConfirmationTokenExpiry(LocalDateTime.now().plusHours(1));

        when(userRepository.findByConfirmationToken("token")).thenReturn(Optional.of(user));

        service.confirmRegistration("token");

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendAdminNotificationEmail(any(), any(), any());
    }

    @Test
    void confirmRegistration_expiredToken_throwsWithoutSaving() {
        User user = new User();
        user.setConfirmationToken("expired-token");
        user.setConfirmationTokenExpiry(LocalDateTime.now().minusMinutes(1));
        user.setActive(false);

        when(userRepository.findByConfirmationToken("expired-token")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.confirmRegistration("expired-token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("abgelaufen");

        verify(userRepository, never()).save(any());
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void confirmRegistration_unknownToken_throws() {
        when(userRepository.findByConfirmationToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.confirmRegistration("bad-token"))
                .isInstanceOf(RuntimeException.class);

        verify(userRepository, never()).save(any());
        verify(userRepository, never()).delete(any(User.class));
    }
}
