package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.PasswordUpdateDto;
import de.eightbit.tc.tournament.dto.UserDto;
import de.eightbit.tc.tournament.model.User;
import de.eightbit.tc.tournament.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

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
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers().stream()
                .map(userService::mapToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/players")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> getAllPlayers() {
        return userService.getAllPlayers().stream()
                .map(userService::mapToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto dto) {
        if (dto != null) {
            User createdUser = userService.createUser(userService.mapToEntity(dto));
            return ResponseEntity.ok(userService.mapToDto(createdUser));
        } else {
            return ResponseEntity.badRequest().build(); // return 404
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userService.isOwner(#id, authentication.name)")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserDto dto) {
        if (!id.equals(dto.getId())) {
            return ResponseEntity.badRequest().body(null);
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return userService.getUserById(id)
                .map(existingUser -> {
                    User updatedUser = userService.mapToEntity(dto);
                    updatedUser.setPassword(existingUser.getPassword());
                    if (!isAdmin) {
                        updatedUser.setRoles(existingUser.getRoles());
                        updatedUser.setActive(existingUser.isActive());
                    }
                    User saveddUser = userService.updateUser(updatedUser);
                    return ResponseEntity.ok(userService.mapToDto(saveddUser));
                })
                .orElseGet(() -> ResponseEntity.notFound().build()); // return 404
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PostMapping("/{id}/profile-image")
    @PreAuthorize("hasRole('ADMIN') or @userService.isOwner(#id, authentication.name)")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file provided");
        }
        return userService.getUserById(id).map(user -> {
            try {
                user.setProfileImage(file.getBytes());
                user.setProfileImageType(file.getContentType());
                userService.updateUser(user);
                return ResponseEntity.ok().build();
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/profile-image")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable Long id) {
        return userService.getUserById(id)
                .filter(user -> user.getProfileImage() != null)
                .map(user -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(
                                user.getProfileImageType() != null ? user.getProfileImageType() : "image/jpeg"))
                        .body(user.getProfileImage()))
                .orElseGet(() -> ResponseEntity.notFound().build());
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