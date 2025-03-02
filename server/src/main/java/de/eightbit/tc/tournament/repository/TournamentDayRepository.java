package de.eightbit.tc.tournament.repository;

import de.eightbit.tc.tournament.model.TournamentDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TournamentDayRepository extends JpaRepository<TournamentDay, Long> {
}