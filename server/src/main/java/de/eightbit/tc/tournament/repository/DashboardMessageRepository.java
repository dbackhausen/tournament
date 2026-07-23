package de.eightbit.tc.tournament.repository;

import de.eightbit.tc.tournament.model.DashboardMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DashboardMessageRepository extends JpaRepository<DashboardMessage, Long> {
}
