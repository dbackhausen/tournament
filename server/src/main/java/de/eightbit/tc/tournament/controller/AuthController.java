package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.AuthResponse;
import de.eightbit.tc.tournament.dto.LoginRequest;
import de.eightbit.tc.tournament.dto.UserDto;
import de.eightbit.tc.tournament.model.Player;
import de.eightbit.tc.tournament.repository.PlayerRepository;
import de.eightbit.tc.tournament.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Player player) {
        if (playerRepository.findByUsername(player.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
        }

        if (playerRepository.findByEmail(player.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("E-Mail address already registered");
        }

        player.setPassword(passwordEncoder.encode(player.getPassword()));
        Player savedPlayer = playerRepository.save(player);

        return ResponseEntity.ok(savedPlayer);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<Player> playerOptional = playerRepository.findByUsername(request.getUsername());

        if (playerOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

        Player player = playerOptional.get();
        if (!passwordEncoder.matches(request.getPassword(), player.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

        String token = jwtUtil.generateToken(player.getUsername());
        UserDto user = new UserDto(player);

        return ResponseEntity.ok(new AuthResponse(token, user));
    }
}
