# Password Reset Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full password-reset flow — email form, token-based reset link, and new-password form — backed by a Spring Boot email service and two new public API endpoints.

**Architecture:** A UUID token is stored directly on the `User` entity (with a 1-hour expiry). `PasswordResetService` owns all reset logic. `EmailService` renders a Thymeleaf HTML template and sends it via `JavaMailSender`. Two new Angular standalone components (`ForgotPasswordComponent`, `ResetPasswordComponent`) match the existing login card design.

**Tech Stack:** Spring Boot 3.3 · Spring Mail (already in build.gradle) · Thymeleaf (already in build.gradle) · JUnit 5 · Mockito · Angular 19 · PrimeNG · Reactive Forms

---

## File Map

### Backend — Create
| File | Responsibility |
|------|----------------|
| `server/src/main/java/de/eightbit/tc/tournament/dto/ForgotPasswordRequest.java` | DTO: email field with `@NotBlank @Email` |
| `server/src/main/java/de/eightbit/tc/tournament/dto/ResetPasswordRequest.java` | DTO: token + newPassword with `@NotBlank` |
| `server/src/main/java/de/eightbit/tc/tournament/service/EmailService.java` | Renders Thymeleaf template, sends via `JavaMailSender` |
| `server/src/main/java/de/eightbit/tc/tournament/service/PasswordResetService.java` | Token generation, email trigger, password update |
| `server/src/main/resources/templates/reset-email.html` | Thymeleaf HTML email template |
| `server/src/test/resources/application-local.properties` | H2 + dummy mail settings for tests |
| `server/src/test/java/de/eightbit/tc/tournament/service/PasswordResetServiceTest.java` | Unit tests for PasswordResetService |
| `server/src/test/java/de/eightbit/tc/tournament/controller/AuthControllerPasswordResetTest.java` | Web layer tests for new endpoints |

### Backend — Modify
| File | What Changes |
|------|-------------|
| `server/src/main/java/de/eightbit/tc/tournament/model/User.java` | Add `resetToken: String`, `resetTokenExpiry: LocalDateTime` |
| `server/src/main/java/de/eightbit/tc/tournament/repository/UserRepository.java` | Add `findByResetToken(String token)` |
| `server/src/main/java/de/eightbit/tc/tournament/controller/AuthController.java` | Add two new endpoints + `@Autowired PasswordResetService` |
| `server/src/main/java/de/eightbit/tc/tournament/SecurityConfig.java` | Permit `/api/auth/forgot-password` and `/api/auth/reset-password` |
| `server/src/main/resources/application-local.properties` | Add SMTP and app.frontend-url config |
| `server/src/main/resources/application-azure.properties` | Add SMTP env vars and FRONTEND_URL |

### Frontend — Create
| File | Responsibility |
|------|----------------|
| `client/src/app/components/forgot-password/forgot-password.component.ts` | Email form, always shows neutral success after submit |
| `client/src/app/components/forgot-password/forgot-password.component.html` | Login-card-style template |
| `client/src/app/components/forgot-password/forgot-password.component.scss` | Shared login-card styles |
| `client/src/app/components/reset-password/reset-password.component.ts` | Token from URL, password + confirm form, update on submit |
| `client/src/app/components/reset-password/reset-password.component.html` | Login-card-style template |
| `client/src/app/components/reset-password/reset-password.component.scss` | Shared login-card styles |

### Frontend — Modify
| File | What Changes |
|------|-------------|
| `client/src/app/services/auth.service.ts` | Add `forgotPassword()` and `resetPassword()` |
| `client/src/app/app.routes.ts` | Add `/reset` and `/reset-confirm` routes |

---

## Chunk 1: Backend

### Task 1: Test properties + User entity + UserRepository

**Files:**
- Create: `server/src/test/resources/application-local.properties`
- Modify: `server/src/main/java/de/eightbit/tc/tournament/model/User.java`
- Modify: `server/src/main/java/de/eightbit/tc/tournament/repository/UserRepository.java`

- [ ] **Step 1: Create test properties file**

Create `server/src/test/resources/application-local.properties` with this content:

