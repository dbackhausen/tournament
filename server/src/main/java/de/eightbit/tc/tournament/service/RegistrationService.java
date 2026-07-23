package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.dto.RegistrationDto;
import de.eightbit.tc.tournament.model.*;
import de.eightbit.tc.tournament.repository.RegistrationRepository;
import de.eightbit.tc.tournament.repository.TournamentRepository;
import de.eightbit.tc.tournament.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RegistrationService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationService.class);

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Transactional
    public Registration register(RegistrationDto dto) {
        Tournament tournament = tournamentRepository.findById(dto.getTournament().getId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        User user = userRepository.findById(dto.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (isUserRegisteredForTournament(tournament.getId(), user.getId())) {
            throw new RuntimeException("User is already registered for this tournament");
        }

        Registration registration = new Registration();
        registration.setUser(user);
        registration.setTournament(tournament);
        registration.setNotes(dto.getNotes());

        List<ParticipationRequest> participationRequests = dto.getSelectedDays().stream()
                .map(reqDto -> {
                    ParticipationRequest req = new ParticipationRequest();
                    req.setDate(reqDto.getDate());
                    req.setTime(reqDto.getTime());
                    req.setRegistration(registration);
                    return req;
                }).collect(Collectors.toList());
        registration.setParticipationRequests(participationRequests);

        registration.setSelectedTypes(
            dto.getSelectedTypes().stream()
                .map(TournamentType::fromValue) // String --> Enum
                .collect(Collectors.toList()) // in list
        );

        Registration saved = registrationRepository.save(registration);
        sendEmailSafely(() -> emailService.sendRegistrationEmail(saved, false));
        return saved;
    }

    public Optional<Registration> getRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId);
    }

    public List<Registration> getAllRegistrationsByTournament(Long tournamentId) {
        return registrationRepository.findByTournamentId(tournamentId);
    }

    public List<Registration> getAllRegistrationsByUser(Long userId) {
        return registrationRepository.findByUserId(userId);
    }

    public boolean isUserRegisteredForTournament(Long tournamentId, Long userId) {
        return registrationRepository.existsByTournamentIdAndUserId(tournamentId, userId);
    }

    public Optional<Registration> getRegistrationForUserAndTournament(Long tournamentId, Long userId) {
        return registrationRepository.findByTournamentIdAndUserId(tournamentId, userId);
    }

    @Transactional
    public Registration updateRegistration(RegistrationDto dto) {
        Optional<Registration> registration = registrationRepository.findById(dto.getId());

        if (registration.isPresent()) {
            Registration existingRegistration = registration.get();

            if (!existingRegistration.getTournament().getStartDate().isAfter(LocalDate.now())) {
                throw new IllegalStateException("Das Turnier hat bereits begonnen. Die Anmeldung kann nicht mehr geändert werden.");
            }

            existingRegistration.setNotes(dto.getNotes());

            List<ParticipationRequest> participationRequests = dto.getSelectedDays().stream()
                    .map(reqDto -> {
                        ParticipationRequest req = new ParticipationRequest();
                        req.setDate(reqDto.getDate());
                        req.setTime(reqDto.getTime());
                        req.setRegistration(existingRegistration);
                        return req;
                    }).toList();
            existingRegistration.setParticipationRequests(participationRequests);

            List<TournamentType> tournamentTypes = dto.getSelectedTypes().stream()
                    .map(TournamentType::fromValue) // String --> Enum
                    .toList();

            existingRegistration.setSelectedTypes(tournamentTypes);

            Registration saved = registrationRepository.save(existingRegistration);
            sendEmailSafely(() -> emailService.sendRegistrationEmail(saved, true));
            return saved;
        }

        throw new EntityNotFoundException("Registration not found");
    }

    public int countRegistrationsByTournamentId(Long tournamentId) {
        return registrationRepository.countByTournamentId(tournamentId);
    }

    @Transactional
    public Registration updatePayed(Long registrationId, boolean payed) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new EntityNotFoundException("Registration not found"));
        registration.setPayed(payed);
        return registrationRepository.save(registration);
    }

    @Transactional
    public Registration updateTeam(Long registrationId, String team) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new EntityNotFoundException("Registration not found"));
        registration.setTeam(team);
        return registrationRepository.save(registration);
    }

    @Transactional
    public void deleteRegistration(Long registrationId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new EntityNotFoundException("Registration not found"));

        if (!registration.getTournament().getStartDate().isAfter(LocalDate.now())) {
            throw new IllegalStateException("Das Turnier hat bereits begonnen. Eine Abmeldung ist nicht mehr möglich.");
        }

        registrationRepository.deleteById(registrationId);
        sendEmailSafely(() -> emailService.sendWithdrawalEmail(registration));
    }

    public boolean isOwner(Long registrationId, String email) {
        return registrationRepository.findById(registrationId)
                .map(registration -> registration.getUser().getEmail().equals(email))
                .orElse(false);
    }

    private void sendEmailSafely(Runnable emailAction) {
        try {
            emailAction.run();
        } catch (Exception e) {
            logger.error("Failed to send registration email: {}", e.getMessage(), e);
        }
    }
}