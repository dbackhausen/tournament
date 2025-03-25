package de.eightbit.tc.tournament.repository;

import de.eightbit.tc.tournament.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import de.eightbit.tc.tournament.model.*;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByTournamentId(Long tournamentId);

    List<Registration> findByUserId(Long playerId);

    int countByTournamentId(Long tournamentId);

    boolean existsByTournamentIdAndUserId(Long tournamentId, Long userId);

    Optional<Registration> findByTournamentIdAndUserId(Long tournamentId, Long userId);
}