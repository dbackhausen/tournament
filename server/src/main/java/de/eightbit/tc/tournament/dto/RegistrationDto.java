package de.eightbit.tc.tournament.dto;

import de.eightbit.tc.tournament.model.TournamentType;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class RegistrationDto {
    private Long id;
    private TournamentDto tournament;
    private UserDto user;
    private List<SelectedDay> selectedDays;
    private List<String> selectedTypes;
    private String notes;

    @Data
    public static class SelectedDay {
        private LocalDate date;
        private LocalTime time;
    }
}