```properties
# H2 in-memory database for tests
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=false

# JWT
jwt.secret=TestSecretKeyForJWTThatIsLongEnough1234567890
jwt.expiration=86400000

# Mail (dummy — no real SMTP in tests)
spring.mail.host=localhost
spring.mail.port=25
mail.from=test@tc69.de

# Frontend URL
app.frontend-url=http://localhost:4200

# Security
cors.allowed-origin=http://localhost:4200
```

- [ ] **Step 2: Add resetToken fields to User entity**

In `server/src/main/java/de/eightbit/tc/tournament/model/User.java`, add these two fields after the existing `active` field:

```java
private String resetToken;
private LocalDateTime resetTokenExpiry;
```

Also add the import at the top:

```java
import java.time.LocalDateTime;
```

- [ ] **Step 3: Add findByResetToken to UserRepository**

In `server/src/main/java/de/eightbit/tc/tournament/repository/UserRepository.java`, add:

```java
Optional<User> findByResetToken(String resetToken);
```

- [ ] **Step 4: Verify context loads**

```bash
cd server && ./gradlew test --tests "de.eightbit.tc.tournament.TournamentApplicationTests"
```

Expected: `BUILD SUCCESSFUL` — the context loads with H2 and dummy mail settings.

- [ ] **Step 5: Commit**

```bash
git add server/src/test/resources/application-local.properties \
        server/src/main/java/de/eightbit/tc/tournament/model/User.java \
        server/src/main/java/de/eightbit/tc/tournament/repository/UserRepository.java
git commit -m "feat: add resetToken fields to User and test properties"
```

---

### Task 2: DTOs + properties config

**Files:**
- Create: `server/src/main/java/de/eightbit/tc/tournament/dto/ForgotPasswordRequest.java`
- Create: `server/src/main/java/de/eightbit/tc/tournament/dto/ResetPasswordRequest.java`
- Modify: `server/src/main/resources/application-local.properties`
- Modify: `server/src/main/resources/application-azure.properties`

- [ ] **Step 1: Create ForgotPasswordRequest DTO**

Create `server/src/main/java/de/eightbit/tc/tournament/dto/ForgotPasswordRequest.java`:

```java
package de.eightbit.tc.tournament.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank
    @Email
    private String email;
}
```

- [ ] **Step 2: Create ResetPasswordRequest DTO**

Create `server/src/main/java/de/eightbit/tc/tournament/dto/ResetPasswordRequest.java`:

```java
package de.eightbit.tc.tournament.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank
    private String token;
    @NotBlank
    private String newPassword;
}
```

- [ ] **Step 3: Add SMTP config to local properties**

Append to `server/src/main/resources/application-local.properties`:

```properties
# Mail
spring.mail.host=smtp.yourprovider.com
spring.mail.port=587
spring.mail.username=your-smtp-username
spring.mail.password=your-smtp-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
mail.from=turnier@tc69.de

# Frontend URL (for reset links in emails)
app.frontend-url=http://localhost:4200
```

- [ ] **Step 4: Add SMTP config to azure properties**

Append to `server/src/main/resources/application-azure.properties`:

```properties
# Mail
spring.mail.host=${MAIL_HOST}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
mail.from=${MAIL_FROM}

# Frontend URL (for reset links in emails)
app.frontend-url=${FRONTEND_URL}
```

- [ ] **Step 5: Commit**

```bash
git add server/src/main/java/de/eightbit/tc/tournament/dto/ForgotPasswordRequest.java \
        server/src/main/java/de/eightbit/tc/tournament/dto/ResetPasswordRequest.java \
        server/src/main/resources/application-local.properties \
        server/src/main/resources/application-azure.properties
git commit -m "feat: add password reset DTOs and SMTP config"
```

---

### Task 3: Thymeleaf email template

**Files:**
- Create: `server/src/main/resources/templates/reset-email.html`

- [ ] **Step 1: Create the HTML email template**

