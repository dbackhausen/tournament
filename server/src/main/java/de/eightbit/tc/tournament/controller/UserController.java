package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.PasswordUpdateDto;
import de.eightbit.tc.tournament.dto.UserDto;
import de.eightbit.tc.tournament.model.User;
import de.eightbit.tc.tournament.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    private final PasswordEncoder passwordEncoder;

    public UserController(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers().stream()
                .map(userService::mapToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/players")
    public List<UserDto> getAllPlayers() {
        return userService.getAllPlayers().stream()
                .map(userService::mapToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/admins")
    public List<UserDto> getAllAdmins() {
        return userService.getAllAdmins().stream()
                .map(userService::mapToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        if (user.isPresent()) {
            UserDto userDto = userService.mapToDto(user.get());
            return ResponseEntity.ok(userDto);
        } else {
            return ResponseEntity.notFound().build(); // return 404
        }
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto dto) {
        if (dto != null) {
            User createdUser = userService.createUser(userService.mapToEntity(dto));
            return ResponseEntity.ok(userService.mapToDto(createdUser));
        } else {
            return ResponseEntity.badRequest().build(); // return 404
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserDto dto) {
        if (!id.equals(dto.getId())) {
            return ResponseEntity.badRequest().body(null);
        }

        return userService.getUserById(id)
                .map(existingUser -> {
                    User updatedUser = userService.mapToEntity(dto);
                    updatedUser.setPassword(existingUser.getPassword());
                    User saveddUser = userService.updateUser(updatedUser);
                    return ResponseEntity.ok(userService.mapToDto(updatedUser));
                })
                .orElseGet(() -> ResponseEntity.notFound().build()); // return 404
    }

    @DeleteMapping("{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(@PathVariable Long id, @RequestBody PasswordUpdateDto dto) {
        if (!dto.isValid()) {
            return ResponseEntity.badRequest().body("Invalid password!");
        }

        return userService.getUserById(id)
                .map(user -> {
                    if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid existing password!");
                    }

                    user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
                    userService.updateUser(user);
                    return ResponseEntity.ok("Password successfully updated!");
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}