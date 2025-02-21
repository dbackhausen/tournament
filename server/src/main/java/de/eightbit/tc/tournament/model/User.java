package de.eightbit.tc.tournament.model;

import de.eightbit.tc.tournament.util.Gender;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "users")
public abstract class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String password;
    @Column(nullable = false)
    private String role = Role.PLAYER.toString();

    public User() {
    }

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public User(String username, String password, Role role) {
        this.username = username;
        this.password = password;
        this.setRole(role);
    }

    public void setRole(Role role) {
        this.role = role != null ? role.name() : null;
    }

    public Role getRoleAsEnum() {
        return role != null ? Role.valueOf(role) : null;
    }
}