Create `server/src/main/resources/templates/reset-email.html`:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Passwort zurücksetzen</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f0f4fa; font-family: Arial, sans-serif; }
    .wrapper { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px;
               box-shadow: 0 4px 24px rgba(0,0,0,0.10); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1c3a72 0%, #3570c4 100%);
              padding: 32px 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 1.5rem; margin: 0; letter-spacing: -0.02em; }
    .header p { color: #c5d8f7; font-size: 0.85rem; margin: 4px 0 0; }
    .body { padding: 32px; color: #2d3a55; }
    .body p { font-size: 0.95rem; line-height: 1.6; margin: 0 0 20px; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: #3570c4; color: #ffffff; text-decoration: none;
           padding: 14px 32px; border-radius: 8px; font-size: 1rem; font-weight: 600; }
    .footer { padding: 16px 32px; border-top: 1px solid #e8ecf4;
              font-size: 0.78rem; color: #8a97b3; text-align: center; }
    .link-fallback { word-break: break-all; font-size: 0.78rem; color: #5a6a8a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>TC69 Turnierverwaltung</h1>
      <p>Passwort zurücksetzen</p>
    </div>
    <div class="body">
      <p>Hallo,</p>
      <p>wir haben eine Anfrage erhalten, das Passwort deines Accounts zurückzusetzen.
         Klicke auf den folgenden Button, um ein neues Passwort zu vergeben. Der Link ist
         <strong>1 Stunde</strong> gültig.</p>
      <div class="btn-wrap">
        <a th:href="${resetLink}" class="btn">Passwort zurücksetzen</a>
      </div>
      <p>Falls du keine Passwort-Anfrage gestellt hast, kannst du diese E-Mail ignorieren.
         Dein Passwort bleibt unverändert.</p>
      <p class="link-fallback">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br/>
        <span th:text="${resetLink}"></span>
      </p>
    </div>
    <div class="footer">
      TC69 Tennisclub &middot; Diese E-Mail wurde automatisch generiert.
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add server/src/main/resources/templates/reset-email.html
git commit -m "feat: add password reset email template"
```

---

### Task 4: EmailService

**Files:**
- Create: `server/src/main/java/de/eightbit/tc/tournament/service/EmailService.java`

- [ ] **Step 1: Create EmailService**

Create `server/src/main/java/de/eightbit/tc/tournament/service/EmailService.java`:

```java
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
        try {
            Context context = new Context();
            context.setVariable("resetLink", resetLink);
            String html = templateEngine.process("reset-email", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("Passwort zurücksetzen – TC69");
            helper.setText(html, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send reset email", e);
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/main/java/de/eightbit/tc/tournament/service/EmailService.java
git commit -m "feat: add EmailService for sending password reset emails"
```

---

### Task 5: PasswordResetService + unit tests

**Files:**
- Create: `server/src/main/java/de/eightbit/tc/tournament/service/PasswordResetService.java`
- Create: `server/src/test/java/de/eightbit/tc/tournament/service/PasswordResetServiceTest.java`

- [ ] **Step 1: Write failing tests first**

Create `server/src/test/java/de/eightbit/tc/tournament/service/PasswordResetServiceTest.java`:

```java
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
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
cd server && ./gradlew test --tests "de.eightbit.tc.tournament.service.PasswordResetServiceTest"
```

Expected: `FAILED` — `PasswordResetService` does not exist yet.

- [ ] **Step 3: Create PasswordResetService**

Create `server/src/main/java/de/eightbit/tc/tournament/service/PasswordResetService.java`:

```java
package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.model.User;
import de.eightbit.tc.tournament.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public void requestReset(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return;
        }
        User user = optionalUser.get();
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);
        String resetLink = frontendUrl + "/reset-confirm?token=" + token;
        emailService.sendResetEmail(user.getEmail(), resetLink);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));
        if (user.getResetTokenExpiry() == null || LocalDateTime.now().isAfter(user.getResetTokenExpiry())) {
            throw new RuntimeException("Invalid or expired token");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
cd server && ./gradlew test --tests "de.eightbit.tc.tournament.service.PasswordResetServiceTest"
```

Expected: `BUILD SUCCESSFUL`, all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add server/src/main/java/de/eightbit/tc/tournament/service/PasswordResetService.java \
        server/src/test/java/de/eightbit/tc/tournament/service/PasswordResetServiceTest.java
git commit -m "feat: add PasswordResetService with token generation and password update"
```

---

### Task 6: AuthController endpoints + SecurityConfig

**Files:**
- Modify: `server/src/main/java/de/eightbit/tc/tournament/controller/AuthController.java`
- Modify: `server/src/main/java/de/eightbit/tc/tournament/SecurityConfig.java`

- [ ] **Step 1: Add two new endpoints to AuthController**

In `AuthController.java`, add the `PasswordResetService` autowire field after the existing `@Autowired` fields:

```java
@Autowired
private PasswordResetService passwordResetService;
```

Then add the two new methods at the end of the class, before the closing `}`:

```java
@PostMapping("/forgot-password")
public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    passwordResetService.requestReset(request.getEmail());
    return ResponseEntity.ok("Reset email sent if address is registered");
}

@PostMapping("/reset-password")
public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    try {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok("Password updated successfully");
    } catch (RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token");
    }
}
```

Also add the missing import at the top of `AuthController.java`:

```java
import de.eightbit.tc.tournament.service.PasswordResetService;
```

- [ ] **Step 2: Permit new endpoints in SecurityConfig**

In `SecurityConfig.java`, replace the existing line:

```java
.requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
```

with:

```java
.requestMatchers("/api/auth/register", "/api/auth/login",
        "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
```

- [ ] **Step 3: Verify build compiles**

```bash
cd server && ./gradlew build -x test
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add server/src/main/java/de/eightbit/tc/tournament/controller/AuthController.java \
        server/src/main/java/de/eightbit/tc/tournament/SecurityConfig.java
git commit -m "feat: add forgot-password and reset-password endpoints to AuthController"
```

---

### Task 7: AuthController integration tests

**Files:**
- Create: `server/src/test/java/de/eightbit/tc/tournament/controller/AuthControllerPasswordResetTest.java`

- [ ] **Step 1: Write the controller tests**

Create `server/src/test/java/de/eightbit/tc/tournament/controller/AuthControllerPasswordResetTest.java`:

```java
package de.eightbit.tc.tournament.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.eightbit.tc.tournament.dto.ForgotPasswordRequest;
import de.eightbit.tc.tournament.dto.ResetPasswordRequest;
import de.eightbit.tc.tournament.service.PasswordResetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerPasswordResetTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PasswordResetService passwordResetService;

    @Test
    void forgotPassword_validEmail_returns200() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("player@tc69.de");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(passwordResetService).requestReset("player@tc69.de");
    }

    @Test
    void forgotPassword_invalidEmail_returns400() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("not-an-email");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(passwordResetService);
    }

    @Test
    void resetPassword_validToken_returns200() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-uuid-token");
        request.setNewPassword("newSecret123");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(passwordResetService).resetPassword("valid-uuid-token", "newSecret123");
    }

    @Test
    void resetPassword_serviceThrows_returns400() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("expired-token");
        request.setNewPassword("newSecret123");

        doThrow(new RuntimeException("Invalid or expired token"))
                .when(passwordResetService).resetPassword("expired-token", "newSecret123");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
```

- [ ] **Step 2: Run all backend tests**

```bash
cd server && ./gradlew test
```

Expected: `BUILD SUCCESSFUL`, all tests green.

- [ ] **Step 3: Commit**

```bash
git add server/src/test/java/de/eightbit/tc/tournament/controller/AuthControllerPasswordResetTest.java
git commit -m "test: add AuthController integration tests for password reset endpoints"
```

---

## Chunk 2: Frontend

### Task 8: AuthService — two new methods

**Files:**
- Modify: `client/src/app/services/auth.service.ts`

- [ ] **Step 1: Add forgotPassword and resetPassword methods**

In `auth.service.ts`, add these two methods at the end of the class, before the closing `}`:

```typescript
forgotPassword(email: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
}

resetPassword(token: string, newPassword: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/app/services/auth.service.ts
git commit -m "feat: add forgotPassword and resetPassword methods to AuthService"
```

---

### Task 9: ForgotPasswordComponent

**Files:**
- Create: `client/src/app/components/forgot-password/forgot-password.component.ts`
- Create: `client/src/app/components/forgot-password/forgot-password.component.html`
- Create: `client/src/app/components/forgot-password/forgot-password.component.scss`

- [ ] **Step 1: Create the TypeScript component**

Create `client/src/app/components/forgot-password/forgot-password.component.ts`:

```typescript
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputText, Button, Message, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  form: FormGroup;
  submitted = false;

  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.authService.forgotPassword(this.form.value.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.submitted = true; },
        error: () => { this.submitted = true; }  // always show neutral message
      });
  }
}
```

- [ ] **Step 2: Create the HTML template**

Create `client/src/app/components/forgot-password/forgot-password.component.html`:

```html
<div class="login-page">
  <div class="login-card">
    <div class="login-logo">
      <img src="assets/TC69_Logo_Nachbau_2023_11.png" alt="TC69 Logo" />
      <h1>TC69</h1>
      <p>Passwort vergessen</p>
    </div>

    <div *ngIf="submitted">
      <p-message
        severity="success"
        text="In wenigen Minuten erhältst du eine E-Mail zum Zurücksetzen deines Passworts."
        styleClass="w-full mb-4"
      ></p-message>
    </div>

    <form *ngIf="!submitted" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="p-field">
        <label for="email">E-Mail-Adresse</label>
        <input
          id="email"
          type="email"
          pInputText
          formControlName="email"
          placeholder="Deine E-Mail-Adresse"
          class="w-full"
        />
      </div>

      <p-button
        type="submit"
        label="Link anfordern"
        [disabled]="form.invalid"
        styleClass="w-full login-submit"
      />
    </form>

    <div class="login-links">
      <a [routerLink]="['/login']">Zurück zur Anmeldung</a>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Create the SCSS**

Create `client/src/app/components/forgot-password/forgot-password.component.scss`:

```scss
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #1c3a72 0%, #3570c4 60%, #4d8bda 100%);
  padding: 1rem;
}

.login-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
}

.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;

  img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    margin-bottom: 0.75rem;
  }

  h1 {
    font-size: 1.6rem;
    font-weight: 800;
    color: #1a2744;
    margin: 0;
    letter-spacing: -0.02em;
  }

  p {
    font-size: 0.85rem;
    color: #6b7a99;
    margin: 0.25rem 0 0 0;
  }
}

.p-field {
  margin-bottom: 1.25rem;

  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #4b5a7a;
    margin-bottom: 0.4rem;
  }

  input {
    width: 100%;
  }
}

