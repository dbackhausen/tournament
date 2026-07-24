package de.eightbit.tc.tournament.repository;

import de.eightbit.tc.tournament.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByTournamentIdOrderByDateAscTimeAsc(Long tournamentId);

    void deleteByTournamentId(Long tournamentId);
}
