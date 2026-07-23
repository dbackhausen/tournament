package de.eightbit.tc.tournament.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import de.eightbit.tc.tournament.model.TournamentType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TournamentDto {
    private Long id;
    @NotBlank(message = "Tournament name must not be empty")
    private String name;
    private String description;
    private String additionalNotes;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime deadline;
    @Min(value = 0, message = "Startgeld darf nicht negativ sein")
    private int entryFee;
    private List<TournamentDayDto> tournamentDays;
    private List<TournamentType> tournamentTypes;
    @Size(min = 1, max = 4, message = "Es müssen zwischen 1 und 4 Teams angegeben werden")
    private List<@NotBlank(message = "Teamname darf nicht leer sein") String> teams;
    private int registrationCount = 0;

    @Data
    public static class TournamentDayDto {
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate date;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime time1;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime time2;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime time3;
    }
}