.login-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e8ecf4;

  a {
    font-size: 0.82rem;
    color: #3570c4;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

:host ::ng-deep .login-submit {
  width: 100%;
  justify-content: center;
  padding: 0.75rem;
  font-size: 1rem;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/app/components/forgot-password/
git commit -m "feat: add ForgotPasswordComponent"
```

---

### Task 10: ResetPasswordComponent

**Files:**
- Create: `client/src/app/components/reset-password/reset-password.component.ts`
- Create: `client/src/app/components/reset-password/reset-password.component.html`
- Create: `client/src/app/components/reset-password/reset-password.component.scss`

- [ ] **Step 1: Create the TypeScript component**

Create `client/src/app/components/reset-password/reset-password.component.ts`:

```typescript
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { AuthService } from 'src/app/services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Password, Button, Message, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  successMessage = '';
  errorMessage = '';
  private token = '';

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.token = params['token'] ?? '';
        if (!this.token) {
          this.errorMessage = 'Dieser Link ist ungültig oder abgelaufen.';
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) return;
    this.authService.resetPassword(this.token, this.form.value.newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage = 'Passwort erfolgreich geändert.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: () => {
          this.errorMessage = 'Dieser Link ist ungültig oder abgelaufen.';
        }
      });
  }
}
```

- [ ] **Step 2: Create the HTML template**

Create `client/src/app/components/reset-password/reset-password.component.html`:

```html
<div class="login-page">
  <div class="login-card">
    <div class="login-logo">
      <img src="assets/TC69_Logo_Nachbau_2023_11.png" alt="TC69 Logo" />
      <h1>TC69</h1>
      <p>Neues Passwort vergeben</p>
    </div>

    <div *ngIf="successMessage" class="mb-3">
      <p-message severity="success" [text]="successMessage" styleClass="w-full"></p-message>
    </div>

    <div *ngIf="errorMessage && !successMessage" class="mb-3">
      <p-message severity="error" [text]="errorMessage" styleClass="w-full"></p-message>
    </div>

    <form *ngIf="!successMessage && !errorMessage" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="p-field">
        <label for="newPassword">Neues Passwort</label>
        <p-password
          id="newPassword"
          formControlName="newPassword"
          class="w-full"
          [style]="{'width':'100%'}"
          [inputStyle]="{'width':'100%'}"
          [feedback]="true"
          [toggleMask]="true"
          placeholder="Neues Passwort"
        ></p-password>
      </div>

      <div class="p-field">
        <label for="confirmPassword">Passwort bestätigen</label>
        <p-password
          id="confirmPassword"
          formControlName="confirmPassword"
          class="w-full"
          [style]="{'width':'100%'}"
          [inputStyle]="{'width':'100%'}"
          [feedback]="false"
          [toggleMask]="true"
          placeholder="Passwort wiederholen"
        ></p-password>
      </div>

      <div *ngIf="form.errors?.['passwordsMismatch'] && form.get('confirmPassword')?.touched" class="mb-3">
        <p-message severity="warn" text="Die Passwörter stimmen nicht überein." styleClass="w-full"></p-message>
      </div>

      <p-button
        type="submit"
        label="Passwort speichern"
        [disabled]="form.invalid"
        styleClass="w-full login-submit"
      />
    </form>

    <div class="login-links">
      <a [routerLink]="['/login']">Zurück zur Anmeldung</a>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Create the SCSS**

