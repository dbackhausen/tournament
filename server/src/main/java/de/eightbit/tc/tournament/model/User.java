package de.eightbit.tc.tournament.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import de.eightbit.tc.tournament.dto.UserRegistrationDto;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_email", columnList = "email")
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password;
    @Column(nullable = false)
    private String gender;
    private String title;
    @Column(nullable = false)
    private String firstName;
    @Column(nullable = false)
    private String lastName;
    @Column(nullable = false)
    private String mobile;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthdate;
    private Double performanceClass;
    private Float strength;
    private boolean active;
    @Column(unique = true)
    private String resetToken;
    private LocalDateTime resetTokenExpiry;

    @Column(unique = true)
    private String confirmationToken;
    private LocalDateTime confirmationTokenExpiry;

    @Lob
    @Column(name = "profile_image", columnDefinition = "LONGBLOB")
    private byte[] profileImage;

    @Column(name = "profile_image_type")
    private String profileImageType;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    private Set<Role> roles = new HashSet<>();

    public boolean isAdmin() {
        return roles.contains(Role.ADMIN);
    }

    public boolean isPlayer() {
        return roles.contains(Role.PLAYER);
    }
}
