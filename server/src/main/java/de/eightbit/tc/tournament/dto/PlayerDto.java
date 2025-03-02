package de.eightbit.tc.tournament.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import de.eightbit.tc.tournament.model.Player;
import de.eightbit.tc.tournament.util.Gender;
import jakarta.persistence.Column;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PlayerDto {
    private Long id;
    private String username;
    private Gender gender = Gender.MALE;
    private String title;
    private String firstname;
    private String lastname;
    private String email;
    private LocalDate birthdate;
    private String phone;
    private String mobile;
    private Double performanceClass = 25.0;

    @JsonIgnore
    private String password;
    @JsonFormat
    private String role;
    @JsonFormat
    private String roleAsEnum;

    public PlayerDto() {}

    public PlayerDto(Player player) {
        this.id = player.getId();
        this.username = player.getUsername();
        this.gender = player.getGender();
        this.title = player.getTitle();
        this.firstname = player.getFirstname();
        this.lastname = player.getLastname();
        this.email = player.getEmail();
        this.birthdate = player.getBirthdate();
        this.phone = player.getPhone();
        this.mobile = player.getMobile();
        this.performanceClass = player.getPerformanceClass();
    }
}
