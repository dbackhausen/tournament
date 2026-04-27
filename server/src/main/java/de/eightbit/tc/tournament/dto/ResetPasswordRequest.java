package de.eightbit.tc.tournament.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Token must not be empty")
    private String token;
    @NotBlank(message = "Password must not be empty")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String newPassword;
}
