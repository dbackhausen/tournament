# Registration Confirmation Email Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Newly registered users must confirm their email within 24 hours before they can log in; after confirmation all admins receive a notification email; expired unconfirmed registrations are deleted nightly.

**Architecture:** A new `RegistrationConfirmationService` manages the full lifecycle — token generation on register, activation on confirm, and admin notification. A `@Scheduled` nightly task in the same service cleans up expired unconfirmed users. The frontend gains a `/confirm` route that calls `GET /api/auth/confirm?token=` and redirects to `/login?confirmed=true` on success.

**Tech Stack:** Spring Boot 3.3 / Java 21 / Spring Mail / Thymeleaf / Spring Scheduling / Angular 19 standalone components / PrimeNG

---

## File Structure

**Backend — new files:**
- `server/src/main/java/de/eightbit/tc/tournament/service/RegistrationConfirmationService.java`
- `server/src/main/resources/templates/confirmation-email.html`
- `server/src/main/resources/templates/admin-notification-email.html`
- `server/src/test/java/de/eightbit/tc/tournament/service/RegistrationConfirmationServiceTest.java`

**Backend — modified files:**
- `server/src/main/java/de/eightbit/tc/tournament/model/User.java` — add `confirmationToken`, `confirmationTokenExpiry`
- `server/src/main/java/de/eightbit/tc/tournament/repository/UserRepository.java` — add `findByConfirmationToken`, `deleteExpiredUnconfirmedUsers` (custom `@Query`)
- `server/src/main/java/de/eightbit/tc/tournament/service/EmailService.java` — add `sendConfirmationEmail`, `sendAdminNotificationEmail`
- `server/src/main/java/de/eightbit/tc/tournament/controller/AuthController.java` — inject service, modify `register`, modify `login`, add `GET /confirm`
- `server/src/main/java/de/eightbit/tc/tournament/SecurityConfig.java` — permitAll `/api/auth/confirm`
- `server/src/main/java/de/eightbit/tc/tournament/TournamentApplication.java` — add `@EnableScheduling`

**Frontend — new files:**
- `client/src/app/components/confirm/confirm.component.ts`
- `client/src/app/components/confirm/confirm.component.html`
- `client/src/app/components/confirm/confirm.component.scss`

**Frontend — modified files:**
- `client/src/app/app.routes.ts` — add `/confirm` route
- `client/src/app/components/login/login.component.ts` — read `confirmed` query param
- `client/src/app/components/login/login.component.html` — show success banner

---

## Chunk 1: Backend Data Model + Service + Email

### Task 1: User entity — confirmation token fields

**Files:**
- Modify: `server/src/main/java/de/eightbit/tc/tournament/model/User.java`
- Modify: `server/src/main/java/de/eightbit/tc/tournament/repository/UserRepository.java`

- [ ] **Step 1: Add fields to User entity**

In `User.java`, insert the two new fields between `resetTokenExpiry` and the `@Lob` annotation for `profileImage`. The result should look like:

```java
private LocalDateTime resetTokenExpiry;

@Column(unique = true)
private String confirmationToken;
private LocalDateTime confirmationTokenExpiry;

@Lob
@Column(name = "profile_image", columnDefinition = "LONGBLOB")
private byte[] profileImage;
```

`LocalDateTime` is already imported. Lombok `@Data` generates the getters/setters automatically — do NOT write them manually.

- [ ] **Step 2: Add repository methods**

In `UserRepository.java`, add:

```java
Optional<User> findByConfirmationToken(String confirmationToken);

@Modifying
@Transactional
@Query("DELETE FROM User u WHERE u.active = false AND u.confirmationTokenExpiry < :now")
void deleteExpiredUnconfirmedUsers(@Param("now") LocalDateTime now);
```

Add imports (note: `Query` is already imported in the file — skip it):
```java
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
```

- [ ] **Step 3: Build to verify compilation**

```bash
cd server && ./gradlew build -x test
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add server/src/main/java/de/eightbit/tc/tournament/model/User.java \
        server/src/main/java/de/eightbit/tc/tournament/repository/UserRepository.java
git commit -m "feat: add confirmation token fields to User entity"
```

---

### Task 2: Email templates

**Files:**
- Create: `server/src/main/resources/templates/confirmation-email.html`
- Create: `server/src/main/resources/templates/admin-notification-email.html`

These use the same CSS style as `reset-email.html` for visual consistency.

