package de.eightbit.tc.tournament.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "tournaments")
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200, nullable = false)
    private String name;
    @Column(length = 1000)
    private String description;
    @Column(length = 1000)
    private String additionalNotes;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime deadline;

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<TournamentDay> tournamentDays = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "tournament_types", joinColumns = @JoinColumn(name = "tournament_id"))
    @Column(name = "type")
    @Enumerated(EnumType.STRING)
    private List<TournamentType> tournamentTypes;

    public void setTournamentDays(List<TournamentDay> tournamentDays) {
        this.tournamentDays.clear();
        if (tournamentDays != null) {
            for (TournamentDay day : tournamentDays) {
                this.addTournamentDay(day);
            }
        }
    }

    public void addTournamentDay(TournamentDay tournamentDay) {
        tournamentDays.add(tournamentDay);
        tournamentDay.setTournament(this);
    }

    public void removeTournamentDay(TournamentDay tournamentDay) {
        tournamentDays.remove(tournamentDay);
        tournamentDay.setTournament(null);
    }
}
