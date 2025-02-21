package de.eightbit.tc.tournament.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Username must not be empty")
    @Size(min = 6, message = "Username must be 6 characters long")
    private String username;

    @NotBlank(message = "Password must not be empty")
    @Size(min = 6, message = "Password must be 6 characters long")
    private String password;
}
