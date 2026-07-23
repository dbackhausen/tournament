package de.eightbit.tc.tournament.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DashboardMessageDto {
    @NotBlank(message = "Nachricht darf nicht leer sein")
    @Size(max = 1000, message = "Nachricht darf höchstens 1000 Zeichen lang sein")
    private String message;
}
