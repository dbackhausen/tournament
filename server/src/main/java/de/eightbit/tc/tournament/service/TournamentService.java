package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.dto.RegistrationDto;
import de.eightbit.tc.tournament.dto.TournamentDto;
import de.eightbit.tc.tournament.model.*;
import de.eightbit.tc.tournament.repository.PlayerRepository;
import de.eightbit.tc.tournament.repository.RegistrationRepository;
import de.eightbit.tc.tournament.repository.TournamentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TournamentService {
    @Autowired
    private TournamentRepository tournamentRepository;

    public Optional<Tournament> getTournamentById(Long id) {
        return tournamentRepository.findById(id);
    }

    public Tournament createTournament(TournamentDto tournamentDto) {
        Tournament tournament = new Tournament();
        tournament.setName(tournamentDto.getName());
        tournament.setDescription(tournamentDto.getDescription());
        tournament.setAdditionalNotes(tournamentDto.getAdditionalNotes());
        tournament.setStartDate(tournamentDto.getStartDate());
        tournament.setEndDate(tournamentDto.getEndDate());
        tournament.setTournamentTypes(tournamentDto.getTournamentTypes());

        List<TournamentDay> days = tournamentDto.getTournamentDays().stream()
                .map(dayDto -> new TournamentDay(dayDto.getDate(), dayDto.getStartTime(), dayDto.getEndTime()))
                .collect(Collectors.toList());
        tournament.setTournamentDays(days);

        return tournamentRepository.save(tournament);
    }

    public Optional<Tournament> updateTournament(Long id, TournamentDto tournamentDto) {
        Optional<Tournament> existingTournament = tournamentRepository.findById(id);

        if (existingTournament.isPresent()) {
            Tournament tournament = existingTournament.get();
            tournament.setName(tournamentDto.getName());
            tournament.setDescription(tournamentDto.getDescription());
            tournament.setAdditionalNotes(tournamentDto.getAdditionalNotes());
            tournament.setStartDate(tournamentDto.getStartDate());
            tournament.setEndDate(tournamentDto.getEndDate());
            tournament.setTournamentTypes(tournamentDto.getTournamentTypes());

            List<TournamentDay> days = tournamentDto.getTournamentDays().stream()
                    .map(dayDto -> new TournamentDay(dayDto.getDate(), dayDto.getStartTime(), dayDto.getEndTime()))
                    .collect(Collectors.toList());
            tournament.setTournamentDays(days);

            return Optional.of(tournamentRepository.save(tournament));
        }

        return Optional.empty();
    }

    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    public void deleteTournament(Long id) {
        tournamentRepository.deleteById(id);
    }
}