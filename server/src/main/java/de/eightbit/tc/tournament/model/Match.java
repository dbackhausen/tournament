package de.eightbit.tc.tournament.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    @JsonBackReference
    private Tournament tournament;

    private LocalDate date;
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
