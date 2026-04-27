package de.eightbit.tc.tournament.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRegistrationDto {
    @NotBlank(message = "Gender must not be empty")
    private String gender;
    @NotBlank(message = "First name must not be empty")
    private String firstName;
    @NotBlank(message = "Last name must not be empty")
    private String lastName;
    @NotBlank(message = "Mobile must not be empty")
    private String mobile;
    @Email(message = "Must be a valid email address")
    @NotBlank(message = "Email must not be empty")
    private String email;
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;
}
