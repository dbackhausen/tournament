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
    private LocalTime startTime;
    private LocalTime endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    @JsonBackReference
    private Tournament tournament;

    public TournamentDay() {}

    public TournamentDay(LocalDate date, LocalTime startTime, LocalTime endTime) {
        this.date = date;
        setStartTime(startTime);
        setEndTime(endTime);
    }

    public void setStartTime(LocalTime startTime) {
        if (this.endTime != null && startTime.isAfter(this.endTime)) {
            throw new IllegalArgumentException("The start time must not be after the end time.");
        }
        this.startTime = startTime;
    }

    public void setEndTime(LocalTime endTime) {
        if (this.startTime != null && endTime.isBefore(this.startTime)) {
            throw new IllegalArgumentException("The end time must not be before the start time.");
        }
        this.endTime = endTime;
    }
}