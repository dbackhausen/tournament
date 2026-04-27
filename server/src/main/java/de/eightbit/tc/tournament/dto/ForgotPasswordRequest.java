package de.eightbit.tc.tournament.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "E-Mail must not be empty")
    @Email(message = "Must be a valid email address")
    private String email;
}
