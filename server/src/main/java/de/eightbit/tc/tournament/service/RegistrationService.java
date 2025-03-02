package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.dto.RegistrationDto;
import de.eightbit.tc.tournament.model.*;
import de.eightbit.tc.tournament.repository.PlayerRepository;
import de.eightbit.tc.tournament.repository.RegistrationRepository;
import de.eightbit.tc.tournament.repository.TournamentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
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
        Registration finalRegistration = registration;

        List<ParticipationRequest> participationRequests = dto.getSelectedDays().stream()
                .map(reqDto -> {
                    ParticipationRequest req = new ParticipationRequest();
                    req.setDate(reqDto.getDate());
                    req.setTime(reqDto.getTime());
                    req.setRegistration(finalRegistration);
                    return req;
                }).collect(Collectors.toList());

        registration.setParticipationRequests(participationRequests);
        registration = registrationRepository.save(registration);

        return registration;
    }

    public List<Registration> getAllRegistrations(Long tournamentId) {
        return registrationRepository.findByTournamentId(tournamentId);
    }
}