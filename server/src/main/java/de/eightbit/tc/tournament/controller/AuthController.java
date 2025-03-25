package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.*;
import de.eightbit.tc.tournament.model.Role;
import de.eightbit.tc.tournament.model.User;
import de.eightbit.tc.tournament.service.UserService;
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
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegistrationDto dto) {
        if (userService.getUserByEmail(dto.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("E-Mail address already registered");
        }

        dto.setPassword(passwordEncoder.encode(dto.getPassword()));
        User newUser = new User();
        newUser.setEmail(dto.getEmail());
        newUser.setPassword(dto.getPassword());
        newUser.setGender(dto.getGender());
        newUser.setFirstName(dto.getFirstName());
        newUser.setLastName(dto.getFirstName());
        newUser.setMobile(dto.getMobile());
        newUser.getRoles().add(Role.PLAYER);
        newUser.setActive(false); // not active till registration confirmation

        User saveUser = userService.createUser(newUser);
        return ResponseEntity.ok(saveUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> user = userService.getUserByEmail(loginRequest.getEmail());
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
        User existingUser = user.get();
        if (!passwordEncoder.matches(loginRequest.getPassword(), existingUser.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
        String token = jwtUtil.generateToken(existingUser.getEmail());
        UserDto userDto = userService.mapToDto(existingUser);
        return ResponseEntity.ok(new AuthResponse(token, userDto));
    }
}
