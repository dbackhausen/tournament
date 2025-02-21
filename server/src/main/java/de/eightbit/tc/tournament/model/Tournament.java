package de.eightbit.tc.tournament.model;


import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
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

    @ElementCollection
    @CollectionTable(name = "tournament_days", joinColumns = @JoinColumn(name = "tournament_id"))
    @Column(name = "day")
    private List<LocalDate> selectedDays;

    @ElementCollection
    @CollectionTable(name = "tournament_types", joinColumns = @JoinColumn(name = "tournament_id"))
    @Column(name = "type")
    @Enumerated(EnumType.STRING)
    private List<TournamentType> tournamentTypes;
}
