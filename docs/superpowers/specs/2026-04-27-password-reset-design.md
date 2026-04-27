# Password Reset — Design Spec

**Date:** 2026-04-27  
**Status:** Approved

---

## Overview

Implement a "Passwort vergessen" flow. The login screen already links to `/reset`. Users enter their email, receive a reset link by email (valid 1 hour), click it, and set a new password.

---

## Backend

### User Entity Changes

Add two nullable fields to `de.eightbit.tc.tournament.model.User`:
- `resetToken: String` — a UUID reset token
- `resetTokenExpiry: LocalDateTime` — expiry timestamp (now + 1 hour)

Hibernate `ddl-auto=update` will add the columns automatically.

### New DTOs

- `ForgotPasswordRequest` — `@NotBlank String email`
- `ResetPasswordRequest` — `@NotBlank String token`, `@NotBlank String newPassword`

### New Services

**`PasswordResetService`**
- `requestReset(email)` — looks up user by email; if found, generates `UUID.randomUUID().toString()` token, sets expiry to `LocalDateTime.now().plusHours(1)`, saves user, calls `EmailService.sendResetEmail(...)`. Always returns without revealing whether email was found.
- `resetPassword(token, newPassword)` — finds user by `resetToken`; validates token exists and `resetTokenExpiry` is after now; BCrypt-encodes new password; clears `resetToken` and `resetTokenExpiry`; saves user.

**`EmailService`**
- Thin wrapper around `JavaMailSender`
- Renders Thymeleaf HTML template `reset-email.html`
- `sendResetEmail(toEmail, resetLink)` — constructs the link as `{app.frontend-url}/reset-confirm?token={token}` and sends the email from `mail.from`

### Email Template

`server/src/main/resources/templates/reset-email.html` — Thymeleaf HTML email with the reset link. Plain, readable design matching the club context.

### New Controller Endpoints

Added to `AuthController` under `/api/auth`:

| Method | Path | Body | Auth |
|--------|------|------|------|
| `POST` | `/forgot-password` | `ForgotPasswordRequest` | Public |
| `POST` | `/reset-password` | `ResetPasswordRequest` | Public |

Both endpoints permitted in `SecurityConfig` alongside `/api/auth/register` and `/api/auth/login`.

### SMTP Configuration

Added to both `application-local.properties` and `application-azure.properties`:

```properties
# Mail
spring.mail.host=<smtp-host>
spring.mail.port=587
spring.mail.username=<username>
spring.mail.password=<password>
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
mail.from=<sender-address>

# Frontend URL (used in reset email links)
app.frontend-url=http://localhost:4200   # local
app.frontend-url=${FRONTEND_URL}         # azure (env var)
```

---

## Frontend

### New Components

**`ForgotPasswordComponent`** — route `/reset` (public, no authGuard)
- Single email input (`Validators.required`, `Validators.email`)
- On submit: calls `AuthService.forgotPassword(email)`
- After submit: always shows neutral success message: *"In wenigen Minuten erhältst du eine E-Mail zum Zurücksetzen deines Passworts."* (prevents email enumeration)
- Link back to `/login`
- Styled to match the existing login card layout

**`ResetPasswordComponent`** — route `/reset-confirm` (public, no authGuard)
- Two fields: *Neues Passwort*, *Passwort bestätigen* with custom match validator
- Reads `token` from `ActivatedRoute.queryParams` on init
- On submit: calls `AuthService.resetPassword(token, newPassword)`
- On success: shows *"Passwort erfolgreich geändert."*, navigates to `/login` after 2 seconds
- On error: shows *"Dieser Link ist ungültig oder abgelaufen."*

### AuthService Additions

Two new methods returning raw `Observable`s (per project convention, error handling in component):
- `forgotPassword(email: string): Observable<any>` — `POST /api/auth/forgot-password`
- `resetPassword(token: string, newPassword: string): Observable<any>` — `POST /api/auth/reset-password`

### Routes

Two new entries in `app.routes.ts` (no `authGuard`):
```ts
{ path: 'reset', loadComponent: () => import(...ForgotPasswordComponent) },
{ path: 'reset-confirm', loadComponent: () => import(...ResetPasswordComponent) }
```

---

## Security Notes

- The `forgot-password` endpoint never reveals whether an email is registered (always 200).
- Token is a random UUID — not guessable.
- Token is cleared after successful use (single-use).
- Token expires after 1 hour.
- New password is BCrypt-encoded before storage.

---

## Token Expiry

1 hour, enforced server-side by comparing `resetTokenExpiry` with `LocalDateTime.now()`.
