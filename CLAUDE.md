# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TC69 Tournament Management System — a tennis club tournament app with a Spring Boot REST API backend and Angular standalone-component frontend. UI language is German.

## Build & Run Commands

### Backend (server/)
```bash
cd server
./gradlew build -x test                          # Compile (skip tests)
./gradlew bootRun                                 # Run server on port 8080
./gradlew test                                    # Run all tests (JUnit 5, H2 in-memory)
./gradlew test --tests "ClassName"                # Run single test class
./gradlew test --tests "ClassName.methodName"     # Run single test method
```
Requires Java 21 toolchain. Local MySQL on port 3360, database `tournament`. Profile defaults to `local` (set via `SPRING_PROFILES_ACTIVE`).

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

### Frontend (client/)
```bash
cd client
npm install                                       # Install dependencies
npm start                                         # Dev server on localhost:4200
npm run build                                     # Production build → dist/tournament/
npm test                                          # Run Karma/Jasmine tests
npx ng test --include='**/foo.component.spec.ts'  # Run single spec file
```

## Architecture

### Backend — Spring Boot 3.3.0 / Java 21 / Gradle
- **Base package:** `de.eightbit.tc.tournament`
- **Layers:** Controller → Service → Repository (Spring Data JPA)
- **DTOs** separate API responses from JPA entities; `ModelMapper` handles Tournament/Registration conversions; `UserService.mapToDto()`/`mapToEntity()` for User conversions; `MappingUtils` provides shared mapping helpers
- **Auth:** Stateless JWT (JJWT 0.12.6). `JwtAuthenticationFilter` extracts token, loads roles from DB, sets `SecurityContext`. `@PreAuthorize` on controller methods enforces ADMIN role.
- **Config profiles:** `application-local.properties` (dev), `application-azure.properties` (prod with env vars)
- **Database:** MySQL 8, Hibernate auto-DDL (`update`), Lombok `@Data` on entities and DTOs — do not write manual getters/setters
- **Validation:** Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Email`) on DTOs
- **CORS:** Configured in `WebConfig.java` via `cors.allowed-origin` property
- **Jackson:** Java 8 Time module registered, dates as ISO-8601 (not timestamps)

### API Endpoints

| Controller | Base Path | Public | Key Endpoints |
|---|---|---|---|
| `AuthController` | `/api/auth` | Yes | `POST /register`, `POST /login` |
| `TournamentController` | `/api/tournaments` | No | CRUD; write ops require ADMIN |
| `UserController` | `/api/users` | No | CRUD + `PATCH /{id}/password`; most require ADMIN |
| `RegistrationController` | `/api/registrations` | No | CRUD + `GET /check`, `GET /find/by-tournament`, `GET /find/by-user` |

### Exception Handling (`GlobalExceptionHandler` in `exception/` package)
- `MethodArgumentNotValidException` → 400 with field errors map
- `EntityNotFoundException` → 404
- `AccessDeniedException` → 403
- `RuntimeException` → 404 if message contains "not found", else 500
- `Exception` (catch-all) → 500

### Enums
- **Role:** `ADMIN`, `PLAYER`
- **TournamentType:** `SINGLE("single")`, `DOUBLE("double")`, `MIXED("mixed")` — uses `@JsonValue`/`@JsonCreator` for lowercase JSON serialization

### Frontend — Angular 19 / TypeScript / PrimeNG
- **Standalone components** (no NgModules) with lazy-loaded routes in `app.routes.ts`
- **Bootstrap:** `main.ts` → `bootstrapApplication()` with `app.config.ts`
- **Services:** `AuthService`, `TournamentService`, `RegistrationService`, `UserService` — all call `/api/*` endpoints via `environment.apiUrl`
- **Auth flow:** `authInterceptor` attaches Bearer token from localStorage; `authGuard` checks `isLoggedIn()`; `roleGuard` checks user roles via `route.data['role']`; interceptor auto-logs out on 401/403
- **Subscriptions:** Use `DestroyRef` + `takeUntilDestroyed()` pattern for cleanup
- **UI:** PrimeNG components (Aura theme), PrimeFlex grid, SCSS component styles, German locale (de-DE)
- **Environment:** `environment.ts` (dev: `localhost:8080/api`), `environment.prod.ts` (reads `window.env.API_URL` from runtime `env.js`)
- **Custom validators:** `atLeastOneDaySelectedValidator`, `atLeastOneTypeSelectedValidator`, `selectedDateTimeValidator`, `deadlineBeforeFirstDayValidator`

### Key Relationships
- `User` has roles (ADMIN, PLAYER) via `@ElementCollection`
- `Tournament` has `TournamentDay`s and `TournamentType`s (cascade ALL + orphanRemoval)
- `Registration` links User ↔ Tournament, with `ParticipationRequest`s and selected types
- Registration entity uses `FetchType.LAZY` with `@EntityGraph` on repository queries to avoid N+1

## Deployment

CI/CD via GitHub Actions → Azure:
- Frontend: Azure Static Web Apps (`azure-frontend-deployment.yml`, Node 18)
- Backend: Azure App Service as JAR (`azure-backend-deployment.yml`, Java 21 Temurin, `tournament-app-backend-1.0.jar`)
- Production env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN`, `API_URL`

## Conventions

- Frontend services return raw `Observable`s — error handling is done in component subscribers, not in services
- Angular routes use `loadComponent` lazy imports, not eager static imports
- All component subscriptions must use `takeUntilDestroyed(this.destroyRef)` to prevent memory leaks
- No proxy configuration — frontend calls backend URL directly via environment config
- No linting/formatting tools configured (no ESLint, Prettier, or Checkstyle)