- [ ] **Step 1: Create confirmation-email.html**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-Mail bestätigen</title>
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
      <p>E-Mail-Adresse bestätigen</p>
    </div>
    <div class="body">
      <p>Hallo <span th:text="${firstName}">Vorname</span>,</p>
      <p>vielen Dank für deine Registrierung beim TC69! Bitte bestätige deine E-Mail-Adresse,
         um deinen Account zu aktivieren. Der Link ist <strong>24 Stunden</strong> gültig.</p>
      <div class="btn-wrap">
        <a th:href="${confirmLink}" class="btn">E-Mail bestätigen</a>
      </div>
      <p>Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
      <p class="link-fallback">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br/>
        <span th:text="${confirmLink}"></span>
      </p>
    </div>
    <div class="footer">
      TC69 Tennisclub &middot; Diese E-Mail wurde automatisch generiert.
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Create admin-notification-email.html**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Neue Registrierung</title>
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
    .user-info { background: #f0f4fa; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .user-info p { margin: 4px 0; font-size: 0.9rem; }
    .footer { padding: 16px 32px; border-top: 1px solid #e8ecf4;
              font-size: 0.78rem; color: #8a97b3; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>TC69 Turnierverwaltung</h1>
      <p>Neue Registrierung</p>
    </div>
    <div class="body">
      <p>Hallo,</p>
      <p>ein neues Mitglied hat sich erfolgreich registriert und seine E-Mail-Adresse bestätigt:</p>
      <div class="user-info">
        <p><strong>Name:</strong> <span th:text="${fullName}">Max Mustermann</span></p>
        <p><strong>E-Mail:</strong> <span th:text="${email}">max@example.com</span></p>
      </div>
      <p>Der Account ist nun aktiv.</p>
    </div>
    <div class="footer">
      TC69 Tennisclub &middot; Diese E-Mail wurde automatisch generiert.
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add server/src/main/resources/templates/confirmation-email.html \
        server/src/main/resources/templates/admin-notification-email.html
git commit -m "feat: add confirmation and admin notification email templates"
```

---

### Task 3: EmailService — two new methods

**Files:**
- Modify: `server/src/main/java/de/eightbit/tc/tournament/service/EmailService.java`

- [ ] **Step 1: Add sendConfirmationEmail and sendAdminNotificationEmail**

Add these two methods to `EmailService.java` after `sendResetEmail`:

```java
public void sendConfirmationEmail(String to, String firstName, String confirmLink) {
    try {
        Context context = new Context();
        context.setVariable("firstName", firstName);
        context.setVariable("confirmLink", confirmLink);
        String html = templateEngine.process("confirmation-email", context);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject("E-Mail bestätigen – TC69");
        helper.setText(html, true);

        mailSender.send(message);
    } catch (Exception e) {
        throw new RuntimeException("Failed to send confirmation email", e);
    }
}

public void sendAdminNotificationEmail(String to, String fullName, String email) {
    try {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        context.setVariable("email", email);
        String html = templateEngine.process("admin-notification-email", context);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject("Neue Registrierung – TC69");
        helper.setText(html, true);

        mailSender.send(message);
    } catch (Exception e) {
        throw new RuntimeException("Failed to send admin notification email", e);
    }
}
```

- [ ] **Step 2: Build to verify**

```bash
cd server && ./gradlew build -x test
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add server/src/main/java/de/eightbit/tc/tournament/service/EmailService.java
git commit -m "feat: add confirmation and admin notification email methods"
```

---

### Task 4: RegistrationConfirmationService — write tests first

**Files:**
- Create: `server/src/test/java/de/eightbit/tc/tournament/service/RegistrationConfirmationServiceTest.java`
- Create: `server/src/main/java/de/eightbit/tc/tournament/service/RegistrationConfirmationService.java`

- [ ] **Step 1: Write the test class**

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
    void confirmRegistration_expiredToken_deletesUserAndThrows() {
        User user = new User();
        user.setConfirmationToken("expired-token");
        user.setConfirmationTokenExpiry(LocalDateTime.now().minusMinutes(1));
        user.setActive(false);

        when(userRepository.findByConfirmationToken("expired-token")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.confirmRegistration("expired-token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("abgelaufen");

        verify(userRepository).delete(user);
        verify(userRepository, never()).save(any());
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && ./gradlew test --tests "de.eightbit.tc.tournament.service.RegistrationConfirmationServiceTest"
```

Expected: FAIL — `RegistrationConfirmationService` does not exist yet.

- [ ] **Step 3: Implement RegistrationConfirmationService**

Create `server/src/main/java/de/eightbit/tc/tournament/service/RegistrationConfirmationService.java`:

```java
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
            userRepository.delete(user);
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
```

- [ ] **Step 4: Run tests again**

```bash
cd server && ./gradlew test --tests "de.eightbit.tc.tournament.service.RegistrationConfirmationServiceTest"
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/test/java/de/eightbit/tc/tournament/service/RegistrationConfirmationServiceTest.java \
        server/src/main/java/de/eightbit/tc/tournament/service/RegistrationConfirmationService.java
git commit -m "feat: implement RegistrationConfirmationService with tests"
```

---

## Chunk 2: Backend Controller + Security + Scheduling

### Task 5: AuthController — register, login, and confirm endpoint

**Files:**
- Modify: `server/src/main/java/de/eightbit/tc/tournament/controller/AuthController.java`
- Modify: `server/src/main/java/de/eightbit/tc/tournament/SecurityConfig.java`
- Modify: `server/src/main/java/de/eightbit/tc/tournament/TournamentApplication.java`

> **Note:** `app.frontend-url` is already configured in `application-local.properties` (value: `http://localhost:4200`) and `application-railway.properties` (value: `${FRONTEND_URL}`). No changes needed to either properties file.

- [ ] **Step 1: Add @EnableScheduling to TournamentApplication**

In `TournamentApplication.java`, add the annotation:

```java
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TournamentApplication {
    public static void main(String[] args) {
        SpringApplication.run(TournamentApplication.class, args);
    }
}
```

- [ ] **Step 2: Inject RegistrationConfirmationService into AuthController**

In `AuthController.java`, add after the existing `@Autowired` fields:

```java
@Autowired
private RegistrationConfirmationService registrationConfirmationService;
```

Add import:
```java
import de.eightbit.tc.tournament.service.RegistrationConfirmationService;
```

- [ ] **Step 3: Call sendConfirmationEmail in register endpoint**

In `AuthController.java`, the `register` method currently ends with:
```java
User saveUser = userService.createUser(newUser);
return ResponseEntity.ok(userService.mapToDto(saveUser));
```

Change it to:
```java
User saveUser = userService.createUser(newUser);
registrationConfirmationService.sendConfirmationEmail(saveUser);
return ResponseEntity.ok(userService.mapToDto(saveUser));
```

- [ ] **Step 4: Migration — activate existing users**

> **Important:** Any user who registered before this feature was deployed has `active = false`. Once the login check is added in Step 5, they will be locked out. Before deploying to production, run this SQL against the database to activate all existing users:
>
> ```sql
> UPDATE users SET active = true WHERE active = false AND confirmation_token IS NULL;
> ```
>
> This targets only users with no pending confirmation token (i.e., registered under the old flow). Users with a fresh confirmation token are left inactive intentionally.

- [ ] **Step 5: Add active check to login endpoint**

In `AuthController.java`, the login method currently has the password check followed directly by token generation. Add the active check between them:

```java
if (!passwordEncoder.matches(loginRequest.getPassword(), existingUser.getPassword())) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
}
// ADD THIS:
if (!existingUser.isActive()) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Account noch nicht bestätigt");
}
String token = jwtUtil.generateToken(existingUser.getEmail());
```

- [ ] **Step 6: Add GET /confirm endpoint**

In `AuthController.java`, add this new method. Add the import `import org.springframework.web.bind.annotation.GetMapping;` and `import org.springframework.web.bind.annotation.RequestParam;` if not already present:

```java
@GetMapping("/confirm")
public ResponseEntity<?> confirmEmail(@RequestParam String token) {
    try {
        registrationConfirmationService.confirmRegistration(token);
        return ResponseEntity.ok("E-Mail erfolgreich bestätigt");
    } catch (RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage() != null ? e.getMessage() : "Ungültiger oder abgelaufener Link");
    }
}
```

- [ ] **Step 7: Permit /api/auth/confirm in SecurityConfig**

In `SecurityConfig.java`, extend the existing permitAll matcher (currently on line 33–34):

```java
.requestMatchers("/api/auth/register", "/api/auth/login",
        "/api/auth/forgot-password", "/api/auth/reset-password",
        "/api/auth/confirm").permitAll()
```

- [ ] **Step 8: Build and run all tests**

```bash
cd server && ./gradlew build
```

Expected: `BUILD SUCCESSFUL`, all tests pass.

- [ ] **Step 9: Commit**

```bash
git add server/src/main/java/de/eightbit/tc/tournament/TournamentApplication.java \
        server/src/main/java/de/eightbit/tc/tournament/controller/AuthController.java \
        server/src/main/java/de/eightbit/tc/tournament/SecurityConfig.java
git commit -m "feat: wire confirmation flow into auth controller and security config"
```

---

## Chunk 3: Frontend

### Task 6: ConfirmComponent

**Files:**
- Create: `client/src/app/components/confirm/confirm.component.ts`
- Create: `client/src/app/components/confirm/confirm.component.html`
- Create: `client/src/app/components/confirm/confirm.component.scss`
- Modify: `client/src/app/app.routes.ts`

- [ ] **Step 1: Create confirm.component.ts**

```typescript
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {
  loading = true;
  error = '';

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.error = 'Ungültiger oder abgelaufener Link.';
      return;
    }

    this.http.get(`${environment.apiUrl}/auth/confirm`, { params: { token }, responseType: 'text' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/login'], { queryParams: { confirmed: 'true' } }),
        error: (err) => {
          this.loading = false;
          this.error = err.error || 'Link ungültig oder abgelaufen. Bitte registriere dich erneut.';
        }
      });
  }
}
```

- [ ] **Step 2: Create confirm.component.html**

```html
<div class="confirm-page">
  <div class="confirm-card">
    <img src="assets/TC69_Logo_Nachbau_2023_11.png" alt="TC69 Logo" class="logo" />
    <h1>TC69</h1>
    <ng-container *ngIf="loading">
      <p>E-Mail wird bestätigt …</p>
    </ng-container>
    <ng-container *ngIf="!loading && error">
      <p class="error-msg">{{ error }}</p>
      <a href="/register">Zur Registrierung</a>
    </ng-container>
  </div>
</div>
```

- [ ] **Step 3: Create confirm.component.scss**

```scss
.confirm-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f4fa;

  .confirm-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10);
    padding: 48px 40px;
    text-align: center;
    max-width: 400px;
    width: 100%;

    .logo {
      width: 72px;
      margin-bottom: 12px;
    }

    h1 {
      font-size: 1.8rem;
      color: #1c3a72;
      margin: 0 0 24px;
    }

    p {
      color: #2d3a55;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .error-msg {
      color: #c0392b;
      margin-bottom: 16px;
    }

    a {
      color: #3570c4;
      font-weight: 600;
      text-decoration: none;
    }
  }
}
```

- [ ] **Step 4: Add /confirm route to app.routes.ts**

In `app.routes.ts`, add the confirm route alongside the other public routes (after `reset-confirm`):

```typescript
{
  path: 'confirm',
  loadComponent: () => import('src/app/components/confirm/confirm.component').then(m => m.ConfirmComponent)
},
```

- [ ] **Step 5: Build frontend**

```bash
cd client && npm run build
```

Expected: Build completes without errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/components/confirm/ \
        client/src/app/app.routes.ts
git commit -m "feat: add ConfirmComponent and /confirm route"
```

---

### Task 7: LoginComponent — success banner

**Files:**
- Modify: `client/src/app/components/login/login.component.ts`
- Modify: `client/src/app/components/login/login.component.html`

- [ ] **Step 1: Read confirmed query param in LoginComponent**

In `login.component.ts`, inject `ActivatedRoute` and read the param on construction:

Add imports:
```typescript
import { ActivatedRoute } from '@angular/router';
```

Add a new property:
```typescript
confirmed = false;
```

Update the constructor to inject `ActivatedRoute` and read the param:
```typescript
constructor(
  private fb: FormBuilder,
  private authService: AuthService,
  private router: Router,
  private route: ActivatedRoute
) {
  this.loginForm = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
  });
  this.confirmed = this.route.snapshot.queryParamMap.get('confirmed') === 'true';
}
```

- [ ] **Step 2: Add success banner to login.component.html**

In `login.component.html`, add the success message directly above the form's first `<div class="p-field">`. Also add `Message` to the imports in the component if not already imported (it already is).

```html
<div *ngIf="confirmed" class="mb-3">
  <p-message severity="success" text="E-Mail erfolgreich bestätigt. Du kannst dich jetzt einloggen."></p-message>
</div>
```

Place it inside the `<form>` tag, before the first `<div class="p-field">`.

- [ ] **Step 3: Build frontend**

```bash
cd client && npm run build
```

Expected: Build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/components/login/login.component.ts \
        client/src/app/components/login/login.component.html
git commit -m "feat: show success banner on login page after email confirmation"
```
