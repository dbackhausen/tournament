package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.model.Player;
import de.eightbit.tc.tournament.repository.PlayerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PlayerControllerTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private PlayerRepository playerRepository;

    @Test
    public void testCreatePlayer() {
        Player player = new Player("John", "Doe", "john.doe@test.com");
        ResponseEntity<Player> response = restTemplate.postForEntity("/api/players", player, Player.class);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody().getId());
    }

    @Test
    public void testGetAllPlayers() {
        playerRepository.save(new Player("Jane", "Smith", "jane.smith@test.com"));
        playerRepository.save(new Player("Bob", "Johnson", "bob.johnson@test.com"));

        ResponseEntity<Player[]> response = restTemplate.getForEntity("/api/players", Player[].class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().length);
    }

    // Weitere Tests für UPDATE und DELETE
}
