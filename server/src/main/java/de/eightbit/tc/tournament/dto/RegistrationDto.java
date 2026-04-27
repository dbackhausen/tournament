package de.eightbit.tc.tournament.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class RegistrationDto {
    private Long id;
    @NotNull(message = "Tournament must not be null")
    private TournamentDto tournament;
    @NotNull(message = "User must not be null")
    private UserDto user;
    @NotNull(message = "Selected days must not be null")
    private List<SelectedDay> selectedDays;
    @NotNull(message = "Selected types must not be null")
    private List<String> selectedTypes;
    private String notes;
    private boolean payed;

    @Data
    public static class SelectedDay {
        private LocalDate date;
        private LocalTime time;
    }
}
