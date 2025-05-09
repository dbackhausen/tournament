package de.eightbit.tc.tournament.repository;

import de.eightbit.tc.tournament.model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
}
