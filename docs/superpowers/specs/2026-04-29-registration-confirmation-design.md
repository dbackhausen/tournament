# Registration Confirmation Email — Design Spec

## Goal

Newly registered users must confirm their email address before they can log in. After confirmation, all admins receive a notification. Unconfirmed registrations expire after 24 hours and are automatically deleted.

## Data Model

**`User` entity — two new fields:**
- `confirmationToken` (String, unique, nullable) — UUID generated at registration
- `confirmationTokenExpiry` (LocalDateTime, nullable) — `now + 24h`

Existing `active` field (already `false` on registration) is the gate for login access.

**Cleanup:** A `@Scheduled(cron = "0 0 3 * * *")` nightly task deletes all `User` records where `active = false` and `confirmationTokenExpiry < now`.

## Backend

### `RegistrationConfirmationService`
- `sendConfirmationEmail(User user)` — generates UUID token, sets 24h expiry, saves user, sends confirmation email
- `confirmRegistration(String token)` — looks up user by token; if expired → deletes user + throws exception; if valid → sets `active = true`, clears token fields, triggers admin notification emails

### `EmailService` additions
- `sendConfirmationEmail(String to, String firstName, String confirmLink)` — HTML email using new Thymeleaf template
- `sendAdminNotificationEmail(String to, String fullName, String email)` — HTML email using new Thymeleaf template, sent to each admin

### `AuthController` changes
- `POST /register`: call `registrationConfirmationService.sendConfirmationEmail(user)` after saving
- `POST /login`: add active check before issuing JWT — 401 with body `"Account noch nicht bestätigt"` if `!user.isActive()`
- New `GET /api/auth/confirm?token=`: public endpoint, delegates to `confirmRegistration`, returns 200 on success or 400 on invalid/expired token

### `SecurityConfig`
- Add `/api/auth/confirm` to `permitAll()` matchers

### `UserRepository`
- Add `Optional<User> findByConfirmationToken(String token)`
- Add query to find and delete expired unconfirmed users (or use `deleteBy...` method)

## Frontend

### `ConfirmComponent` (new, route `/confirm`)
- On init: reads `token` query param, calls `GET /api/auth/confirm?token=`
- Success: navigates to `/login?confirmed=true`
- Error: shows inline message "Link ungültig oder abgelaufen. Bitte registriere dich erneut."

### `LoginComponent` changes
- Reads `confirmed` query param on init
- If `confirmed=true`: shows success banner "E-Mail erfolgreich bestätigt. Du kannst dich jetzt einloggen." above the form

### Route
- Add `/confirm` → `ConfirmComponent` to `app.routes.ts` (public, no auth guard)

## Email Templates (Thymeleaf)

### `confirmation-email.html`
Subject: "E-Mail bestätigen – TC69"
Body: Greeting, explanation, confirmation button/link, 24h expiry notice.

### `admin-notification-email.html`
Subject: "Neue Registrierung – TC69"
Body: Notification that a new user (name + email) has confirmed their registration.

## Error Handling

| Scenario | Behaviour |
|---|---|
| Token not found | 400 — "Link ungültig oder abgelaufen" |
| Token expired | Delete user record, 400 — same message |
| User already active | 200 (idempotent — no harm in double-click) |
| Login while inactive | 401 — "Account noch nicht bestätigt" |
| Token expires, user re-registers | Nightly cleanup deletes old record; same email becomes available again |
