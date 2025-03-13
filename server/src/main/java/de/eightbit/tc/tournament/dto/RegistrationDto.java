package de.eightbit.tc.tournament.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class RegistrationDto {
    private Long id;
    private TournamentDto tournament;
    private PlayerDto player;
    private List<RegistrationDto.SelectedDay> selectedDays;
    private List<String> selectedTypes;
    private String notes;

    @Data
    public static class SelectedDay {
        private LocalDate date;
        private LocalTime time;
    }
}