package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.RegistrationDto;
import de.eightbit.tc.tournament.dto.TournamentDto;
import de.eightbit.tc.tournament.dto.UserDto;
import de.eightbit.tc.tournament.model.TournamentDay;
import de.eightbit.tc.tournament.model.Registration;
import de.eightbit.tc.tournament.model.TournamentType;
import de.eightbit.tc.tournament.service.RegistrationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {
    private static final Logger logger = LoggerFactory.getLogger(RegistrationController.class);

    @Autowired
    private RegistrationService registrationService;

    @PostMapping
    public ResponseEntity<RegistrationDto> register(@Valid @RequestBody RegistrationDto dto) {
        Registration savedRegistration = registrationService.register(dto);
        return ResponseEntity.ok(mapRegistration(savedRegistration));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistrationDto> getRegistration(@PathVariable Long id) {
        Optional<Registration> registration = registrationService.getRegistration(id);
        if (registration.isPresent()) {
            RegistrationDto registrationDto = mapRegistration(registration.get());
            return ResponseEntity.ok(registrationDto);
        } else {
            return ResponseEntity.notFound().build(); // return 404
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkUserRegistration(
            @RequestParam Long tournamentId,
            @RequestParam Long userId) {
        boolean isRegistered = registrationService.isUserRegisteredForTournament(tournamentId, userId);
        return ResponseEntity.ok(Collections.singletonMap("registered", isRegistered));
    }

    @GetMapping("/find/by-tournament-and-user")
    public ResponseEntity<?> getUserRegistration(
            @RequestParam Long tournamentId,
            @RequestParam Long userId) {
        Optional<Registration> registration = registrationService.getRegistrationForUserAndTournament(tournamentId, userId);
        if (registration.isPresent()) {
            RegistrationDto registrationDto = mapRegistration(registration.get());
            return ResponseEntity.ok(registrationDto);
        } else {
            return ResponseEntity.notFound().build(); // return 404
        }
    }

    @GetMapping("/find/by-tournament")
    public ResponseEntity<Iterable<RegistrationDto>> getRegistrationsByTournament(@RequestParam Long tournamentId) {
        List<Registration> registrations = registrationService.getAllRegistrationsByTournament(tournamentId);
        if (!registrations.isEmpty()) {
            List<RegistrationDto> registrationDtos = new ArrayList<>();
            for (Registration registration : registrations) {
                registrationDtos.add(mapRegistration(registration));
            }
            return ResponseEntity.ok(registrationDtos);
        } else {
            return ResponseEntity.notFound().build(); // return 404
        }
    }

    @GetMapping("/find/by-user")
    public ResponseEntity<Iterable<RegistrationDto>> getRegistrationsByUser(@RequestParam Long userId) {
        List<Registration> registrations = registrationService.getAllRegistrationsByUser(userId);
        if (!registrations.isEmpty()) {
            List<RegistrationDto> registrationDtos = new ArrayList<>();
            for (Registration registration : registrations) {
                registrationDtos.add(mapRegistration(registration));
            }
            return ResponseEntity.ok(registrationDtos);
        } else {
            return ResponseEntity.notFound().build(); // return 404
        }
    }

    @PutMapping
    public ResponseEntity<RegistrationDto> updateRegistration(@Valid @RequestBody RegistrationDto dto) {
        Registration savedRegistration = registrationService.updateRegistration(dto);
        return ResponseEntity.ok(mapRegistration(savedRegistration));
    }

    @PatchMapping("/{id}/payed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegistrationDto> updatePayed(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Registration registration = registrationService.updatePayed(id, body.get("payed"));
        return ResponseEntity.ok(mapRegistration(registration));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<RegistrationDto> deleteRegistration(@PathVariable Long id) {
        registrationService.deleteRegistration(id);
        return ResponseEntity.noContent().build();
    }

    // -- MAPPING UTILS ----

    private RegistrationDto mapRegistration(Registration registration) {
        RegistrationDto dto = new RegistrationDto();
        dto.setId(registration.getId());
        dto.setNotes(registration.getNotes());
        dto.setPayed(registration.isPayed());

        dto.setUser(new UserDto(registration.getUser()));

        TournamentDto tournamentDto = new TournamentDto();
        tournamentDto.setId(registration.getTournament().getId());
        tournamentDto.setName(registration.getTournament().getName());
        tournamentDto.setStartDate(registration.getTournament().getStartDate());
        tournamentDto.setEndDate(registration.getTournament().getEndDate());
        tournamentDto.setDescription(registration.getTournament().getDescription());
        tournamentDto.setTournamentTypes(registration.getTournament().getTournamentTypes());

        List<TournamentDto.TournamentDayDto> dayDtos = registration.getTournament().getTournamentDays().stream()
                .map(day -> {
                    TournamentDto.TournamentDayDto dayDto = new TournamentDto.TournamentDayDto();
                    dayDto.setDate(day.getDate());
                    dayDto.setTime1(day.getTime1());
                    dayDto.setTime2(day.getTime2());
                    dayDto.setTime3(day.getTime3());
                    return dayDto;
                })
                .collect(Collectors.toList());
        tournamentDto.setTournamentDays(dayDtos);

        dto.setTournament(tournamentDto);

        List<RegistrationDto.SelectedDay> selectedDays = registration.getParticipationRequests().stream()
                .map(pr -> {
                    RegistrationDto.SelectedDay day = new RegistrationDto.SelectedDay();
                    day.setDate(pr.getDate());
                    day.setTime(pr.getTime());
                    return day;
                })
                .collect(Collectors.toList());
        dto.setSelectedDays(selectedDays);

        dto.setSelectedTypes(
                registration.getSelectedTypes().stream()
                        .map(TournamentType::name)
                        .collect(Collectors.toList())
        );

        return dto;
    }
}