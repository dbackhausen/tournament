package de.eightbit.tc.tournament.dto;

import de.eightbit.tc.tournament.model.Player;
import jakarta.persistence.Column;
import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String firstname;
    private String lastname;
    private String email;
    private String role;

    public UserDto(Player player) {
        this.id = player.getId();
        this.username = player.getUsername();
        this.firstname = player.getFirstname();
        this.lastname = player.getLastname();
        this.email = player.getEmail();
        this.role = player.getRole();
    }
}