Create `client/src/app/components/reset-password/reset-password.component.scss`:

```scss
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #1c3a72 0%, #3570c4 60%, #4d8bda 100%);
  padding: 1rem;
}

.login-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
}

.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;

  img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    margin-bottom: 0.75rem;
  }

  h1 {
    font-size: 1.6rem;
    font-weight: 800;
    color: #1a2744;
    margin: 0;
    letter-spacing: -0.02em;
  }

  p {
    font-size: 0.85rem;
    color: #6b7a99;
    margin: 0.25rem 0 0 0;
  }
}

.p-field {
  margin-bottom: 1.25rem;

  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #4b5a7a;
    margin-bottom: 0.4rem;
  }

  p-password {
    width: 100%;
  }
}

.login-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e8ecf4;

  a {
    font-size: 0.82rem;
    color: #3570c4;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

:host ::ng-deep .login-submit {
  width: 100%;
  justify-content: center;
  padding: 0.75rem;
  font-size: 1rem;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/app/components/reset-password/
git commit -m "feat: add ResetPasswordComponent"
```

---

### Task 11: Routes

**Files:**
- Modify: `client/src/app/app.routes.ts`

- [ ] **Step 1: Add two new public routes**

In `app.routes.ts`, add these two routes before the `login` route:

```typescript
{
  path: 'reset',
  loadComponent: () => import('src/app/components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
},
{
  path: 'reset-confirm',
  loadComponent: () => import('src/app/components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
},
```

- [ ] **Step 2: Build the frontend to verify no compile errors**

```bash
cd client && npm run build
```

Expected: `Build at: ... - Time: ...ms` with no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/app.routes.ts
git commit -m "feat: add /reset and /reset-confirm routes for password recovery"
```

---

## Manual Smoke Test

After all tasks are complete, verify end-to-end with the dev server running:

1. Navigate to `http://localhost:4200/login` → click "Passwort vergessen?" → should open `/reset`
2. Enter a registered email → submit → success message should appear
3. Check the inbox — email should arrive with a reset link
4. Click the link → should open `/reset-confirm?token=...`
5. Enter and confirm a new password → submit → "Passwort erfolgreich geändert." → redirects to login after 2 seconds
6. Log in with the new password → should succeed
7. Try using the same reset link again → should show error (token cleared)
8. Request reset for an unknown email → same neutral success message shown (no info leak)
