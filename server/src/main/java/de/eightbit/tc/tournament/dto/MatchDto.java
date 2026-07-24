package de.eightbit.tc.tournament.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class MatchDto {
    private Long id;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime time;

    private Integer court;
    private String mode;

    private String teamA;
    private String teamAPlayer1;
    private String teamAPlayer2;

    private String teamB;
    private String teamBPlayer1;
    private String teamBPlayer2;

    private String result;
    private String status;
}
