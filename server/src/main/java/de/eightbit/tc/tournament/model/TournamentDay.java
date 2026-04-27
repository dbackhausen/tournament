package de.eightbit.tc.tournament.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Entity
public class TournamentDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime time1;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime time2;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime time3;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    @JsonBackReference
    private Tournament tournament;

    public TournamentDay() {}

    public TournamentDay(LocalDate date, LocalTime time1, LocalTime time2, LocalTime time3) {
        this.date = date;
        this.time1 = time1;
        this.time2 = time2;
        this.time3 = time3;
    }
}
