package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.model.Player;
import de.eightbit.tc.tournament.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    @Autowired
    private PlayerRepository playerRepository;

    @GetMapping
    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    @PostMapping
    public Player createPlayer(@RequestBody Player player) {
        return playerRepository.save(player);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Player> getPlayerById(@PathVariable Long id) {
        return playerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Player> updatePlayer(@PathVariable Long id, @RequestBody Player updatedPlayer) {
        return playerRepository.findById(id)
                .map(player -> {
                    player.setGender(updatedPlayer.getGender());
                    player.setTitle(updatedPlayer.getTitle());
                    player.setFirstname(updatedPlayer.getFirstname());
                    player.setLastname(updatedPlayer.getLastname());
                    player.setEmail(updatedPlayer.getEmail());
                    player.setPhone(updatedPlayer.getPhone());
                    player.setMobile(updatedPlayer.getMobile());
                    player.setBirthdate(updatedPlayer.getBirthdate());
                    player.setPerformanceClass(updatedPlayer.getPerformanceClass());
                    Player savedPlayer = playerRepository.save(player);
                    return ResponseEntity.ok(savedPlayer);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlayer(@PathVariable Long id) {
        playerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
