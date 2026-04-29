package de.eightbit.tc.tournament.repository;

import de.eightbit.tc.tournament.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r = 'PLAYER'")
    List<User> findAllPlayers();

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r = 'ADMIN'")
    List<User> findAllAdmins();

    Optional<User> findByConfirmationToken(String confirmationToken);

    @Modifying
    @Transactional
    @Query("DELETE FROM User u WHERE u.active = false AND u.confirmationTokenExpiry < :now")
    void deleteExpiredUnconfirmedUsers(@Param("now") LocalDateTime now);
}
