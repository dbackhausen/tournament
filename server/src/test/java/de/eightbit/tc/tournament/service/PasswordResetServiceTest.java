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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(passwordResetService, "frontendUrl", "http://localhost:4200");
    }

    @Test
    void requestReset_knownEmail_savesTokenAndSendsEmail() {
        User user = new User();
        user.setEmail("player@tc69.de");
        when(userRepository.findByEmail("player@tc69.de")).thenReturn(Optional.of(user));

        passwordResetService.requestReset("player@tc69.de");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getResetToken()).isNotNull().isNotEmpty();
        assertThat(saved.getResetTokenExpiry()).isAfter(LocalDateTime.now());
        verify(emailService).sendResetEmail(eq("player@tc69.de"), contains(saved.getResetToken()));
    }

    @Test
    void requestReset_unknownEmail_doesNothing() {
        when(userRepository.findByEmail("unknown@tc69.de")).thenReturn(Optional.empty());

        passwordResetService.requestReset("unknown@tc69.de");

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendResetEmail(anyString(), anyString());
    }

    @Test
    void resetPassword_validToken_updatesPasswordAndClearsToken() {
        User user = new User();
        user.setResetToken("valid-token");
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        when(userRepository.findByResetToken("valid-token")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newSecret")).thenReturn("$2a$hashed");

        passwordResetService.resetPassword("valid-token", "newSecret");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getPassword()).isEqualTo("$2a$hashed");
        assertThat(saved.getResetToken()).isNull();
        assertThat(saved.getResetTokenExpiry()).isNull();
    }

    @Test
    void resetPassword_expiredToken_throwsException() {
        User user = new User();
        user.setResetToken("expired-token");
        user.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByResetToken("expired-token")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> passwordResetService.resetPassword("expired-token", "newSecret"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("expired");

        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_unknownToken_throwsException() {
        when(userRepository.findByResetToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword("bad-token", "newSecret"))
                .isInstanceOf(RuntimeException.class);

        verify(userRepository, never()).save(any());
    }
}
