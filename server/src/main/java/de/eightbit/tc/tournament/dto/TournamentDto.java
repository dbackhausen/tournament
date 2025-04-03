package de.eightbit.tc.tournament.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import de.eightbit.tc.tournament.model.TournamentType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TournamentDto {
    private Long id;
    private String name;
    private String description;
    private String additionalNotes;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime deadline;
    private List<TournamentDayDto> tournamentDays;
    private List<TournamentType> tournamentTypes;
    private int registrationCount = 0;

    @Data
    public static class TournamentDayDto {
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate date;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime startTime;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime endTime;
    }
}