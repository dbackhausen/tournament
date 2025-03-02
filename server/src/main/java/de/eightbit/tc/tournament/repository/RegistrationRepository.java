package de.eightbit.tc.tournament.repository;

import de.eightbit.tc.tournament.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import de.eightbit.tc.tournament.model.*;

import java.util.List;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    boolean existsByTournamentAndPlayer(Tournament tournament, Player player);

    List<Registration> findByTournamentId(Long tournamentId);

    List<Registration> findByPlayerId(Long playerId);
}