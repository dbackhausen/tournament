package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.RegistrationDto;
import de.eightbit.tc.tournament.dto.UserDto;
import de.eightbit.tc.tournament.model.Registration;
import de.eightbit.tc.tournament.model.TournamentType;
import de.eightbit.tc.tournament.service.RegistrationService;
import de.eightbit.tc.tournament.util.MappingUtils;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    private final ModelMapper modelMapper;

    public RegistrationController(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    @PostMapping
    public ResponseEntity<RegistrationDto> register(@RequestBody RegistrationDto dto) {
        Registration savedRegistration = registrationService.register(dto);
        RegistrationDto savedRegistrationDto = modelMapper.map(savedRegistration, RegistrationDto.class);
        return ResponseEntity.ok(savedRegistrationDto);
    }

    @GetMapping("{id}")
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
        List<RegistrationDto> registrationDtos = MappingUtils.mapList(registrations, RegistrationDto.class);
        return ResponseEntity.ok(registrationDtos);
    }

    @GetMapping("/find/by-user")
    public ResponseEntity<Iterable<RegistrationDto>> getRegistrationsByUser(@RequestParam Long userId) {
        List<Registration> registrations = registrationService.getAllRegistrationsByUser(userId);
        List<RegistrationDto> registrationDtos = MappingUtils.mapList(registrations, RegistrationDto.class);
        return ResponseEntity.ok(registrationDtos);
    }

    @PutMapping
    public ResponseEntity<RegistrationDto> updateRegistration(@RequestBody RegistrationDto dto) {
        Registration savedRegistration = registrationService.updateRegistration(dto);
        RegistrationDto savedRegistrationDto = modelMapper.map(savedRegistration, RegistrationDto.class);
        return ResponseEntity.ok(savedRegistrationDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<RegistrationDto> updateRegistration(@PathVariable Long id) {
        registrationService.deleteRegistration(id);
        return ResponseEntity.noContent().build();
    }

    // -- MAPPING UTILS ----

    private RegistrationDto mapRegistration(Registration registration) {
        RegistrationDto dto = modelMapper.map(registration, RegistrationDto.class);

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