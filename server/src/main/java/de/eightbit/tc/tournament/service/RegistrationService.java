package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.dto.RegistrationDto;
import de.eightbit.tc.tournament.model.*;
import de.eightbit.tc.tournament.repository.RegistrationRepository;
import de.eightbit.tc.tournament.repository.TournamentRepository;
import de.eightbit.tc.tournament.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RegistrationService {

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private UserRepository userRepository;


    public Registration register(RegistrationDto dto) {
        Tournament tournament = tournamentRepository.findById(dto.getTournament().getId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        User user = userRepository.findById(dto.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user == null) {
            throw new RuntimeException("User found but has no user profile");
        }

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

        return registrationRepository.save(registration);
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

    public Registration updateRegistration(RegistrationDto dto) {
        Optional<Registration> registration = registrationRepository.findById(dto.getId());

        if (registration.isPresent()) {
            Registration existingRegistration = registration.get();
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

            return registrationRepository.save(existingRegistration);
        }

        return null;
    }

    public int countRegistrationsByTournamentId(Long tournamentId) {
        return registrationRepository.countByTournamentId(tournamentId);
    }

    public void deleteRegistration(Long registrationId) {
        registrationRepository.deleteById(registrationId);
    }
}