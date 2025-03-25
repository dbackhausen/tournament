package de.eightbit.tc.tournament.dto;

import de.eightbit.tc.tournament.model.Role;
import de.eightbit.tc.tournament.model.User;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class UserRegistrationDto {
    private String gender;
    private String firstName;
    private String lastName;
    private String mobile;
    private String email;
    private String password;
}