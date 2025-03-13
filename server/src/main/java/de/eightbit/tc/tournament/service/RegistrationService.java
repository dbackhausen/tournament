package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.dto.RegistrationDto;
import de.eightbit.tc.tournament.model.*;
import de.eightbit.tc.tournament.repository.PlayerRepository;
import de.eightbit.tc.tournament.repository.RegistrationRepository;
import de.eightbit.tc.tournament.repository.TournamentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
    private PlayerRepository playerRepository;


    public Registration registerPlayerForTournament(Long tournamentId, RegistrationDto dto) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        Player player = playerRepository.findById(dto.getPlayer().getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        if (registrationRepository.existsByTournamentAndPlayer(tournament, player)) {
            throw new RuntimeException("Player is already registered for this tournament");
        }

        Registration registration = new Registration();
        registration.setPlayer(player);
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

    public Registration updateRegistration(Long tournamentId, Long registrationId, RegistrationDto dto) {
        Optional<Registration> registration = registrationRepository.findById(registrationId);

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
            existingRegistration.getParticipationRequests().clear(); // because of "all-delete-orphan" setting
            existingRegistration.getParticipationRequests().addAll(participationRequests);

            List<TournamentType> tournamentTypes = dto.getSelectedTypes().stream()
                            .map(TournamentType::fromValue) // String --> Enum
                            .toList();

            existingRegistration.getSelectedTypes().clear(); // because of "all-delete-orphan" setting
            existingRegistration.getSelectedTypes().addAll(tournamentTypes);

            return registrationRepository.save(existingRegistration);
        }

        return null;
    }

    public List<Registration> getAllRegistrations(Long tournamentId) {
        return registrationRepository.findByTournamentId(tournamentId);
    }

    public Registration getRegistration(Long tournamentId, Long playerId) {
        return registrationRepository.findByTournamentIdAndPlayerId(tournamentId, playerId);
    }

    public int countRegistrationsByTournamentId(Long tournamentId) {
        return registrationRepository.countByTournamentId(tournamentId);
    }
}